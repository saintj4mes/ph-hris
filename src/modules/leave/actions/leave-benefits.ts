"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission, requireUser } from "@/shared/platform/auth";

async function balance(tx: Prisma.TransactionClient, employeeId: string, leaveTypeId: string) {
  const result = await tx.leaveLedgerEntry.aggregate({ where: { employeeId, leaveTypeId }, _sum: { days: true } });
  return result._sum.days ?? new Prisma.Decimal(0);
}

async function dailyRate(tx: Prisma.TransactionClient, employeeId: string) {
  const employee = await tx.employee.findUniqueOrThrow({ where: { id: employeeId }, select: { companyId: true } });
  const today = new Date();
  const [assignment, policy] = await Promise.all([
    tx.salaryAssignment.findFirst({ where: { employeeId, effectiveFrom: { lte: today }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: today } }] }, orderBy: { effectiveFrom: "desc" } }),
    tx.payrollPolicy.findUnique({ where: { companyId: employee.companyId } }),
  ]);
  if (!assignment) throw new Error("An active salary assignment is required to estimate encashment.");
  const divisor = policy?.monthlyToDailyDivisor ?? new Prisma.Decimal(26);
  const hours = policy?.scheduledHoursPerDay ?? new Prisma.Decimal(8);
  if (assignment.payType === "MONTHLY" && assignment.monthlyRate) return assignment.monthlyRate.div(divisor);
  if (assignment.payType === "DAILY" && assignment.dailyRate) return assignment.dailyRate;
  if (assignment.payType === "HOURLY" && assignment.hourlyRate) return assignment.hourlyRate.mul(hours);
  throw new Error("The active salary assignment is missing the rate required for leave encashment.");
}

export async function requestLeaveEncashmentAction(input: { leaveTypeId: string; days: string }) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const days = new Prisma.Decimal(input.days);
  if (!days.isFinite() || days.lessThanOrEqualTo(0)) throw new Error("Enter a positive number of leave days.");
  return prisma.$transaction(async (tx) => {
    const type = await tx.leaveType.findFirst({ where: { id: input.leaveTypeId, active: true, encashable: true } });
    if (!type) throw new Error("This leave type is not configured for encashment.");
    const available = await balance(tx, user.employeeId!, type.id);
    if (available.lessThan(days)) throw new Error("The requested encashment exceeds your available balance.");
    const amount = days.mul(await dailyRate(tx, user.employeeId!)).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const request = await tx.leaveEncashment.create({ data: { employeeId: user.employeeId!, leaveTypeId: type.id, days, amount, status: "PENDING" } });
    await tx.approvalRequest.create({ data: { requestType: "LEAVE_ENCASHMENT", documentId: request.id, submittedById: user.id } });
    await recordAudit(tx, { actorUserId: user.id, entityType: "LeaveEncashment", entityId: request.id, action: "REQUEST", after: { days: days.toString(), amount: amount.toString(), leaveType: type.code } });
    return request;
  }, { isolationLevel: "Serializable" });
}

export async function requestCompensatoryLeaveAction(input: { leaveTypeId: string; workDate: string; hoursWorked: string; reason: string }) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const hoursWorked = new Prisma.Decimal(input.hoursWorked);
  const workDate = new Date(`${input.workDate}T00:00:00.000Z`);
  if (!hoursWorked.isFinite() || hoursWorked.lessThanOrEqualTo(0) || Number.isNaN(workDate.valueOf()) || workDate > new Date() || input.reason.trim().length < 3) throw new Error("Enter a past work date, positive hours, and a reason.");
  return prisma.$transaction(async (tx) => {
    const employee = await tx.employee.findUniqueOrThrow({ where: { id: user.employeeId! }, select: { companyId: true } });
    const type = await tx.leaveType.findFirst({ where: { id: input.leaveTypeId, companyId: employee.companyId, active: true, compensatory: true } });
    if (!type) throw new Error("Select a leave type configured for compensatory time.");
    const policy = await tx.payrollPolicy.findUnique({ where: { companyId: employee.companyId } });
    const scheduledHours = policy?.scheduledHoursPerDay ?? new Prisma.Decimal(8);
    const earned = hoursWorked.div(scheduledHours).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const request = await tx.compensatoryLeaveRequest.create({ data: { employeeId: user.employeeId!, leaveTypeId: type.id, workDate, hoursWorked, leaveDaysEarned: earned, reason: input.reason.trim(), status: "PENDING" } });
    await tx.approvalRequest.create({ data: { requestType: "COMPENSATORY_LEAVE", documentId: request.id, submittedById: user.id } });
    await recordAudit(tx, { actorUserId: user.id, entityType: "CompensatoryLeaveRequest", entityId: request.id, action: "REQUEST", after: { workDate: input.workDate, hoursWorked: hoursWorked.toString(), leaveDaysEarned: earned.toString() } });
    return request;
  });
}

export async function reviewLeaveBenefitAction(input: { requestId: string; kind: "ENCASHMENT" | "COMPENSATORY"; decision: "APPROVE" | "REJECT"; comment?: string }) {
  const reviewer = await requirePermission("leave", "approve");
  return prisma.$transaction(async (tx) => {
    if (input.kind === "ENCASHMENT") {
      const request = await tx.leaveEncashment.findFirst({ where: { id: input.requestId, status: "PENDING" }, include: { employee: true, leaveType: true } });
      if (!request) throw new Error("Pending leave encashment was not found.");
      const decision = input.decision === "APPROVE" ? "APPROVED" : "REJECTED";
      if (decision === "APPROVED") {
        const current = await balance(tx, request.employeeId, request.leaveTypeId);
        if (current.lessThan(request.days)) throw new Error("The employee no longer has enough leave balance to encash.");
        const balanceAfter = current.minus(request.days);
        await tx.leaveLedgerEntry.create({ data: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, entryType: "ENCASHMENT", postingDate: new Date(), days: request.days.negated(), balanceAfter, description: `Approved leave encashment: ${request.days.toString()} day(s)`, createdBy: reviewer.id, sourceKey: `leave-encashment:${request.id}` } });
      }
      await tx.leaveEncashment.update({ where: { id: request.id }, data: { status: decision } });
      await tx.approvalRequest.updateMany({ where: { requestType: "LEAVE_ENCASHMENT", documentId: request.id, status: "PENDING" }, data: { status: decision, completedAt: new Date() } });
      await recordAudit(tx, { actorUserId: reviewer.id, entityType: "LeaveEncashment", entityId: request.id, action: decision, before: { status: "PENDING" }, after: { status: decision, comment: input.comment?.trim() || null } });
      return { status: decision };
    }
    const request = await tx.compensatoryLeaveRequest.findFirst({ where: { id: input.requestId, status: "PENDING" } });
    if (!request) throw new Error("Pending compensatory leave request was not found.");
    const decision = input.decision === "APPROVE" ? "APPROVED" : "REJECTED";
    if (decision === "APPROVED") {
      const current = await balance(tx, request.employeeId, request.leaveTypeId);
      const balanceAfter = current.plus(request.leaveDaysEarned);
      await tx.leaveLedgerEntry.create({ data: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, entryType: "ACCRUAL", postingDate: new Date(), days: request.leaveDaysEarned, balanceAfter, description: `Compensatory time approved for ${request.workDate.toISOString().slice(0, 10)}`, createdBy: reviewer.id, sourceKey: `compensatory-leave:${request.id}` } });
    }
    await tx.compensatoryLeaveRequest.update({ where: { id: request.id }, data: { status: decision } });
    await tx.approvalRequest.updateMany({ where: { requestType: "COMPENSATORY_LEAVE", documentId: request.id, status: "PENDING" }, data: { status: decision, completedAt: new Date() } });
    await recordAudit(tx, { actorUserId: reviewer.id, entityType: "CompensatoryLeaveRequest", entityId: request.id, action: decision, before: { status: "PENDING" }, after: { status: decision, comment: input.comment?.trim() || null } });
    return { status: decision };
  }, { isolationLevel: "Serializable" });
}

export async function markLeaveEncashmentPaidAction(requestId: string) {
  const actor = await requirePermission("leave", "allocate");
  return prisma.$transaction(async (tx) => {
    const request = await tx.leaveEncashment.findFirst({ where: { id: requestId, status: "APPROVED", paidAt: null } });
    if (!request) throw new Error("Only approved, unpaid encashments can be marked paid.");
    const saved = await tx.leaveEncashment.update({ where: { id: request.id }, data: { paidAt: new Date() } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "LeaveEncashment", entityId: request.id, action: "MARK_PAID", after: { amount: request.amount.toString() } });
    return saved;
  });
}

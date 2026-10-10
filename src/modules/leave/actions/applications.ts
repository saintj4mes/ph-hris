"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission, requireUser } from "@/shared/platform/auth";

export async function createLeaveTypeAction(input: { companyId: string; code: string; name: string; paid: boolean; requiresDocument: boolean; allowNegativeBalance: boolean; encashable?: boolean; compensatory?: boolean }) {
  const actor = await requirePermission("leave_type", "create");
  const code = input.code.trim().toUpperCase();
  if (!code || input.name.trim().length < 2) throw new Error("Leave type code and name are required.");
  const row = await prisma.leaveType.create({ data: { companyId: input.companyId, code, name: input.name.trim(), paid: input.paid, requiresDocument: input.requiresDocument, allowNegativeBalance: input.allowNegativeBalance, encashable: input.encashable ?? false, compensatory: input.compensatory ?? false } });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "LeaveType", entityId: row.id, action: "CREATE", after: { code, name: row.name, paid: row.paid } });
  return row;
}

export async function createLeavePeriodAction(input: { companyId: string; name: string; startsOn: string; endsOn: string }) {
  const actor = await requirePermission("leave_period", "create");
  const startsOn = new Date(`${input.startsOn}T00:00:00.000Z`); const endsOn = new Date(`${input.endsOn}T00:00:00.000Z`);
  if (input.name.trim().length < 2 || Number.isNaN(startsOn.valueOf()) || Number.isNaN(endsOn.valueOf()) || endsOn < startsOn) throw new Error("Enter a valid leave period name and date range.");
  const row = await prisma.leavePeriod.create({ data: { companyId: input.companyId, name: input.name.trim(), startsOn, endsOn, active: true } });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "LeavePeriod", entityId: row.id, action: "CREATE", after: { name: row.name, startsOn: input.startsOn, endsOn: input.endsOn } });
  return row;
}

function asDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf())) throw new Error("Enter a valid leave date.");
  return date;
}

function leaveDates(start: Date, end: Date, includeHolidays: boolean, holidays: Set<string>): number {
  if (end < start) throw new Error("End date must be on or after start date.");
  let days = 0;
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const weekday = cursor.getUTCDay();
    const dateKey = cursor.toISOString().slice(0, 10);
    if (weekday !== 0 && weekday !== 6 && (includeHolidays || !holidays.has(dateKey))) days += 1;
  }
  return days;
}

async function currentBalance(tx: Prisma.TransactionClient, employeeId: string, leaveTypeId: string) {
  const result = await tx.leaveLedgerEntry.aggregate({ where: { employeeId, leaveTypeId }, _sum: { days: true } });
  return result._sum.days ?? new Prisma.Decimal(0);
}

export async function createMyLeaveApplicationAction(input: { leaveTypeId: string; fromDate: string; toDate: string; halfDay?: boolean; reason: string; attachmentUrl?: string }) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const fromDate = asDate(input.fromDate);
  const toDate = asDate(input.toDate);
  if (toDate < fromDate || input.reason.trim().length < 3) throw new Error("Choose a valid date range and provide a reason.");
  const type = await prisma.leaveType.findUniqueOrThrow({ where: { id: input.leaveTypeId } });
  const employee = await prisma.employee.findUniqueOrThrow({ where: { id: user.employeeId } });
  const holidays = await prisma.holidayDate.findMany({
    where: { holidayCalendar: { companyId: employee.companyId, active: true }, holidayDate: { gte: fromDate, lte: toDate } },
    select: { holidayDate: true },
  });
  let days = leaveDates(fromDate, toDate, type.includeHolidays, new Set(holidays.map(({ holidayDate }) => holidayDate.toISOString().slice(0, 10))));
  if (input.halfDay) days = 0.5;
  if (days <= 0) throw new Error("The selected period contains no chargeable workdays.");
  return prisma.leaveApplication.create({
    data: { employeeId: user.employeeId, leaveTypeId: type.id, fromDate, toDate, totalDays: new Prisma.Decimal(days), halfDay: Boolean(input.halfDay), reason: input.reason.trim(), attachmentUrl: input.attachmentUrl || null },
  });
}

export async function submitMyLeaveApplicationAction(applicationId: string) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const employeeId = user.employeeId;
  return prisma.$transaction(async (tx) => {
    const application = await tx.leaveApplication.findFirst({ where: { id: applicationId, employeeId, status: "DRAFT" }, include: { leaveType: true, employee: true } });
    if (!application) throw new Error("Draft leave application not found.");
    if (application.leaveType.requiresDocument && !application.attachmentUrl) throw new Error("This leave type requires supporting documentation.");
    const balance = await currentBalance(tx, application.employeeId, application.leaveTypeId);
    if (!application.leaveType.allowNegativeBalance && balance.lessThan(application.totalDays)) throw new Error("Insufficient leave balance.");
    const updated = await tx.leaveApplication.update({ where: { id: application.id }, data: { status: "OPEN", submittedAt: new Date() } });
    await tx.approvalRequest.create({ data: { requestType: "LEAVE_APPLICATION", documentId: application.id, submittedById: user.id } });
    await recordAudit(tx, { actorUserId: user.id, entityType: "LeaveApplication", entityId: application.id, action: "SUBMIT", before: { status: "DRAFT" }, after: { status: "OPEN" } });
    return updated;
  }, { isolationLevel: "Serializable" });
}

export async function decideLeaveApplicationAction(input: { applicationId: string; decision: "APPROVE" | "REJECT"; comment?: string }) {
  const reviewer = await requirePermission("leave", "approve");
  return prisma.$transaction(async (tx) => {
    const application = await tx.leaveApplication.findFirst({ where: { id: input.applicationId, status: "OPEN" }, include: { employee: { include: { authUser: true } }, leaveType: true } });
    if (!application) throw new Error("Only open leave applications can be reviewed.");
    if (input.decision === "APPROVE") {
      const balance = await currentBalance(tx, application.employeeId, application.leaveTypeId);
      if (!application.leaveType.allowNegativeBalance && balance.lessThan(application.totalDays)) throw new Error("The employee no longer has enough leave balance.");
      const balanceAfter = balance.minus(application.totalDays);
      await tx.leaveLedgerEntry.create({
        data: {
          employeeId: application.employeeId,
          leaveTypeId: application.leaveTypeId,
          applicationId: application.id,
          entryType: "APPLICATION",
          postingDate: application.fromDate,
          days: application.totalDays.negated(),
          balanceAfter,
          description: `Approved leave ${application.fromDate.toISOString().slice(0, 10)} to ${application.toDate.toISOString().slice(0, 10)}`,
          createdBy: reviewer.id,
        },
      });
    }
    const status = input.decision === "APPROVE" ? "APPROVED" : "REJECTED";
    const updated = await tx.leaveApplication.update({ where: { id: application.id }, data: { status, reviewedAt: new Date(), reviewerId: reviewer.id, reviewComment: input.comment?.trim() || null } });
    await tx.approvalRequest.updateMany({ where: { requestType: "LEAVE_APPLICATION", documentId: application.id, status: "PENDING" }, data: { status, completedAt: new Date() } });
    await recordAudit(tx, { actorUserId: reviewer.id, entityType: "LeaveApplication", entityId: application.id, action: input.decision, before: { status: "OPEN" }, after: { status } });
    if (application.employee.authUser) await tx.notification.create({ data: { recipientId: application.employee.authUser.id, category: "LEAVE", title: `Leave ${status.toLowerCase()}`, body: input.comment || `Your leave request was ${status.toLowerCase()}.`, actionUrl: "/portal/leaves" } });
    return updated;
  }, { isolationLevel: "Serializable" });
}

export async function allocateEmployeeLeaveAction(input: { employeeId: string; leaveTypeId: string; leavePeriodId: string; days: string; carryForwardDays?: string }) {
  const actor = await requirePermission("leave", "allocate");
  const days = new Prisma.Decimal(input.days);
  const carryForwardDays = new Prisma.Decimal(input.carryForwardDays ?? "0");
  if (days.lessThan(0) || carryForwardDays.lessThan(0)) throw new Error("Leave allocation cannot be negative.");
  return prisma.$transaction(async (tx) => {
    const allocation = await tx.leaveAllocation.upsert({
      where: { employeeId_leaveTypeId_leavePeriodId: { employeeId: input.employeeId, leaveTypeId: input.leaveTypeId, leavePeriodId: input.leavePeriodId } },
      update: { allocatedDays: days, carryForwardDays },
      create: { employeeId: input.employeeId, leaveTypeId: input.leaveTypeId, leavePeriodId: input.leavePeriodId, allocatedDays: days, carryForwardDays },
    });
    const sourceKey = `manual-allocation:${allocation.id}`;
    const priorEntry = await tx.leaveLedgerEntry.findUnique({ where: { sourceKey } });
    const current = await currentBalance(tx, input.employeeId, input.leaveTypeId);
    const amount = days.plus(carryForwardDays);
    const balanceAfter = current.minus(priorEntry?.days ?? 0).plus(amount);
    await tx.leaveLedgerEntry.upsert({
      where: { sourceKey },
      update: { days: amount, balanceAfter, allocationId: allocation.id, description: "Manual leave allocation", createdBy: actor.id },
      create: { employeeId: input.employeeId, leaveTypeId: input.leaveTypeId, allocationId: allocation.id, entryType: "ALLOCATION", postingDate: new Date(), days: amount, balanceAfter, description: "Manual leave allocation", createdBy: actor.id, sourceKey },
    });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "LeaveAllocation", entityId: allocation.id, action: "ALLOCATE", after: { days: days.toString(), carryForwardDays: carryForwardDays.toString() } });
    return allocation;
  }, { isolationLevel: "Serializable" });
}

export async function createLeavePolicyAction(input: {
  companyId: string;
  name: string;
  effectiveFrom: string;
  details: Array<{ leaveTypeId: string; annualEntitlement: string; accrualFrequency: "ANNUAL" | "MONTHLY" | "UPFRONT"; carryForwardLimit?: string }>;
}) {
  const actor = await requirePermission("leave_type", "create");
  const effectiveFrom = asDate(input.effectiveFrom);
  if (input.name.trim().length < 2 || input.details.length === 0) throw new Error("A policy name and at least one leave type are required.");
  return prisma.$transaction(async (tx) => {
    const policy = await tx.leavePolicy.create({ data: { companyId: input.companyId, name: input.name.trim(), effectiveFrom } });
    for (const detail of input.details) {
      const entitlement = new Prisma.Decimal(detail.annualEntitlement);
      if (entitlement.lessThan(0)) throw new Error("Annual entitlements cannot be negative.");
      const leaveType = await tx.leaveType.findFirst({ where: { id: detail.leaveTypeId, companyId: input.companyId } });
      if (!leaveType) throw new Error("Every leave policy type must belong to the selected company.");
      await tx.leavePolicyDetail.create({ data: {
        leavePolicyId: policy.id, leaveTypeId: leaveType.id, annualEntitlement: entitlement,
        accrualFrequency: detail.accrualFrequency,
        carryForwardLimit: detail.carryForwardLimit ? new Prisma.Decimal(detail.carryForwardLimit) : null,
      } });
    }
    await recordAudit(tx, { actorUserId: actor.id, entityType: "LeavePolicy", entityId: policy.id, action: "CREATE", after: { name: policy.name, detailCount: input.details.length } });
    return policy;
  });
}

export async function assignEmployeeLeavePolicyAction(input: { employeeId: string; leavePolicyId: string; effectiveFrom: string }) {
  const actor = await requirePermission("leave", "allocate");
  const effectiveFrom = asDate(input.effectiveFrom);
  return prisma.$transaction(async (tx) => {
    const [employee, policy] = await Promise.all([
      tx.employee.findUnique({ where: { id: input.employeeId }, select: { id: true, companyId: true } }),
      tx.leavePolicy.findUnique({ where: { id: input.leavePolicyId }, select: { id: true, companyId: true, effectiveFrom: true, effectiveTo: true } }),
    ]);
    if (!employee || !policy || employee.companyId !== policy.companyId) throw new Error("Employee and leave policy must belong to the same company.");
    if (effectiveFrom < policy.effectiveFrom || (policy.effectiveTo && effectiveFrom > policy.effectiveTo)) throw new Error("The policy is not effective on the selected assignment date.");
    const previousEnd = new Date(effectiveFrom.valueOf() - 86_400_000);
    await tx.employeeLeavePolicyAssignment.updateMany({
      where: { employeeId: employee.id, status: "ACTIVE", effectiveFrom: { lt: effectiveFrom }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveFrom } }] },
      data: { effectiveTo: previousEnd },
    });
    const assignment = await tx.employeeLeavePolicyAssignment.upsert({
      where: { employeeId_leavePolicyId_effectiveFrom: { employeeId: employee.id, leavePolicyId: policy.id, effectiveFrom } },
      update: { effectiveTo: null, status: "ACTIVE", createdBy: actor.id },
      create: { employeeId: employee.id, leavePolicyId: policy.id, effectiveFrom, createdBy: actor.id },
    });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "EmployeeLeavePolicyAssignment", entityId: assignment.id, action: "ASSIGN", after: { employeeId: employee.id, leavePolicyId: policy.id, effectiveFrom: input.effectiveFrom } });
    return assignment;
  }, { isolationLevel: "Serializable" });
}

function policyAccrualDays(annual: Prisma.Decimal, frequency: string, start: Date, end: Date): Prisma.Decimal {
  const days = Math.floor((end.valueOf() - start.valueOf()) / 86_400_000) + 1;
  if (days <= 0) return new Prisma.Decimal(0);
  if (frequency === "UPFRONT") return annual.mul(days).div(365).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  if (frequency === "MONTHLY") {
    let monthUnits = new Prisma.Decimal(0);
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    while (cursor <= end) {
      const monthEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0));
      const overlapStart = cursor < start ? start : cursor;
      const overlapEnd = monthEnd > end ? end : monthEnd;
      const overlapDays = Math.floor((overlapEnd.valueOf() - overlapStart.valueOf()) / 86_400_000) + 1;
      const daysInMonth = monthEnd.getUTCDate();
      monthUnits = monthUnits.plus(new Prisma.Decimal(overlapDays).div(daysInMonth));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return annual.div(12).mul(monthUnits).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  }
  return annual.mul(days).div(365).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export async function accrueLeavePeriodAction(leavePeriodId: string) {
  const actor = await requirePermission("leave", "allocate");
  return prisma.$transaction(async (tx) => {
    const period = await tx.leavePeriod.findUniqueOrThrow({ where: { id: leavePeriodId } });
    const assignments = await tx.employeeLeavePolicyAssignment.findMany({
      where: {
        status: "ACTIVE", employee: { companyId: period.companyId, status: { not: "SEPARATED" } },
        effectiveFrom: { lte: period.endsOn },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: period.startsOn } }],
        leavePolicy: { effectiveFrom: { lte: period.endsOn }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: period.startsOn } }] },
      },
      include: { employee: true, leavePolicy: { include: { details: true } } },
    });
    let accruedCount = 0;
    for (const assignment of assignments) {
      for (const detail of assignment.leavePolicy.details) {
        const start = [period.startsOn, assignment.effectiveFrom, assignment.leavePolicy.effectiveFrom].reduce((current, item) => item > current ? item : current);
        const endValues = [period.endsOn, assignment.effectiveTo, assignment.leavePolicy.effectiveTo].filter((value): value is Date => value !== null);
        const end = endValues.reduce((current, item) => item < current ? item : current, period.endsOn);
        if (end < start) continue;
        const accrual = policyAccrualDays(detail.annualEntitlement, detail.accrualFrequency, start, end);
        if (accrual.isZero()) continue;
        const allocation = await tx.leaveAllocation.upsert({
          where: { employeeId_leaveTypeId_leavePeriodId: { employeeId: assignment.employeeId, leaveTypeId: detail.leaveTypeId, leavePeriodId: period.id } },
          update: { allocatedDays: accrual, status: "ACTIVE" },
          create: { employeeId: assignment.employeeId, leaveTypeId: detail.leaveTypeId, leavePeriodId: period.id, allocatedDays: accrual },
        });
        const sourceKey = `policy-accrual:${assignment.id}:${detail.leaveTypeId}:${period.id}`;
        const priorEntry = await tx.leaveLedgerEntry.findUnique({ where: { sourceKey } });
        const current = await currentBalance(tx, assignment.employeeId, detail.leaveTypeId);
        await tx.leaveLedgerEntry.upsert({
          where: { sourceKey },
          update: { days: accrual, balanceAfter: current.minus(priorEntry?.days ?? 0).plus(accrual), allocationId: allocation.id },
          create: {
            employeeId: assignment.employeeId, leaveTypeId: detail.leaveTypeId, allocationId: allocation.id,
            entryType: "ACCRUAL", postingDate: period.endsOn, days: accrual, balanceAfter: current.plus(accrual),
            description: `Policy accrual: ${assignment.leavePolicy.name}`, createdBy: actor.id, sourceKey,
          },
        });
        accruedCount += 1;
      }
    }
    await recordAudit(tx, { actorUserId: actor.id, entityType: "LeavePeriod", entityId: period.id, action: "ACCRUE_POLICIES", after: { entryCount: accruedCount } });
    return { accruedCount };
  }, { isolationLevel: "Serializable", timeout: 120_000 });
}

export async function adjustEmployeeLeaveAction(input: { employeeId: string; leaveTypeId: string; days: string; reason: string }) {
  const actor = await requirePermission("leave", "allocate");
  const days = new Prisma.Decimal(input.days);
  if (days.isZero() || input.reason.trim().length < 3) throw new Error("Enter a nonzero adjustment and a reason.");
  return prisma.$transaction(async (tx) => {
    const type = await tx.leaveType.findUniqueOrThrow({ where: { id: input.leaveTypeId } });
    const current = await currentBalance(tx, input.employeeId, input.leaveTypeId);
    const balanceAfter = current.plus(days);
    if (!type.allowNegativeBalance && balanceAfter.lessThan(0)) throw new Error("This adjustment would make the leave balance negative.");
    const adjustment = await tx.leaveAdjustment.create({ data: { employeeId: input.employeeId, leaveTypeId: input.leaveTypeId, postingDate: new Date(), days, reason: input.reason.trim(), createdBy: actor.id } });
    await tx.leaveLedgerEntry.create({
      data: { employeeId: input.employeeId, leaveTypeId: input.leaveTypeId, entryType: "ADJUSTMENT", postingDate: new Date(), days, balanceAfter, description: input.reason.trim(), createdBy: actor.id, sourceKey: `leave-adjustment:${adjustment.id}` },
    });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "LeaveAdjustment", entityId: adjustment.id, action: "ADJUST", after: { days: days.toString(), balanceAfter: balanceAfter.toString(), reason: input.reason.trim() } });
    return adjustment;
  }, { isolationLevel: "Serializable" });
}

export async function cancelMyLeaveApplicationAction(applicationId: string) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const employeeId = user.employeeId;
  return prisma.$transaction(async (tx) => {
    const application = await tx.leaveApplication.findFirst({ where: { id: applicationId, employeeId, status: { in: ["DRAFT", "OPEN", "APPROVED"] } } });
    if (!application) throw new Error("This leave application cannot be cancelled.");
    if (application.status === "APPROVED" && application.fromDate <= asDate(new Date().toISOString().slice(0, 10))) throw new Error("Approved leave that has started must be corrected by HR.");
    if (application.status === "APPROVED") {
      const current = await currentBalance(tx, application.employeeId, application.leaveTypeId);
      const sourceKey = `leave-cancellation:${application.id}`;
      const prior = await tx.leaveLedgerEntry.findUnique({ where: { sourceKey } });
      if (!prior) await tx.leaveLedgerEntry.create({
        data: {
          employeeId: application.employeeId, leaveTypeId: application.leaveTypeId, applicationId: application.id,
          entryType: "ADJUSTMENT", postingDate: new Date(), days: application.totalDays,
          balanceAfter: current.plus(application.totalDays), description: "Reversal of cancelled approved leave", createdBy: user.id, sourceKey,
        },
      });
    }
    const cancelled = await tx.leaveApplication.update({ where: { id: application.id }, data: { status: "CANCELLED" } });
    await tx.approvalRequest.updateMany({ where: { requestType: "LEAVE_APPLICATION", documentId: application.id, status: "PENDING" }, data: { status: "CANCELLED", completedAt: new Date() } });
    await recordAudit(tx, { actorUserId: user.id, entityType: "LeaveApplication", entityId: application.id, action: "CANCEL", before: { status: application.status }, after: { status: "CANCELLED" } });
    return cancelled;
  }, { isolationLevel: "Serializable" });
}

export async function listMyLeaveApplicationsAction() {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  return prisma.leaveApplication.findMany({ where: { employeeId: user.employeeId }, include: { leaveType: true }, orderBy: { createdAt: "desc" } });
}

export async function listPendingLeaveApplicationsAction() {
  await requirePermission("leave", "read");
  return prisma.leaveApplication.findMany({ where: { status: "OPEN" }, include: { leaveType: true, employee: { include: { department: true } } }, orderBy: { submittedAt: "asc" } });
}

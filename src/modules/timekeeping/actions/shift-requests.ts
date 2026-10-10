"use server";

import { Prisma } from "@prisma/client";
import { Decimal } from "@/shared/lib/decimal";
import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission, requireUser } from "@/shared/platform/auth";

export async function assignEmployeeShiftAction(input: { employeeId: string; shiftScheduleId: string; startsOn: string; endsOn?: string }) {
  const actor = await requirePermission("shift_assignment", "manage");
  const startsOn = new Date(`${input.startsOn}T00:00:00.000Z`);
  const endsOn = input.endsOn ? new Date(`${input.endsOn}T00:00:00.000Z`) : null;
  if (endsOn && endsOn < startsOn) throw new Error("Shift assignment end date must follow its start date.");
  return prisma.$transaction(async (tx) => {
    const overlap = await tx.shiftAssignment.findFirst({ where: { employeeId: input.employeeId, startsOn: { lte: endsOn ?? new Date("9999-12-31T00:00:00.000Z") }, OR: [{ endsOn: null }, { endsOn: { gte: startsOn } }] }, orderBy: { startsOn: "desc" } });
    if (overlap && overlap.startsOn >= startsOn) throw new Error("An overlapping shift assignment already exists.");
    if (overlap) await tx.shiftAssignment.update({ where: { id: overlap.id }, data: { endsOn: new Date(startsOn.valueOf() - 86_400_000) } });
    const assignment = await tx.shiftAssignment.create({ data: { employeeId: input.employeeId, shiftScheduleId: input.shiftScheduleId, startsOn, endsOn, assignedBy: actor.id, status: "APPROVED" } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "ShiftAssignment", entityId: assignment.id, action: "ASSIGN", after: { employeeId: input.employeeId, shiftScheduleId: input.shiftScheduleId, startsOn: input.startsOn, endsOn: input.endsOn ?? null } });
    return assignment;
  }, { isolationLevel: "Serializable" });
}

export async function requestShiftChangeAction(input: { requestType: "CHANGE" | "SWAP"; currentShiftId?: string; requestedShiftId: string; effectiveDate: string; reason: string }) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const effectiveDate = new Date(`${input.effectiveDate}T00:00:00.000Z`);
  if (Number.isNaN(effectiveDate.valueOf()) || input.reason.trim().length < 4) throw new Error("Enter a valid date and a reason for the shift request.");
  return prisma.$transaction(async (tx) => {
    const request = await tx.shiftRequest.create({ data: { employeeId: user.employeeId!, requestType: input.requestType, currentShiftId: input.currentShiftId || null, requestedShiftId: input.requestedShiftId, effectiveDate, reason: input.reason.trim(), status: "PENDING" } });
    await tx.approvalRequest.create({ data: { requestType: "SHIFT_REQUEST", documentId: request.id, submittedById: user.id } });
    await recordAudit(tx, { actorUserId: user.id, entityType: "ShiftRequest", entityId: request.id, action: "SUBMIT", after: { requestType: input.requestType, effectiveDate: input.effectiveDate } });
    return request;
  });
}

export async function reviewShiftRequestAction(input: { requestId: string; approve: boolean }) {
  const actor = await requirePermission("shift_request", "approve");
  return prisma.$transaction(async (tx) => {
    const request = await tx.shiftRequest.findFirst({ where: { id: input.requestId, status: "PENDING" }, include: { employee: { include: { authUser: true } } } });
    if (!request) throw new Error("Pending shift request not found.");
    const status = input.approve ? "APPROVED" : "REJECTED";
    const updated = await tx.shiftRequest.update({ where: { id: request.id }, data: { status, reviewedBy: actor.id, reviewedAt: new Date() } });
    if (input.approve && request.requestedShiftId) {
      const assignment = await tx.shiftAssignment.findFirst({ where: { employeeId: request.employeeId, startsOn: { lte: request.effectiveDate }, OR: [{ endsOn: null }, { endsOn: { gte: request.effectiveDate } }] }, orderBy: { startsOn: "desc" } });
      if (assignment) await tx.shiftAssignment.update({ where: { id: assignment.id }, data: { endsOn: new Date(request.effectiveDate.valueOf() - 86_400_000) } });
      await tx.shiftAssignment.create({ data: { employeeId: request.employeeId, shiftScheduleId: request.requestedShiftId, startsOn: request.effectiveDate, endsOn: assignment?.endsOn ?? null, assignedBy: actor.id, status: "APPROVED" } });
    }
    await tx.approvalRequest.updateMany({ where: { requestType: "SHIFT_REQUEST", documentId: request.id, status: "PENDING" }, data: { status, completedAt: new Date() } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "ShiftRequest", entityId: request.id, action: status, before: { status: "PENDING" }, after: { status } });
    if (request.employee.authUser) await tx.notification.create({ data: { recipientId: request.employee.authUser.id, category: "SHIFT", title: `Shift request ${status.toLowerCase()}`, body: `Your shift request was ${status.toLowerCase()}.`, actionUrl: "/portal/attendance" } });
    return updated;
  }, { isolationLevel: "Serializable" });
}

export async function submitOvertimeRequestAction(input: { workDate: string; dayType: string; requestedHours: string; reason: string }) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const workDate = new Date(`${input.workDate}T00:00:00.000Z`);
  const hours = new Decimal(input.requestedHours);
  if (Number.isNaN(workDate.valueOf()) || !hours.isFinite() || hours.lessThanOrEqualTo(0) || input.reason.trim().length < 4) throw new Error("Enter a valid work date, overtime duration, and reason.");
  return prisma.$transaction(async (tx) => {
    const request = await tx.overtimeRequest.create({ data: { employeeId: user.employeeId!, workDate, dayType: input.dayType, requestedHours: new Prisma.Decimal(input.requestedHours), reason: input.reason.trim(), status: "PENDING", submittedAt: new Date() } });
    await tx.approvalRequest.create({ data: { requestType: "OVERTIME_REQUEST", documentId: request.id, submittedById: user.id } });
    return request;
  });
}

export async function reviewOvertimeRequestAction(input: { requestId: string; approve: boolean; approvedHours?: string }) {
  const actor = await requirePermission("overtime", "approve");
  return prisma.$transaction(async (tx) => {
    const request = await tx.overtimeRequest.findFirst({ where: { id: input.requestId, status: "PENDING" }, include: { employee: { include: { authUser: true } } } });
    if (!request) throw new Error("Pending overtime request not found.");
    const approvedHours = input.approve ? input.approvedHours ?? request.requestedHours : null;
    if (approvedHours && (new Decimal(approvedHours).lessThan(0) || new Decimal(approvedHours).greaterThan(request.requestedHours.toString()))) throw new Error("Approved overtime cannot exceed the requested amount.");
    const status = input.approve ? "APPROVED" : "REJECTED";
    const saved = await tx.overtimeRequest.update({ where: { id: request.id }, data: { status, approvedHours, approvedBy: actor.id, approvedAt: new Date() } });
    await tx.approvalRequest.updateMany({ where: { requestType: "OVERTIME_REQUEST", documentId: request.id, status: "PENDING" }, data: { status, completedAt: new Date() } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "OvertimeRequest", entityId: request.id, action: status, before: { status: "PENDING" }, after: { status, approvedHours } });
    if (request.employee.authUser) await tx.notification.create({ data: { recipientId: request.employee.authUser.id, category: "OVERTIME", title: `Overtime request ${status.toLowerCase()}`, body: status === "APPROVED" ? `${approvedHours?.toString() ?? "0"} hours were approved.` : "Your overtime request was rejected.", actionUrl: "/portal/attendance" } });
    return saved;
  });
}

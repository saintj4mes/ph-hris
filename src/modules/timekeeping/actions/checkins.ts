"use server";

import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission, requireUser } from "@/shared/platform/auth";
import { aggregateAttendance } from "@/modules/timekeeping/aggregation";

export async function recordSelfCheckinAction(input: { logType: "IN" | "OUT"; latitude?: number; longitude?: number }) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  if (input.latitude !== undefined && (input.latitude < -90 || input.latitude > 90)) throw new Error("Invalid latitude.");
  if (input.longitude !== undefined && (input.longitude < -180 || input.longitude > 180)) throw new Error("Invalid longitude.");
  const event = await prisma.employeeCheckin.create({
    data: {
      employeeId: user.employeeId,
      eventAt: new Date(),
      logType: input.logType,
      source: "ESS",
      latitude: input.latitude,
      longitude: input.longitude,
    },
  });
  await recordAudit(prisma, { actorUserId: user.id, entityType: "EmployeeCheckin", entityId: event.id, action: input.logType, after: { eventAt: event.eventAt.toISOString(), source: "ESS" } });
  return event;
}

export async function aggregateEmployeeAttendanceAction(input: { employeeId: string; workDate: string }) {
  const actor = await requirePermission("attendance", "aggregate");
  const start = new Date(`${input.workDate}T00:00:00.000Z`);
  if (Number.isNaN(start.valueOf())) throw new Error("Invalid attendance date.");
  const attendanceStart = new Date(`${input.workDate}T00:00:00+08:00`);
  const end = new Date(attendanceStart.valueOf() + 2 * 86_400_000);
  const [employee, assignment, events] = await Promise.all([
    prisma.employee.findUniqueOrThrow({ where: { id: input.employeeId } }),
    prisma.shiftAssignment.findFirst({ where: { employeeId: input.employeeId, startsOn: { lte: start }, OR: [{ endsOn: null }, { endsOn: { gte: start } }] }, include: { shiftSchedule: true }, orderBy: { startsOn: "desc" } }),
    prisma.employeeCheckin.findMany({ where: { employeeId: input.employeeId, eventAt: { gte: new Date(attendanceStart.valueOf() - 86_400_000), lt: end } }, orderBy: { eventAt: "asc" }, select: { eventAt: true, logType: true } }),
  ]);
  if (!assignment) throw new Error("The employee has no active shift assignment for this date.");
  const schedule = assignment.shiftSchedule;
  const aggregate = aggregateAttendance(events, input.workDate, {
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    scheduledMinutes: Math.round(Number(schedule.scheduledHours) * 60),
    graceMinutes: schedule.graceMinutes,
    breakMinutes: schedule.breakMinutes,
    nightStart: schedule.nightWindowStart,
    nightEnd: schedule.nightWindowEnd,
  });
  const attendance = await prisma.dailyAttendance.upsert({
    where: { employeeId_workDate: { employeeId: employee.id, workDate: start } },
    create: { employeeId: employee.id, workDate: start, ...aggregate },
    update: { ...aggregate, aggregationVersion: "v2" },
  });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "DailyAttendance", entityId: attendance.id, action: "AGGREGATE", after: { ...aggregate, firstIn: aggregate.firstIn?.toISOString() ?? null, lastOut: aggregate.lastOut?.toISOString() ?? null } });
  return attendance;
}

export async function submitAttendanceCorrectionAction(input: { workDate: string; requestedFirstIn?: string; requestedLastOut?: string; reason: string }) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const workDate = new Date(`${input.workDate}T00:00:00.000Z`);
  if (Number.isNaN(workDate.valueOf()) || input.reason.trim().length < 4) throw new Error("A valid date and correction reason are required.");
  const correction = await prisma.attendanceCorrectionRequest.create({
    data: {
      employeeId: user.employeeId,
      workDate,
      requestedFirstIn: input.requestedFirstIn ? new Date(input.requestedFirstIn) : null,
      requestedLastOut: input.requestedLastOut ? new Date(input.requestedLastOut) : null,
      reason: input.reason.trim(),
      status: "PENDING",
      submittedAt: new Date(),
    },
  });
  await prisma.approvalRequest.create({ data: { requestType: "ATTENDANCE_CORRECTION", documentId: correction.id, submittedById: user.id } });
  return correction;
}

export async function approveAttendanceCorrectionAction(input: { id: string; approve: boolean; comment?: string }) {
  const actor = await requirePermission("attendance", "approve");
  return prisma.$transaction(async (tx) => {
    const correction = await tx.attendanceCorrectionRequest.findFirst({ where: { id: input.id, status: "PENDING" }, include: { employee: { include: { authUser: true } } } });
    if (!correction) throw new Error("Pending attendance correction not found.");
    const status = input.approve ? "APPROVED" : "REJECTED";
    const saved = await tx.attendanceCorrectionRequest.update({ where: { id: correction.id }, data: { status, reviewedBy: actor.id, reviewedAt: new Date(), reviewComment: input.comment?.trim() || null } });
    if (input.approve) {
      await tx.dailyAttendance.updateMany({
        where: { employeeId: correction.employeeId, workDate: correction.workDate },
        data: { firstIn: correction.requestedFirstIn ?? undefined, lastOut: correction.requestedLastOut ?? undefined, aggregationVersion: "manual-correction" },
      });
    }
    await tx.approvalRequest.updateMany({ where: { requestType: "ATTENDANCE_CORRECTION", documentId: correction.id, status: "PENDING" }, data: { status, completedAt: new Date() } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "AttendanceCorrectionRequest", entityId: correction.id, action: status, before: { status: "PENDING" }, after: { status } });
    if (correction.employee.authUser) await tx.notification.create({ data: { recipientId: correction.employee.authUser.id, category: "ATTENDANCE", title: `Attendance correction ${status.toLowerCase()}`, body: input.comment?.trim() || `Your attendance correction was ${status.toLowerCase()}.`, actionUrl: "/portal/attendance" } });
    return saved;
  });
}

"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission, requireUser } from "@/shared/platform/auth";

export async function createAppraisalCycleAction(input: { companyId: string; name: string; startsOn: string; endsOn: string }) {
  const actor = await requirePermission("performance", "manage");
  const startsOn = new Date(`${input.startsOn}T00:00:00.000Z`);
  const endsOn = new Date(`${input.endsOn}T00:00:00.000Z`);
  if (endsOn < startsOn) throw new Error("Appraisal cycle end date must follow its start date.");
  const cycle = await prisma.appraisalCycle.create({ data: { companyId: input.companyId, name: input.name.trim(), startsOn, endsOn, status: "OPEN" } });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "AppraisalCycle", entityId: cycle.id, action: "CREATE", after: { name: cycle.name, startsOn: input.startsOn, endsOn: input.endsOn } });
  return cycle;
}

export async function setMyPerformanceGoalAction(input: { title: string; description?: string; measure?: string; targetValue?: string; dueDate?: string; cycleId?: string }) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const goal = await prisma.performanceGoal.create({ data: { employeeId: user.employeeId, title: input.title.trim(), description: input.description?.trim() || null, measure: input.measure?.trim() || null, targetValue: input.targetValue ? new Prisma.Decimal(input.targetValue) : null, dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00.000Z`) : null, cycleId: input.cycleId || null } });
  await recordAudit(prisma, { actorUserId: user.id, entityType: "PerformanceGoal", entityId: goal.id, action: "CREATE", after: { title: goal.title } });
  return goal;
}

export async function updateMyPerformanceGoalAction(input: { goalId: string; actualValue: string; status: "OPEN" | "COMPLETED" }) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const employeeId = user.employeeId;
  const actualValue = new Prisma.Decimal(input.actualValue);
  return prisma.$transaction(async (tx) => {
    const goal = await tx.performanceGoal.findFirst({ where: { id: input.goalId, employeeId } });
    if (!goal) throw new Error("Performance goal not found.");
    const updated = await tx.performanceGoal.update({ where: { id: goal.id }, data: { actualValue, status: input.status } });
    await recordAudit(tx, { actorUserId: user.id, entityType: "PerformanceGoal", entityId: goal.id, action: "UPDATE_PROGRESS", before: { actualValue: goal.actualValue?.toString() ?? null, status: goal.status }, after: { actualValue: actualValue.toString(), status: updated.status } });
    return updated;
  });
}

export async function submitSelfAppraisalAction(input: { cycleId: string; selfRating: string; employeeNotes?: string }) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const employeeId = user.employeeId;
  const rating = new Prisma.Decimal(input.selfRating);
  if (rating.lessThan(1) || rating.greaterThan(5)) throw new Error("Appraisal ratings must be between 1 and 5.");
  return prisma.$transaction(async (tx) => {
    const cycle = await tx.appraisalCycle.findFirst({ where: { id: input.cycleId, status: "OPEN" } });
    if (!cycle) throw new Error("This appraisal cycle is not open.");
    const appraisal = await tx.performanceAppraisal.upsert({
      where: { cycleId_employeeId: { cycleId: cycle.id, employeeId } },
      update: { selfRating: rating, employeeNotes: input.employeeNotes?.trim() || null, status: "SELF_SUBMITTED", submittedAt: new Date() },
      create: { cycleId: cycle.id, employeeId, selfRating: rating, employeeNotes: input.employeeNotes?.trim() || null, status: "SELF_SUBMITTED", submittedAt: new Date() },
    });
    await recordAudit(tx, { actorUserId: user.id, entityType: "PerformanceAppraisal", entityId: appraisal.id, action: "SELF_SUBMIT", after: { rating: rating.toString() } });
    return appraisal;
  });
}

export async function finalizeAppraisalAction(input: { appraisalId: string; managerRating: string; managerNotes?: string }) {
  const actor = await requirePermission("performance", "finalize");
  const rating = new Prisma.Decimal(input.managerRating);
  if (rating.lessThan(1) || rating.greaterThan(5)) throw new Error("Appraisal ratings must be between 1 and 5.");
  return prisma.$transaction(async (tx) => {
    const appraisal = await tx.performanceAppraisal.findFirst({ where: { id: input.appraisalId, status: "SELF_SUBMITTED" } });
    if (!appraisal) throw new Error("Only self-submitted appraisals can be finalized.");
    const overall = appraisal.selfRating ? appraisal.selfRating.plus(rating).div(2) : rating;
    const saved = await tx.performanceAppraisal.update({ where: { id: appraisal.id }, data: { managerId: actor.id, managerRating: rating, managerNotes: input.managerNotes?.trim() || null, overallRating: overall, status: "FINALIZED", finalizedAt: new Date() } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "PerformanceAppraisal", entityId: appraisal.id, action: "FINALIZE", before: { status: appraisal.status }, after: { status: "FINALIZED", overallRating: overall.toString() } });
    return saved;
  });
}

export async function createTrainingEventAction(input: { programId: string; startsAt: string; endsAt: string; venueOrLink?: string; instructor?: string; capacity?: number }) {
  const actor = await requirePermission("training", "manage");
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (endsAt <= startsAt) throw new Error("Training event must have a positive duration.");
  const event = await prisma.trainingEvent.create({ data: { programId: input.programId, startsAt, endsAt, venueOrLink: input.venueOrLink?.trim() || null, instructor: input.instructor?.trim() || null, capacity: input.capacity } });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "TrainingEvent", entityId: event.id, action: "CREATE", after: { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() } });
  return event;
}

export async function createTrainingProgramAction(input: { companyId: string; code: string; name: string; description?: string }) {
  const actor = await requirePermission("training", "manage");
  const program = await prisma.trainingProgram.create({ data: { companyId: input.companyId, code: input.code.trim().toUpperCase(), name: input.name.trim(), description: input.description?.trim() || null } });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "TrainingProgram", entityId: program.id, action: "CREATE", after: { code: program.code, name: program.name } });
  return program;
}

export async function enrollMyselfInTrainingAction(eventId: string) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const employeeId = user.employeeId;
  return prisma.$transaction(async (tx) => {
    const event = await tx.trainingEvent.findFirst({ where: { id: eventId, status: "PLANNED", startsAt: { gt: new Date() } }, include: { _count: { select: { enrollments: true } } } });
    if (!event) throw new Error("Training event is unavailable for enrollment.");
    if (event.capacity && event._count.enrollments >= event.capacity) throw new Error("Training event is at capacity.");
    const enrollment = await tx.trainingEnrollment.create({ data: { eventId, employeeId } });
    await recordAudit(tx, { actorUserId: user.id, entityType: "TrainingEnrollment", entityId: enrollment.id, action: "ENROLL", after: { eventId } });
    return enrollment;
  });
}

export async function recordTrainingResultAction(input: { enrollmentId: string; status: "COMPLETED" | "NO_SHOW" | "DROPPED"; result?: string; score?: string; feedback?: string }) {
  const actor = await requirePermission("training", "manage");
  const score = input.score ? new Prisma.Decimal(input.score) : null;
  if (score && (score.lessThan(0) || score.greaterThan(100))) throw new Error("Training score must be between 0 and 100.");
  return prisma.$transaction(async (tx) => {
    const enrollment = await tx.trainingEnrollment.findUnique({ where: { id: input.enrollmentId }, include: { event: true } });
    if (!enrollment) throw new Error("Training enrollment not found.");
    if (enrollment.event.endsAt > new Date()) throw new Error("Training results can be recorded after the event ends.");
    const updated = await tx.trainingEnrollment.update({ where: { id: enrollment.id }, data: { status: input.status, result: input.result?.trim() || null, score, feedback: input.feedback?.trim() || null, completedAt: input.status === "COMPLETED" ? new Date() : null } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "TrainingEnrollment", entityId: enrollment.id, action: "RECORD_RESULT", before: { status: enrollment.status }, after: { status: updated.status, score: score?.toString() ?? null } });
    return updated;
  });
}

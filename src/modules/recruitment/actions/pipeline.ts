"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission } from "@/shared/platform/auth";

const allowedApplicantTransitions: Record<string, string[]> = {
  NEW: ["SCREENING", "REJECTED", "WITHDRAWN"],
  SCREENING: ["INTERVIEW", "REJECTED", "WITHDRAWN"],
  INTERVIEW: ["OFFER", "REJECTED", "WITHDRAWN"],
  OFFER: ["HIRED", "REJECTED", "WITHDRAWN"],
  HIRED: [], REJECTED: [], WITHDRAWN: [],
};

export async function createJobOpeningAction(input: { companyId: string; title: string; description: string; location?: string; employmentType: "REGULAR" | "PROBATIONARY" | "FIXED_TERM" | "CASUAL" | "PART_TIME"; opensOn: string; closesOn?: string; salaryRangeMin?: string; salaryRangeMax?: string }) {
  const actor = await requirePermission("recruitment", "create");
  const opensOn = new Date(`${input.opensOn}T00:00:00.000Z`);
  const closesOn = input.closesOn ? new Date(`${input.closesOn}T00:00:00.000Z`) : null;
  if (!input.title.trim() || input.description.trim().length < 20 || Number.isNaN(opensOn.valueOf()) || (closesOn && closesOn < opensOn)) throw new Error("Enter a title, a useful job description, and a valid posting date range.");
  const opening = await prisma.jobOpening.create({ data: { companyId: input.companyId, title: input.title.trim(), description: input.description.trim(), location: input.location?.trim() || null, employmentType: input.employmentType, opensOn, closesOn, salaryRangeMin: input.salaryRangeMin, salaryRangeMax: input.salaryRangeMax } });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "JobOpening", entityId: opening.id, action: "CREATE", after: { title: opening.title, status: opening.status } });
  return opening;
}

/** Public career-form action: accepts applications only for active published openings. */
export async function submitPublicJobApplicationAction(input: { jobOpeningId: string; fullName: string; email: string; phone?: string; resumeUrl?: string; source?: string }) {
  const opening = await prisma.jobOpening.findFirst({ where: { id: input.jobOpeningId, status: "OPEN", opensOn: { lte: new Date() }, OR: [{ closesOn: null }, { closesOn: { gte: new Date() } }] } });
  if (!opening) throw new Error("This job is no longer accepting applications.");
  const email = input.email.trim().toLowerCase();
  if (!input.fullName.trim() || !email.includes("@")) throw new Error("Enter a valid name and email address.");
  return prisma.jobApplication.create({ data: { jobOpeningId: opening.id, fullName: input.fullName.trim(), email, phone: input.phone?.trim() || null, resumeUrl: input.resumeUrl || null, source: input.source?.trim() || "CAREER_PAGE" } });
}

export async function moveApplicantStageAction(input: { applicationId: string; status: "SCREENING" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED" | "WITHDRAWN"; reason?: string }) {
  const actor = await requirePermission("recruitment", "manage");
  return prisma.$transaction(async (tx) => {
    const application = await tx.jobApplication.findUniqueOrThrow({ where: { id: input.applicationId } });
    if (!allowedApplicantTransitions[application.status].includes(input.status)) throw new Error(`Applicant cannot move from ${application.status} to ${input.status}.`);
    const updated = await tx.jobApplication.update({ where: { id: application.id }, data: { status: input.status } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "JobApplication", entityId: application.id, action: "STAGE_CHANGE", before: { status: application.status }, after: { status: input.status, reason: input.reason ?? null } });
    return updated;
  });
}

export async function scheduleInterviewAction(input: { applicationId: string; scheduledAt: string; interviewType: string; locationOrLink?: string }) {
  const actor = await requirePermission("recruitment", "manage");
  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.valueOf()) || scheduledAt < new Date()) throw new Error("Choose an interview time in the future.");
  return prisma.$transaction(async (tx) => {
    const application = await tx.jobApplication.findUniqueOrThrow({ where: { id: input.applicationId } });
    if (!["SCREENING", "INTERVIEW"].includes(application.status)) throw new Error("Move the applicant to screening or interview before scheduling.");
    const interview = await tx.interview.create({ data: { applicationId: application.id, scheduledAt, interviewType: input.interviewType.trim(), locationOrLink: input.locationOrLink?.trim() || null } });
    if (application.status === "SCREENING") await tx.jobApplication.update({ where: { id: application.id }, data: { status: "INTERVIEW" } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "Interview", entityId: interview.id, action: "SCHEDULE", after: { applicationId: application.id, scheduledAt: scheduledAt.toISOString() } });
    return interview;
  });
}

export async function submitInterviewFeedbackAction(input: { interviewId: string; rating: number; recommendation: string; comments?: string }) {
  const actor = await requirePermission("recruitment", "feedback");
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) throw new Error("Interview rating must be from 1 to 5.");
  const feedback = await prisma.interviewFeedback.upsert({
    where: { interviewId_interviewerId: { interviewId: input.interviewId, interviewerId: actor.id } },
    update: { rating: input.rating, recommendation: input.recommendation.trim(), comments: input.comments?.trim() || null, submittedAt: new Date() },
    create: { interviewId: input.interviewId, interviewerId: actor.id, rating: input.rating, recommendation: input.recommendation.trim(), comments: input.comments?.trim() || null },
  });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "InterviewFeedback", entityId: feedback.id, action: "SUBMIT", after: { rating: input.rating, recommendation: input.recommendation } });
  return feedback;
}

export async function issueJobOfferAction(input: { applicationId: string; proposedTitle: string; proposedSalary: string; targetStartDate: string; terms: Record<string, unknown> }) {
  const actor = await requirePermission("recruitment", "offer");
  const salary = new Prisma.Decimal(input.proposedSalary);
  const targetStartDate = new Date(`${input.targetStartDate}T00:00:00.000Z`);
  if (salary.lessThan(0) || Number.isNaN(targetStartDate.valueOf())) throw new Error("Enter a valid offer salary and start date.");
  return prisma.$transaction(async (tx) => {
    const application = await tx.jobApplication.findUniqueOrThrow({ where: { id: input.applicationId } });
    if (!["INTERVIEW", "OFFER"].includes(application.status)) throw new Error("The applicant must be in the interview stage to receive an offer.");
    const offer = await tx.jobOffer.create({ data: { applicationId: application.id, proposedTitle: input.proposedTitle.trim(), proposedSalary: salary, targetStartDate, terms: input.terms as Prisma.InputJsonValue } });
    await tx.jobApplication.update({ where: { id: application.id }, data: { status: "OFFER" } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "JobOffer", entityId: offer.id, action: "ISSUE", after: { applicationId: application.id, proposedSalary: salary.toFixed(2) } });
    return offer;
  });
}

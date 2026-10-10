import { GraduationCap } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { TrainingEnrollmentButton } from "@/components/portal/training-enrollment-button";
import { prisma } from "@/shared/db/prisma";
import { requireUser } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function PortalTrainingPage() {
  const user = await requireUser();
  if (!user.employeeId) return <p className="text-sm text-slate-500">Link your login to an employee record to access learning events.</p>;
  const employee = await prisma.employee.findUniqueOrThrow({ where: { id: user.employeeId }, select: { companyId: true } });
  const [events, enrollments] = await Promise.all([
    prisma.trainingEvent.findMany({ where: { status: "PLANNED", startsAt: { gt: new Date() }, program: { companyId: employee.companyId, active: true } }, include: { program: true, _count: { select: { enrollments: true } } }, orderBy: { startsAt: "asc" }, take: 50 }),
    prisma.trainingEnrollment.findMany({ where: { employeeId: user.employeeId }, include: { event: { include: { program: true } } }, orderBy: { event: { startsAt: "desc" } }, take: 50 }),
  ]);
  const enrolledIds = new Set(enrollments.filter((item) => item.status === "ENROLLED").map((item) => item.eventId));
  return <div className="space-y-6"><header className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-teal-50 text-teal-700"><GraduationCap className="size-6" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Learning & development</p><h1 className="mt-1 text-2xl font-semibold">Training</h1><p className="mt-1 text-sm text-slate-500">Browse upcoming training and track your completions.</p></div></header><section className="grid gap-4 xl:grid-cols-2">{events.map((event) => <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold">{event.program.name}</h2><p className="mt-1 text-xs text-slate-500">{event.startsAt.toLocaleString("en-PH", { timeZone: "Asia/Manila" })} · {event.venueOrLink ?? "Venue to be announced"}</p><p className="mt-1 text-xs text-slate-500">{event.instructor ?? "Instructor to be announced"} · {event._count.enrollments}{event.capacity ? ` / ${event.capacity}` : ""} seats used</p></div>{enrolledIds.has(event.id) ? <StatusBadge tone="success">ENROLLED</StatusBadge> : <TrainingEnrollmentButton eventId={event.id} />}</div>{event.program.description && <p className="mt-3 text-sm leading-6 text-slate-600">{event.program.description}</p>}</article>)}{events.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No upcoming training events are available.</p>}</section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">My training history</h2><div className="mt-3 divide-y divide-slate-100">{enrollments.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{item.event.program.name}</p><p className="mt-1 text-xs text-slate-500">{item.event.startsAt.toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })}{item.result ? ` · ${item.result}` : ""}{item.score ? ` · score ${item.score.toFixed(2)}` : ""}</p></div><StatusBadge tone={item.status === "COMPLETED" ? "success" : "neutral"}>{item.status}</StatusBadge></article>)}{enrollments.length === 0 && <p className="py-4 text-sm text-slate-500">You have not enrolled in training.</p>}</div></section></div>;
}

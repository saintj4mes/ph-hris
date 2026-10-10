import { GraduationCap } from "lucide-react";
import { TrainingEventForm } from "@/components/admin/training-event-form";
import { TrainingProgramForm } from "@/components/admin/training-program-form";
import { TrainingResultActions } from "@/components/admin/training-result-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  await requirePermission("training", "read");
  const [companies, programs, events] = await Promise.all([
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.trainingProgram.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.trainingEvent.findMany({ include: { program: true, enrollments: { include: { employee: true }, orderBy: { employee: { lastName: "asc" } } }, _count: { select: { enrollments: true } } }, orderBy: { startsAt: "desc" }, take: 50 }),
  ]);
  const now = new Date();
  return <div className="space-y-7"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-teal-50 text-teal-700"><GraduationCap className="size-6" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Learning & development</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[30px]">Training</h1><p className="mt-1 text-sm text-slate-500">Programs, scheduled events, employee enrollment, and completion results.</p></div></div>{companies[0] && <TrainingProgramForm companyId={companies[0].id} />}<TrainingEventForm programs={programs} />
    <section className="space-y-3">{events.map((event) => { const ended = event.endsAt <= now; return <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{event.program.name}</p><p className="mt-1 text-xs text-slate-500">{event.startsAt.toLocaleString("en-PH", { timeZone: "Asia/Manila" })} – {event.endsAt.toLocaleString("en-PH", { timeZone: "Asia/Manila" })} · {event.venueOrLink ?? "Venue to be announced"}</p><p className="mt-1 text-xs text-slate-500">{event._count.enrollments}{event.capacity ? ` / ${event.capacity}` : ""} enrolled{event.instructor ? ` · ${event.instructor}` : ""}</p></div><StatusBadge>{event.status}</StatusBadge></div>{event.enrollments.length > 0 && <div className="mt-4 divide-y divide-slate-100 rounded-xl bg-slate-50 px-3">{event.enrollments.map((enrollment) => <div key={enrollment.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-xs font-semibold">{enrollment.employee.employeeNumber} · {enrollment.employee.firstName} {enrollment.employee.lastName}</p><p className="mt-1 text-[11px] text-slate-500">{enrollment.result ?? "No result recorded"}{enrollment.score ? ` · score ${enrollment.score.toFixed(2)}` : ""}</p></div><div className="flex items-center gap-3"><StatusBadge tone={enrollment.status === "COMPLETED" ? "success" : "neutral"}>{enrollment.status}</StatusBadge><TrainingResultActions enrollmentId={enrollment.id} eventEnded={ended} /></div></div>)}</div>}{event.enrollments.length === 0 && <p className="mt-4 text-xs text-slate-500">No employees enrolled yet.</p>}</article>; })}{events.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No training events scheduled.</p>}</section>
  </div>;
}

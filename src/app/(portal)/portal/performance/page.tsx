import { ChartNoAxesCombined } from "lucide-react";
import { PerformanceSelfService } from "@/components/portal/performance-self-service";
import { GoalProgressForm } from "@/components/portal/goal-progress-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/shared/db/prisma";
import { requireUser } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function PortalPerformancePage() {
  const user = await requireUser();
  if (!user.employeeId) return <p className="text-sm text-slate-500">Your account is not linked to an employee record. Contact HR.</p>;
  const [employee, goals, appraisals] = await Promise.all([
    prisma.employee.findUniqueOrThrow({ where: { id: user.employeeId }, select: { companyId: true } }),
    prisma.performanceGoal.findMany({ where: { employeeId: user.employeeId }, orderBy: { dueDate: "asc" }, take: 30 }),
    prisma.performanceAppraisal.findMany({ where: { employeeId: user.employeeId }, include: { cycle: true }, orderBy: { submittedAt: "desc" }, take: 30 }),
  ]);
  const cycles = await prisma.appraisalCycle.findMany({ where: { companyId: employee.companyId, status: "OPEN" }, select: { id: true, name: true }, orderBy: { startsOn: "desc" } });
  const submittedCycleIds = appraisals.filter((item) => item.status === "FINALIZED").map((item) => item.cycleId);
  return <div className="space-y-6">
    <header className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-teal-50 text-teal-700"><ChartNoAxesCombined className="size-6" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Talent & growth</p><h1 className="mt-1 text-2xl font-semibold">Performance</h1><p className="mt-1 text-sm text-slate-500">Manage goals and take part in your review cycles.</p></div></header>
    <PerformanceSelfService cycles={cycles} submittedCycleIds={submittedCycleIds} />
    <section className="grid gap-5 xl:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">My goals</h2><div className="mt-3 divide-y divide-slate-100">{goals.map((goal) => <article key={goal.id} className="py-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{goal.title}</p><p className="mt-1 text-xs text-slate-500">{goal.cycleId ? "Linked to review cycle" : "No review cycle"}{goal.dueDate ? ` · Due ${goal.dueDate.toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })}` : ""}</p>{goal.description && <p className="mt-2 text-sm text-slate-600">{goal.description}</p>}<p className="mt-2 text-xs text-slate-500">{goal.measure ?? "Actual progress"}: {goal.actualValue?.toString() ?? "Not started"}{goal.targetValue ? ` / ${goal.targetValue.toString()}` : ""}</p><GoalProgressForm goalId={goal.id} actualValue={goal.actualValue?.toString() ?? "0"} status={goal.status} /></div><StatusBadge>{goal.status}</StatusBadge></div></article>)}{goals.length === 0 && <p className="py-4 text-sm text-slate-500">No goals yet.</p>}</div></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">My appraisals</h2><div className="mt-3 divide-y divide-slate-100">{appraisals.map((item) => <article key={item.id} className="py-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{item.cycle.name}</p><StatusBadge tone={item.status === "FINALIZED" ? "success" : "info"}>{item.status}</StatusBadge></div><p className="mt-1 text-xs text-slate-500">Self rating {item.selfRating?.toFixed(1) ?? "—"}{item.managerRating ? ` · Manager rating ${item.managerRating.toFixed(1)}` : ""}{item.overallRating ? ` · Overall ${item.overallRating.toFixed(1)}` : ""}</p>{item.managerNotes && <p className="mt-2 text-sm text-slate-600">{item.managerNotes}</p>}</article>)}{appraisals.length === 0 && <p className="py-4 text-sm text-slate-500">No appraisal submissions yet.</p>}</div></div></section>
  </div>;
}

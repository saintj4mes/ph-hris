import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PayrollRunForm } from "@/components/admin/payroll-run-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function PayrollPage() {
  await requirePermission("payroll", "read");
  const [companies, runs] = await Promise.all([
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.payrollRun.findMany({ include: { company: true, _count: { select: { salarySlips: true } }, journalEntry: true }, orderBy: { periodEnd: "desc" }, take: 50 }),
  ]);
  return <div className="space-y-7"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Payroll operations</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[30px]">Payroll runs</h1><p className="mt-1 text-sm text-slate-500">Create cutoffs, calculate employee slips, approve, post the journal, and record payment.</p></div><PayrollRunForm companies={companies} />
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-sm font-semibold">Recent payroll runs</h2></div><div className="divide-y divide-slate-100">{runs.map((run) => <article key={run.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div><p className="text-sm font-semibold">{run.name}</p><p className="mt-1 text-xs text-slate-500">{run.company.name} · {run.periodStart.toISOString().slice(0, 10)} to {run.periodEnd.toISOString().slice(0, 10)} · cutoff {run.cutoffNumber} · {run._count.salarySlips} slips</p><p className="mt-1 text-xs text-slate-500">Pay date {run.payDate.toISOString().slice(0, 10)}{run.journalEntry ? ` · Journal ${run.journalEntry.reference}` : ""}</p></div><div className="flex items-center gap-3"><StatusBadge tone={run.status === "PAID" ? "success" : run.status === "FAILED" ? "warning" : "info"}>{run.status}</StatusBadge><Link href={`/payroll/runs/${run.id}`} aria-label={`View ${run.name}`} className="rounded-lg p-2 text-teal-700 hover:bg-teal-50"><ArrowUpRight className="size-4" /></Link></div></article>)}{runs.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No payroll runs created.</p>}</div></section>
  </div>;
}

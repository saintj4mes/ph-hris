import Link from "next/link";
import { ArrowDownToLine, ArrowUpRight, FileText } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/shared/db/prisma";
import { requireUser } from "@/shared/platform/auth";
import { Decimal } from "@/shared/lib/decimal";

export const dynamic = "force-dynamic";

export default async function PortalPayslipsPage() {
  const user = await requireUser();
  if (!user.employeeId) return <p className="text-sm text-slate-500">Your account is not linked to an employee record.</p>;
  const slips = await prisma.salarySlip.findMany({ where: { employeeId: user.employeeId, status: { in: ["SUBMITTED", "PAID"] } }, include: { payrollRun: true }, orderBy: { payrollRun: { periodEnd: "desc" } } });
  const year = new Date().getUTCFullYear();
  const yearSlips = slips.filter((slip) => slip.payrollRun.periodEnd.getUTCFullYear() === year);
  const ytdGross = yearSlips.reduce((sum, slip) => sum.plus(slip.grossPay), new Decimal(0)).toFixed(2);
  const ytdNet = yearSlips.reduce((sum, slip) => sum.plus(slip.netPay), new Decimal(0)).toFixed(2);
  return <div className="space-y-7"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-700">Payroll records</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">My payslips</h1><p className="mt-1 text-sm text-slate-500">Payslips become available after payroll approval.</p></div>
    <section className="grid gap-3 sm:grid-cols-2"><Metric label={`${year} gross pay`} value={ytdGross} /><Metric label={`${year} net pay`} value={ytdNet} /></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-sm font-semibold">Published salary slips</h2><p className="mt-1 text-xs text-slate-500">Your personal payroll history.</p></div><div className="divide-y divide-slate-100">{slips.map((slip) => <article key={slip.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><FileText className="size-5" /></span><div><p className="text-sm font-semibold">{slip.payrollRun.periodStart.toISOString().slice(0, 10)} to {slip.payrollRun.periodEnd.toISOString().slice(0, 10)}</p><p className="mt-1 text-xs text-slate-500">Gross ₱{slip.grossPay.toFixed(2)} · Net ₱{slip.netPay.toFixed(2)}</p></div></div><div className="flex items-center gap-3"><StatusBadge tone={slip.status === "PAID" ? "success" : "info"}>{slip.status === "PAID" ? "Paid" : "Posted"}</StatusBadge><Link href={`/portal/payslips/${slip.id}`} aria-label="View payslip" className="rounded-lg p-2 text-teal-700 hover:bg-teal-50"><ArrowUpRight className="size-4" /></Link><Link href={`/portal/payslips/${slip.id}?print=1`} aria-label="Print or download payslip" className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><ArrowDownToLine className="size-4" /></Link></div></article>)}{slips.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No published payslips yet.</p>}</div></section>
  </div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">₱{value}</p></article>; }

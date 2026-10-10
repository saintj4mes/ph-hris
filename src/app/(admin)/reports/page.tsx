import { BarChart3, CalendarCheck2, UsersRound, WalletCards } from "lucide-react";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requirePermission("report", "read");
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
  const [headcount, attendance, leaveRequests, payroll] = await Promise.all([
    prisma.employee.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.dailyAttendance.groupBy({ by: ["status"], where: { workDate: { gte: start, lt: end } }, _count: { _all: true }, _sum: { lateMinutes: true, overtimeMinutes: true } }),
    prisma.leaveApplication.groupBy({ by: ["status"], where: { createdAt: { gte: start, lt: end } }, _count: { _all: true }, _sum: { totalDays: true } }),
    prisma.salarySlip.aggregate({ where: { payrollRun: { periodEnd: { gte: start, lt: end } }, status: { in: ["SUBMITTED", "PAID"] } }, _sum: { grossPay: true, taxWithheld: true, totalEmployeeDeductions: true, netPay: true }, _count: { _all: true } }),
  ]);
  const payrollTotals = [["Gross payroll", payroll._sum.grossPay], ["Withholding tax", payroll._sum.taxWithheld], ["Employee deductions", payroll._sum.totalEmployeeDeductions], ["Net pay", payroll._sum.netPay]] as const;
  return <div className="space-y-7"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-teal-50 text-teal-700"><BarChart3 className="size-6" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Analytics</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[30px]">HR reports</h1><p className="mt-1 text-sm text-slate-500">Live headcount, attendance, leave, and payroll summaries for this month.</p></div></div>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<UsersRound />} label="Active employees" value={String(headcount.find((row) => row.status === "ACTIVE")?._count._all ?? 0)} /><Metric icon={<CalendarCheck2 />} label="Attendance records" value={String(attendance.reduce((sum, row) => sum + row._count._all, 0))} /><Metric icon={<WalletCards />} label="Payslips posted" value={String(payroll._count._all)} /><Metric icon={<BarChart3 />} label="Leave requests" value={String(leaveRequests.reduce((sum, row) => sum + row._count._all, 0))} /></section>
    <div className="grid gap-4 xl:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">Attendance by status</h2><div className="mt-4 divide-y divide-slate-100">{attendance.map((row) => <article key={row.status} className="flex justify-between py-3 text-sm"><span>{row.status.replaceAll("_", " ")}</span><span className="font-semibold tabular-nums">{row._count._all} · late {row._sum.lateMinutes ?? 0}m · OT {row._sum.overtimeMinutes ?? 0}m</span></article>)}{attendance.length === 0 && <p className="py-3 text-xs text-slate-500">No attendance for the current month.</p>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">Payroll totals</h2><div className="mt-4 divide-y divide-slate-100">{payrollTotals.map(([label, amount]) => <article key={label} className="flex justify-between py-3 text-sm"><span>{label}</span><span className="font-semibold tabular-nums">₱{amount?.toFixed(2) ?? "0.00"}</span></article>)}</div></section></div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">Leave workflow volume</h2><div className="mt-4 grid gap-3 sm:grid-cols-4">{leaveRequests.map((row) => <article key={row.status} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{row.status.replaceAll("_", " ")}</p><p className="mt-1 text-xl font-semibold">{row._count._all}</p><p className="mt-1 text-xs text-slate-500">{row._sum.totalDays?.toString() ?? "0"} days</p></article>)}</div></section>
  </div>;
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <article className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div><span className="grid size-9 place-items-center rounded-lg bg-teal-50 text-teal-700 [&>svg]:size-4">{icon}</span></article>; }

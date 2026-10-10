import Link from "next/link";
import { Activity, ArrowUpRight, CalendarCheck2, UsersRound, WalletCards } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requirePermission("employee", "read");
  const now = new Date();
  const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  const [activeEmployees, onLeave, attendance, pendingLeave, latestRun, recentHires] = await Promise.all([
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.employee.count({ where: { status: "ON_LEAVE" } }),
    prisma.dailyAttendance.count({ where: { workDate: date, status: { in: ["PRESENT", "HALF_DAY"] } } }),
    prisma.leaveApplication.count({ where: { status: "OPEN" } }),
    prisma.payrollRun.findFirst({ include: { company: true, _count: { select: { salarySlips: true } } }, orderBy: { periodEnd: "desc" } }),
    prisma.employee.findMany({ where: { status: "ACTIVE" }, include: { department: true }, orderBy: { dateHired: "desc" }, take: 5 }),
  ]);
  return <div className="space-y-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">People overview</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[30px]">HR dashboard</h1><p className="mt-1.5 text-sm text-slate-500">Live employee, attendance, leave, and payroll activity.</p></div><time className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">{now.toLocaleDateString("en-PH", { dateStyle: "full", timeZone: "Asia/Manila" })}</time></div>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<UsersRound />} label="Active employees" value={String(activeEmployees)} /><Metric icon={<CalendarCheck2 />} label="Present today" value={String(attendance)} /><Metric icon={<Activity />} label="On leave" value={String(onLeave)} /><Metric icon={<WalletCards />} label="Leave reviews" value={String(pendingLeave)} /></section>
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="text-sm font-semibold">Recent hires</h2><p className="mt-1 text-xs text-slate-500">Latest active employee records</p></div><Link href="/employees" className="text-xs font-semibold text-teal-700">View directory</Link></div><div className="divide-y divide-slate-100">{recentHires.map((employee) => <article key={employee.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="text-sm font-semibold">{employee.firstName} {employee.lastName}</p><p className="mt-1 text-xs text-slate-500">{employee.employeeNumber} · {employee.department?.name ?? "No department"}</p></div><Link href={`/employees/${employee.id}`} aria-label="Open employee" className="rounded-lg p-2 text-slate-400 hover:bg-teal-50 hover:text-teal-700"><ArrowUpRight className="size-4" /></Link></article>)}{recentHires.length === 0 && <p className="p-6 text-sm text-slate-500">No active employees yet.</p>}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">Latest payroll run</h2><p className="mt-1 text-xs text-slate-500">Current processing state</p></div><WalletCards className="size-5 text-teal-700" /></div>{latestRun ? <div className="mt-5 rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{latestRun.name}</p><StatusBadge tone={latestRun.status === "PAID" ? "success" : "info"}>{latestRun.status}</StatusBadge></div><p className="mt-2 text-xs text-slate-500">{latestRun.company.name} · {latestRun._count.salarySlips} slips · pay date {latestRun.payDate.toISOString().slice(0, 10)}</p><Link href={`/payroll/runs/${latestRun.id}`} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-700">Open payroll <ArrowUpRight className="size-3.5" /></Link></div> : <p className="mt-5 text-sm text-slate-500">No payroll run created.</p>}<div className="mt-5 grid grid-cols-2 gap-2"><Link href="/attendance" className="rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-700">Review attendance</Link><Link href="/leaves" className="rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-700">Review leave requests</Link></div></section></div>
  </div>;
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <article className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div><span className="grid size-9 place-items-center rounded-lg bg-teal-50 text-teal-700 [&>svg]:size-4">{icon}</span></article>; }

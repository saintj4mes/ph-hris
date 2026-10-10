import Link from "next/link";
import { ArrowUpRight, CalendarDays, FileText, ReceiptText } from "lucide-react";
import { SelfCheckinControl } from "@/components/portal/self-checkin-control";
import { prisma } from "@/shared/db/prisma";
import { requireUser } from "@/shared/platform/auth";
import { Decimal } from "@/shared/lib/decimal";

export const dynamic = "force-dynamic";

function phDateKey(date: Date) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }

export default async function PortalHomePage() {
  const user = await requireUser();
  if (!user.employeeId) return <p className="text-sm text-slate-500">Your account is not linked to an employee record. Contact HR.</p>;
  const employee = await prisma.employee.findUniqueOrThrow({ where: { id: user.employeeId }, include: { department: true } });
  const todayKey = phDateKey(new Date());
  const dateOnly = new Date(`${todayKey}T00:00:00.000Z`);
  const localStart = new Date(`${todayKey}T00:00:00+08:00`);
  const localEnd = new Date(localStart.valueOf() + 86_400_000);
  const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
  const [checkin, leaveTypes, balances, slip, recentSlips, shifts, unread] = await Promise.all([
    prisma.employeeCheckin.findFirst({ where: { employeeId: employee.id, eventAt: { gte: localStart, lt: localEnd } }, orderBy: { eventAt: "desc" } }),
    prisma.leaveType.findMany({ where: { companyId: employee.companyId, active: true }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 3 }),
    prisma.leaveLedgerEntry.groupBy({ by: ["leaveTypeId"], where: { employeeId: employee.id }, _sum: { days: true } }),
    prisma.salarySlip.findFirst({ where: { employeeId: employee.id, status: { in: ["SUBMITTED", "PAID"] } }, include: { payrollRun: true }, orderBy: { payrollRun: { periodEnd: "desc" } } }),
    prisma.salarySlip.findMany({ where: { employeeId: employee.id, status: { in: ["SUBMITTED", "PAID"] }, payrollRun: { periodEnd: { gte: yearStart } } }, select: { grossPay: true, netPay: true, taxWithheld: true } }),
    prisma.shiftAssignment.findMany({ where: { employeeId: employee.id, startsOn: { gte: dateOnly }, OR: [{ endsOn: null }, { endsOn: { gte: dateOnly } }] }, include: { shiftSchedule: true }, orderBy: { startsOn: "asc" }, take: 3 }),
    prisma.notification.count({ where: { recipientId: user.id, readAt: null } }),
  ]);
  const balancesByType = new Map(balances.map(({ leaveTypeId, _sum }) => [leaveTypeId, _sum.days?.toString() ?? "0"]));
  const leaveCards = leaveTypes.map((type) => ({ ...type, days: balancesByType.get(type.id) ?? "0" }));
  const ytdGross = recentSlips.reduce((sum, current) => sum.plus(current.grossPay), new Decimal(0)).toFixed(2);
  const fullName = `${employee.firstName} ${employee.lastName}`;
  return <div className="space-y-7"><section className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-700">Employee workspace</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Good day, {employee.firstName}</h1><p className="mt-1 text-sm text-slate-500">{employee.employeeNumber} · {employee.department?.name ?? "Employee"}</p></div><Link href="/portal/notifications" className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">{unread} unread notification{unread === 1 ? "" : "s"}</Link></section>
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><SelfCheckinControl lastLogType={checkin?.logType ?? null} lastEventAt={checkin?.eventAt.toISOString() ?? null} /><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.13em] text-teal-700">Latest payslip</p><h2 className="mt-1 text-base font-semibold">{slip ? `${slip.payrollRun.periodStart.toISOString().slice(0, 10)} to ${slip.payrollRun.periodEnd.toISOString().slice(0, 10)}` : "No published payslip"}</h2></div><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><FileText className="size-5" /></span></div>{slip ? <><div className="mt-5 grid grid-cols-2 gap-3"><Amount label="Net pay" value={slip.netPay.toFixed(2)} /><Amount label="Gross pay" value={slip.grossPay.toFixed(2)} /></div><Link href={`/portal/payslips/${slip.id}`} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-700">Open payslip <ArrowUpRight className="size-3.5" /></Link></> : <p className="mt-4 text-sm text-slate-500">Your payslip will appear after payroll is posted.</p>}<p className="mt-3 text-xs text-slate-500">Year-to-date gross: ₱{ytdGross}</p></section></div>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Leave balances</h2><Link href="/portal/leaves" className="text-xs font-semibold text-teal-700">View leave page</Link></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{leaveCards.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{item.name}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{item.days}<span className="ml-1 text-xs font-normal text-slate-500">days</span></p></article>)}{leaveCards.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No leave types are configured.</p>}</div></section>
    <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">Upcoming shifts</h2><p className="mt-1 text-xs text-slate-500">Your assigned schedule</p></div><CalendarDays className="size-5 text-teal-700" /></div><div className="mt-4 divide-y divide-slate-100">{shifts.map((assignment) => <div key={assignment.id} className="flex justify-between gap-4 py-3"><div><p className="text-sm font-semibold">{assignment.shiftSchedule.name}</p><p className="mt-1 text-xs text-slate-500">{assignment.shiftSchedule.startTime}–{assignment.shiftSchedule.endTime}</p></div><p className="text-xs text-slate-500">{assignment.startsOn.toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric" })}</p></div>)}{shifts.length === 0 && <p className="py-3 text-xs text-slate-500">No upcoming shift assignment.</p>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">Quick actions</h2><div className="mt-3 grid gap-2 sm:grid-cols-2"><QuickLink href="/portal/attendance" icon={<CalendarDays />} label="Attendance history" /><QuickLink href="/portal/leaves" icon={<CalendarDays />} label="Request leave" /><QuickLink href="/portal/expenses" icon={<ReceiptText />} label="Claim an expense" /><QuickLink href="/portal/advances" icon={<ReceiptText />} label="Request an advance" /></div><p className="mt-4 text-xs text-slate-500">Welcome, {fullName}</p></section></div>
  </div>;
}
function Amount({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">₱{value}</p></div>; }
function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) { return <Link href={href} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-3 text-xs font-semibold text-slate-700 hover:border-teal-200 hover:bg-teal-50"><span className="text-teal-700 [&>svg]:size-4">{icon}</span>{label}</Link>; }

import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { prisma } from "@/shared/db/prisma";
import { requireUser } from "@/shared/platform/auth";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function RequestsPage() {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const [leave, expenses, shifts, corrections, overtime, loans, advances, travel] = await Promise.all([
    prisma.leaveApplication.findMany({ where: { employeeId: user.employeeId }, orderBy: { submittedAt: "desc" }, take: 30 }),
    prisma.expenseClaim.findMany({ where: { employeeId: user.employeeId }, orderBy: { submittedAt: "desc" }, take: 30 }),
    prisma.shiftRequest.findMany({ where: { employeeId: user.employeeId }, orderBy: { effectiveDate: "desc" }, take: 30 }),
    prisma.attendanceCorrectionRequest.findMany({ where: { employeeId: user.employeeId }, orderBy: { submittedAt: "desc" }, take: 30 }),
    prisma.overtimeRequest.findMany({ where: { employeeId: user.employeeId }, orderBy: { submittedAt: "desc" }, take: 30 }),
    prisma.employeeLoan.findMany({ where: { employeeId: user.employeeId }, include: { loanProduct: true }, orderBy: { releasedAt: "desc" }, take: 30 }),
    prisma.employeeAdvance.findMany({ where: { employeeId: user.employeeId }, orderBy: { requestedOn: "desc" }, take: 30 }),
    prisma.travelRequest.findMany({ where: { employeeId: user.employeeId }, orderBy: { departAt: "desc" }, take: 30 }),
  ]);
  const items = [
    ...leave.map((r) => ({ id: r.id, type: "Leave", label: r.leaveTypeId, date: r.fromDate, detail: `${r.totalDays.toFixed(2)} day(s) · ${r.reason}`, status: r.status })),
    ...expenses.map((r) => ({ id: r.id, type: "Expense claim", label: r.purpose, date: r.claimDate, detail: `₱${r.totalAmount.toFixed(2)}`, status: r.status })),
    ...shifts.map((r) => ({ id: r.id, type: "Shift change", label: r.requestType, date: r.effectiveDate, detail: r.reason, status: r.status })),
    ...corrections.map((r) => ({ id: r.id, type: "Attendance correction", label: "Time correction", date: r.workDate, detail: r.reason, status: r.status })),
    ...overtime.map((r) => ({ id: r.id, type: "Overtime", label: `${r.requestedHours.toFixed(2)} hours`, date: r.workDate, detail: `${r.dayType} · ${r.reason}`, status: r.status })),
    ...loans.map((r) => ({ id: r.id, type: "Employee loan", label: r.loanProduct.name, date: r.releasedAt ?? new Date(), detail: `Requested ₱${r.requestedAmount.toFixed(2)}`, status: r.status })),
    ...advances.map((r) => ({ id: r.id, type: "Salary advance", label: r.purpose, date: r.requestedOn, detail: `₱${r.requestedAmount.toFixed(2)}`, status: r.status })),
    ...travel.map((r) => ({ id: r.id, type: "Travel request", label: r.destination, date: r.departAt, detail: r.purpose, status: r.status })),
  ].sort((a, b) => b.date.valueOf() - a.date.valueOf());
  return <div className="space-y-5"><Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><ArrowLeft className="size-4" />Home</Link><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-700">Requests</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">My Requests</h1><p className="mt-1 text-sm text-slate-500">Track your submitted leave, time, expense, loan, and travel requests.</p></div><section className="max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="divide-y divide-slate-100">{items.map((item) => <article key={`${item.type}:${item.id}`} className="flex items-center justify-between gap-4 p-4"><div className="flex min-w-0 items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-600"><ClipboardList className="size-4" /></span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-teal-700">{item.type}</p><p className="mt-0.5 truncate text-sm font-semibold">{item.label}</p><p className="mt-1 text-xs text-slate-500">{item.date.toISOString().slice(0,10)} · {item.detail}</p></div></div><StatusBadge tone={item.status === "APPROVED" || item.status === "PAID" || item.status === "CLOSED" ? "success" : item.status === "REJECTED" || item.status === "CANCELLED" ? "warning" : "info"}>{item.status}</StatusBadge></article>)}{items.length === 0 && <div className="p-10 text-center"><p className="text-sm font-medium">No requests submitted</p><p className="mt-1 text-xs text-slate-500">Your submitted requests will appear here.</p></div>}</div></section></div>;
}

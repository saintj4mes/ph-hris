import { ClipboardList } from "lucide-react";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";
import { PendingRequestActions, type RequestKind } from "@/components/admin/pending-request-actions";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";
export default async function RequestsQueuePage() {
  await requirePermission("leave", "read");
  const [leaves, expenses, loans, advances, employmentEvents, attendance, overtime, shifts] = await Promise.all([
    prisma.leaveApplication.findMany({ where: { status: "OPEN" }, include: { employee: true, leaveType: true }, orderBy: { submittedAt: "asc" } }),
    prisma.expenseClaim.findMany({ where: { status: "SUBMITTED" }, include: { employee: true }, orderBy: { submittedAt: "asc" } }),
    prisma.employeeLoan.findMany({ where: { status: { in: ["PENDING", "APPROVED"] } }, include: { employee: true, loanProduct: true }, orderBy: { id: "asc" } }),
    prisma.employeeAdvance.findMany({ where: { status: { in: ["PENDING", "APPROVED"] } }, include: { employee: true }, orderBy: { requestedOn: "asc" } }),
    prisma.employmentEvent.findMany({ where: { status: "PENDING" }, include: { employee: true }, orderBy: { effectiveDate: "asc" } }),
    prisma.attendanceCorrectionRequest.findMany({ where: { status: "PENDING" }, include: { employee: true }, orderBy: { submittedAt: "asc" } }),
    prisma.overtimeRequest.findMany({ where: { status: "PENDING" }, include: { employee: true }, orderBy: { submittedAt: "asc" } }),
    prisma.shiftRequest.findMany({ where: { status: "PENDING" }, include: { employee: true }, orderBy: { effectiveDate: "asc" } }),
  ]);
  const requests: Array<{ id: string; kind: RequestKind; type: string; employee: string; detail: string; date: Date; status: string }> = [
    ...leaves.map((r) => ({ id: r.id, kind: "LEAVE" as const, type: "Leave", employee: `${r.employee.firstName} ${r.employee.lastName}`, detail: `${r.leaveType.name} · ${r.totalDays.toFixed(2)} days · ${r.reason}`, date: r.fromDate, status: r.status })),
    ...expenses.map((r) => ({ id: r.id, kind: "EXPENSE" as const, type: "Expense claim", employee: `${r.employee.firstName} ${r.employee.lastName}`, detail: `${r.purpose} · ₱${r.totalAmount.toFixed(2)}`, date: r.claimDate, status: r.status })),
    ...loans.map((r) => ({ id: r.id, kind: "LOAN" as const, type: "Employee loan", employee: `${r.employee.firstName} ${r.employee.lastName}`, detail: `${r.loanProduct.name} · ₱${(r.approvedAmount ?? r.requestedAmount).toFixed(2)}`, date: r.releasedAt ?? new Date(), status: r.status })),
    ...advances.map((r) => ({ id: r.id, kind: "ADVANCE" as const, type: "Salary advance", employee: `${r.employee.firstName} ${r.employee.lastName}`, detail: `${r.purpose} · ₱${(r.approvedAmount ?? r.requestedAmount).toFixed(2)}`, date: r.requestedOn, status: r.status })),
    ...employmentEvents.map((r) => ({ id: r.id, kind: "EMPLOYMENT_EVENT" as const, type: `Employee ${r.eventType.toLowerCase().replaceAll("_", " ")}`, employee: `${r.employee.firstName} ${r.employee.lastName}`, detail: r.reason, date: r.effectiveDate, status: r.status })),
    ...attendance.map((r) => ({ id: r.id, kind: "ATTENDANCE" as const, type: "Attendance correction", employee: `${r.employee.firstName} ${r.employee.lastName}`, detail: `${r.workDate.toISOString().slice(0,10)} · ${r.reason}`, date: r.submittedAt ?? r.workDate, status: r.status })),
    ...overtime.map((r) => ({ id: r.id, kind: "OVERTIME" as const, type: "Overtime", employee: `${r.employee.firstName} ${r.employee.lastName}`, detail: `${r.workDate.toISOString().slice(0,10)} · ${r.requestedHours.toFixed(2)}h · ${r.reason}`, date: r.submittedAt ?? r.workDate, status: r.status })),
    ...shifts.map((r) => ({ id: r.id, kind: "SHIFT" as const, type: "Shift change", employee: `${r.employee.firstName} ${r.employee.lastName}`, detail: `${r.requestType} · ${r.effectiveDate.toISOString().slice(0,10)} · ${r.reason}`, date: r.effectiveDate, status: r.status })),
  ].sort((a,b) => a.date.valueOf() - b.date.valueOf());
  return <div className="space-y-6"><div className="flex items-center gap-3"><ClipboardList className="size-6 text-teal-700" /><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Workflow center</p><h1 className="mt-1 text-2xl font-semibold">Approval queue</h1><p className="mt-1 text-sm text-slate-500">Review leave, expense, loan, attendance, overtime, and shift requests.</p></div></div><section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="divide-y divide-slate-100">{requests.map((request) => <article key={`${request.kind}:${request.id}`} className="flex flex-wrap items-center justify-between gap-4 p-4"><div><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">{request.type}</span><StatusBadge tone={request.status === "APPROVED" ? "success" : "info"}>{request.status}</StatusBadge></div><p className="mt-1 text-sm font-semibold">{request.employee}</p><p className="mt-1 text-xs text-slate-500">{request.detail}</p></div><PendingRequestActions kind={request.kind} id={request.id} status={request.status} /></article>)}{requests.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No requests are waiting for review.</p>}</div></section></div>;
}

import { ReceiptText } from "lucide-react";
import { ExpenseClaimActions } from "@/components/admin/expense-claim-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  await requirePermission("expense", "read");
  const claims = await prisma.expenseClaim.findMany({ include: { employee: { include: { department: true } }, details: { include: { expenseType: true } } }, orderBy: { claimDate: "desc" }, take: 100 });
  const pending = claims.filter((claim) => claim.status === "SUBMITTED").length;
  return <div className="space-y-7"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-teal-50 text-teal-700"><ReceiptText className="size-6" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Expenses & travel</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[30px]">Expense claims</h1><p className="mt-1 text-sm text-slate-500">Receipt-backed employee expenses, approvals, and reimbursements.</p></div></div><section className="grid gap-3 sm:grid-cols-3"><Metric label="Claims" value={String(claims.length)} /><Metric label="Awaiting review" value={String(pending)} /><Metric label="Approved" value={String(claims.filter((claim) => claim.status === "APPROVED").length)} /></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Employee / purpose</th><th className="px-4 py-3">Claim lines</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{claims.map((claim) => <tr key={claim.id}><td className="px-5 py-4"><p className="font-semibold">{claim.employee.firstName} {claim.employee.lastName}</p><p className="mt-1 text-xs text-slate-500">{claim.employee.employeeNumber} · {claim.purpose}</p></td><td className="px-4 py-4 text-xs text-slate-600">{claim.details.map((detail) => `${detail.expenseType.name}: ₱${detail.amount.toFixed(2)}`).join(" · ")}</td><td className="px-4 py-4 font-semibold tabular-nums">₱{claim.totalAmount.toFixed(2)}</td><td className="px-4 py-4"><StatusBadge tone={claim.status === "PAID" ? "success" : claim.status === "SUBMITTED" ? "warning" : "neutral"}>{claim.status.replaceAll("_", " ")}</StatusBadge></td><td className="px-5 py-4"><ExpenseClaimActions id={claim.id} status={claim.status} /></td></tr>)}</tbody></table>{claims.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No expense claims recorded.</p>}</div></section>
  </div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></article>; }

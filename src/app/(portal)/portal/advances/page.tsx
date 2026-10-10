import { Banknote } from "lucide-react";
import { AdvanceRequestForm } from "@/components/portal/advance-request-form";
import { LoanRequestForm } from "@/components/portal/loan-request-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { getMyLoanDataAction } from "@/modules/expenses/actions/portal";
import { Decimal } from "@/shared/lib/decimal";

export default async function EmployeeAdvancesPage() {
  const { loans, products, advances } = await getMyLoanDataAction();
  const outstanding = loans.filter((loan) => loan.status === "RELEASED").reduce((sum, loan) => sum.plus(loan.outstanding), new Decimal(0));
  return <div className="space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-700">Employee finance</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Salary Advances & Loans</h1><p className="mt-1 text-sm text-slate-500">Request either type of support and follow its approval and repayment.</p></div>
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-5">
        <section className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><span className="grid size-10 place-items-center rounded-lg bg-blue-50 text-blue-700"><Banknote className="size-5" /></span><div><p className="text-xs text-slate-500">Outstanding loan balance</p><p className="mt-1 text-xl font-semibold">₱{outstanding.toFixed(2)}</p></div></section>
        <AdvanceRequestForm />
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-4"><h2 className="text-sm font-semibold">Advance history</h2></div><div className="divide-y divide-slate-100">{advances.map((advance) => <article key={advance.id} className="flex items-center justify-between gap-3 p-4"><div><p className="text-sm font-semibold">{advance.purpose}</p><p className="mt-1 text-xs text-slate-500">Requested ₱{advance.requestedAmount.toFixed(2)} · settled ₱{advance.settledAmount.toFixed(2)}</p></div><StatusBadge tone={advance.status === "SETTLED" ? "success" : advance.status === "REJECTED" ? "warning" : "info"}>{advance.status}</StatusBadge></article>)}{advances.length === 0 && <p className="p-6 text-sm text-slate-500">No salary advance requests yet.</p>}</div></section>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-4"><h2 className="text-sm font-semibold">Loan history</h2></div><div className="divide-y divide-slate-100">{loans.map((loan) => <article key={loan.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{loan.loanProduct.name}</p><p className="mt-1 text-xs text-slate-500">Requested ₱{loan.requestedAmount.toFixed(2)} · {loan.installments} installments</p></div><StatusBadge tone={loan.status === "CLOSED" ? "success" : loan.status === "REJECTED" ? "warning" : "info"}>{loan.status}</StatusBadge></div>{loan.status === "RELEASED" && <><p className="mt-2 text-xs text-slate-600">Outstanding ₱{loan.outstanding.toFixed(2)}</p><div className="mt-3 space-y-1">{loan.repayments.map((repayment) => <p key={repayment.id} className="flex justify-between text-xs text-slate-500"><span>{repayment.dueDate.toISOString().slice(0, 10)} · {repayment.paidAt ? "Paid" : `Due · paid ${repayment.paidAmount.toFixed(2)}`}</span><span>₱{repayment.amount.toFixed(2)}</span></p>)}</div></>}</article>)}{loans.length === 0 && <p className="p-6 text-sm text-slate-500">No loan requests yet.</p>}</div></section>
      </div>
      <LoanRequestForm products={products} />
    </div>
  </div>;
}

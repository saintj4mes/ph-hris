"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Decimal } from "@/shared/lib/decimal";
import { createLoanProductAction, recordLoanRepaymentAction } from "@/modules/expenses/actions/loans";

type Company = { id: string; name: string };
type Product = { id: string; code: string; name: string; interestRate: string; maximumAmount: string | null };
type Repayment = { id: string; employee: string; product: string; dueDate: string; amount: string; paidAmount: string; assignedToPayroll: boolean };

export function LoanOperations({ companies, products, repayments }: { companies: Company[]; products: Product[]; repayments: Repayment[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function run(action: () => Promise<unknown>) {
    setMessage("");
    startTransition(async () => {
      try { await action(); setMessage("Saved."); router.refresh(); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Could not update loan records."); }
    });
  }
  return <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold">Loan products</h2>
      <p className="mt-1 text-xs text-slate-500">Configure employee loan limits and flat interest rates applied at release.</p>
      <form className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" onSubmit={(event) => {
        event.preventDefault(); const form = new FormData(event.currentTarget);
        run(() => createLoanProductAction({ companyId: String(form.get("companyId")), code: String(form.get("code")), name: String(form.get("name")), flatInterestPercent: String(form.get("flatInterestPercent")), maximumAmount: String(form.get("maximumAmount") || "") || undefined }));
        event.currentTarget.reset();
      }}>
        <select required name="companyId" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Company</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>
        <input required name="code" placeholder="Code" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
        <input required name="name" placeholder="Product name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
        <input required name="flatInterestPercent" type="number" min="0" max="100" step="0.01" placeholder="Flat interest %" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
        <input name="maximumAmount" type="number" min="0.01" step="0.01" placeholder="Maximum PHP" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
        <button disabled={pending || !companies.length} className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2 xl:col-span-5">Create loan product</button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">{products.map((product) => <span key={product.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{product.code} · {product.name} · {new Decimal(product.interestRate).mul(100).toFixed(2)}% · max {product.maximumAmount ? `₱${new Decimal(product.maximumAmount).toFixed(2)}` : "none"}</span>)}{products.length === 0 && <span className="text-xs text-slate-500">No products configured.</span>}</div>
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5"><h2 className="text-sm font-semibold">Repayment register</h2><p className="mt-1 text-xs text-slate-500">Record direct receipts here. Payroll-linked repayments are settled when payroll is marked paid.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Employee / product</th><th className="px-4 py-3">Due date</th><th className="px-4 py-3">Scheduled</th><th className="px-4 py-3">Outstanding installment</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{repayments.map((repayment) => <tr key={repayment.id}><td className="px-5 py-4"><p className="font-semibold">{repayment.employee}</p><p className="mt-1 text-xs text-slate-500">{repayment.product}</p></td><td className="px-4 py-4 text-xs">{repayment.dueDate}</td><td className="px-4 py-4">₱{new Decimal(repayment.amount).toFixed(2)}</td><td className="px-4 py-4">₱{Decimal.max(0, new Decimal(repayment.amount).minus(repayment.paidAmount)).toFixed(2)}</td><td className="px-5 py-4">{repayment.assignedToPayroll ? <span className="text-xs text-slate-500">Assigned to payroll</span> : <button disabled={pending} onClick={() => run(() => recordLoanRepaymentAction({ repaymentId: repayment.id }))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">Record payment</button>}</td></tr>)}{repayments.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-500">No loan repayments due.</td></tr>}</tbody></table></div>
    </section>
    {message && <p role="status" className="text-xs text-slate-600">{message}</p>}
  </div>;
}

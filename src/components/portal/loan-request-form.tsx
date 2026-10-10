"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestEmployeeLoanAction } from "@/modules/expenses/actions/loans";

type Product = { id: string; name: string; maximumAmount: { toString(): string } | null };
export function LoanRequestForm({ products }: { products: Product[] }) {
  const router = useRouter(); const [busy, startTransition] = useTransition(); const [error, setError] = useState<string | null>(null);
  function submit(data: FormData) { setError(null); startTransition(async () => { try { await requestEmployeeLoanAction({ loanProductId: String(data.get("loanProductId")), requestedAmount: String(data.get("amount")), installments: Number(data.get("installments")) }); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not submit loan request."); } }); }
  return <form action={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div><h2 className="text-sm font-semibold">Request an employee loan</h2><p className="mt-1 text-xs text-slate-500">Requests go to HR for approval.</p></div>{products.length ? <label className="block text-xs font-medium text-slate-600">Loan product<select name="loanProductId" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">{products.map((p) => <option value={p.id} key={p.id}>{p.name}{p.maximumAmount ? ` · max ₱${p.maximumAmount.toString()}` : ""}</option>)}</select></label> : <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">No active loan products are configured.</p>}<div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium text-slate-600">Amount (PHP)<input required name="amount" type="number" min="0.01" step="0.01" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label><label className="text-xs font-medium text-slate-600">Installments<input required name="installments" type="number" min="1" max="60" defaultValue="3" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label></div>{error && <p role="alert" className="text-xs text-rose-700">{error}</p>}<button disabled={busy || !products.length} className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Submitting…" : "Request loan"}</button></form>;
}

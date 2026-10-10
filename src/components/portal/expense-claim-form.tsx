"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMyExpenseClaimAction, submitExpenseClaimAction } from "@/modules/expenses/actions/claims";

type ExpenseType = { id: string; name: string };
export function ExpenseClaimForm({ types }: { types: ExpenseType[] }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const claim = await createMyExpenseClaimAction({
          claimDate: String(formData.get("claimDate")),
          purpose: String(formData.get("purpose")),
          details: [{ expenseTypeId: String(formData.get("expenseTypeId")), expenseDate: String(formData.get("expenseDate")), description: String(formData.get("description")), amount: String(formData.get("amount")), receiptUrl: String(formData.get("receiptUrl")) }],
        });
        await submitExpenseClaimAction(claim.id);
        router.refresh();
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not submit expense claim."); }
    });
  }
  return <form action={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div><h2 className="text-sm font-semibold">Submit an expense claim</h2><p className="mt-1 text-xs text-slate-500">A receipt link is required before submission.</p></div>
    {types.length ? <label className="block text-xs font-medium text-slate-600">Expense type<select required name="expenseTypeId" className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label> : <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Ask an administrator to configure an expense type first.</p>}
    <div className="grid gap-3 sm:grid-cols-2">{[{ name: "claimDate", label: "Claim date" }, { name: "expenseDate", label: "Expense date" }].map((field) => <label key={field.name} className="text-xs font-medium text-slate-600">{field.label}<input required name={field.name} type="date" defaultValue={new Date().toISOString().slice(0,10)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>)}</div>
    <label className="block text-xs font-medium text-slate-600">Purpose<input required name="purpose" minLength={4} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
    <label className="block text-xs font-medium text-slate-600">Description<input required name="description" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium text-slate-600">Amount (PHP)<input required name="amount" type="number" min="0.01" step="0.01" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label><label className="text-xs font-medium text-slate-600">Receipt URL<input required name="receiptUrl" type="url" placeholder="https://…" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label></div>
    {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}<button disabled={busy || !types.length} className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit claim"}</button>
  </form>;
}

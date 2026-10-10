"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCompanyAction } from "@/modules/core-hr/actions/company";

export function CompanyCreateForm() {
  const router = useRouter(); const [busy, startTransition] = useTransition(); const [error, setError] = useState<string | null>(null);
  return <form action={(data) => { setError(null); startTransition(async () => { try { await createCompanyAction({ name: String(data.get("name")), legalName: String(data.get("legalName") || ""), tin: String(data.get("tin") || "") }); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create company."); } }); }} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
    <label className="text-xs font-medium text-slate-600">Company name<input required name="name" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
    <label className="text-xs font-medium text-slate-600">Legal name<input name="legalName" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
    <label className="text-xs font-medium text-slate-600">Company TIN<input name="tin" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
    {error && <p role="alert" className="text-xs text-rose-700 sm:col-span-3">{error}</p>}<div className="sm:col-span-3"><button disabled={busy} className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Create company"}</button></div>
  </form>;
}

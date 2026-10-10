"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBaseSalaryStructureAction } from "@/modules/core-hr/actions/compensation";

export function SalaryStructureForm({ companyId }: { companyId: string }) {
  const router = useRouter(); const [busy, startTransition] = useTransition(); const [error, setError] = useState<string | null>(null);
  return <form action={(data) => { setError(null); startTransition(async () => { try { await createBaseSalaryStructureAction({ companyId, code: String(data.get("code")), name: String(data.get("name")) }); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create salary structure."); } }); }} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
    <input required name="code" placeholder="Structure code" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
    <input required name="name" placeholder="Structure name (e.g. Monthly Standard)" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
    <button disabled={busy} className="h-9 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white disabled:opacity-50">Create base structure</button>
    {error && <p role="alert" className="text-xs text-rose-700 sm:col-span-3">{error}</p>}
  </form>;
}

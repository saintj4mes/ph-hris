"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { finalizeAppraisalAction } from "@/modules/performance/actions/cycles";

export function AppraisalFinalizeForm({ appraisalId }: { appraisalId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return <form className="flex flex-wrap items-center gap-2" onSubmit={(event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); setError("");
    startTransition(async () => {
      try { await finalizeAppraisalAction({ appraisalId, managerRating: String(form.get("managerRating")), managerNotes: String(form.get("managerNotes")) }); router.refresh(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Could not finalize appraisal."); }
    });
  }}>
    <label className="sr-only" htmlFor={`rating-${appraisalId}`}>Manager rating</label><input id={`rating-${appraisalId}`} name="managerRating" type="number" min="1" max="5" step="0.5" defaultValue="3" className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-sm" />
    <input name="managerNotes" placeholder="Manager feedback" className="h-9 min-w-36 rounded-lg border border-slate-200 px-2 text-sm" />
    <button disabled={pending} className="h-9 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white disabled:opacity-50">Finalize</button>
    {error && <span role="alert" className="basis-full text-xs text-rose-700">{error}</span>}
  </form>;
}

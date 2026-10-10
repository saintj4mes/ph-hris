"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateMyPerformanceGoalAction } from "@/modules/performance/actions/cycles";

export function GoalProgressForm({ goalId, actualValue, status }: { goalId: string; actualValue: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); setError("");
    startTransition(async () => {
      try { await updateMyPerformanceGoalAction({ goalId, actualValue: String(form.get("actualValue")), status: String(form.get("status")) as "OPEN" | "COMPLETED" }); router.refresh(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update goal progress."); }
    });
  }}>
    <label className="text-[11px] font-medium text-slate-500">Actual {" "}<input name="actualValue" type="number" step="0.01" required defaultValue={actualValue} className="ml-1 h-8 w-24 rounded-md border border-slate-200 px-2 text-xs text-slate-800" /></label>
    <select name="status" defaultValue={status === "COMPLETED" ? "COMPLETED" : "OPEN"} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"><option value="OPEN">In progress</option><option value="COMPLETED">Completed</option></select>
    <button disabled={pending} className="h-8 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:opacity-50">Update</button>
    {error && <span role="alert" className="basis-full text-xs text-rose-700">{error}</span>}
  </form>;
}

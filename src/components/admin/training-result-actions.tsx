"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recordTrainingResultAction } from "@/modules/performance/actions/cycles";

export function TrainingResultActions({ enrollmentId, eventEnded }: { enrollmentId: string; eventEnded: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return <form className="flex flex-wrap gap-2" onSubmit={(event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); setError("");
    startTransition(async () => {
      try { await recordTrainingResultAction({ enrollmentId, status: String(form.get("status")) as "COMPLETED" | "NO_SHOW" | "DROPPED", result: String(form.get("result")), score: String(form.get("score")) || undefined, feedback: String(form.get("feedback")) }); router.refresh(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save training result."); }
    });
  }}><select name="status" className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"><option>COMPLETED</option><option>NO_SHOW</option><option>DROPPED</option></select><input name="result" placeholder="Result / certificate" className="h-8 w-32 rounded-lg border border-slate-200 px-2 text-xs" /><input name="score" type="number" min="0" max="100" step="0.01" placeholder="Score" className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-xs" /><input name="feedback" placeholder="Feedback" className="h-8 w-32 rounded-lg border border-slate-200 px-2 text-xs" /><button disabled={pending || !eventEnded} className="h-8 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white disabled:opacity-50">Save result</button>{error && <span role="alert" className="basis-full text-xs text-rose-700">{error}</span>}</form>;
}

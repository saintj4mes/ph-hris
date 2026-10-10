"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resolveEmployeeGrievanceAction } from "@/modules/core-hr/actions/employee-services";

export function GrievanceResolution({ grievanceId }: { grievanceId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return <form className="flex gap-2" onSubmit={(event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); setError("");
    startTransition(async () => {
      try { await resolveEmployeeGrievanceAction({ grievanceId, resolution: String(form.get("resolution")) }); router.refresh(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Could not resolve this report."); }
    });
  }}><input required minLength={3} name="resolution" placeholder="Resolution note" className="h-9 min-w-48 flex-1 rounded-lg border border-slate-200 px-3 text-xs" /><button disabled={pending} className="h-9 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : "Resolve"}</button>{error && <span role="alert" className="basis-full text-xs text-rose-700">{error}</span>}</form>;
}

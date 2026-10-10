"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAppraisalCycleAction } from "@/modules/performance/actions/cycles";
import { Button } from "@/components/ui/button";

export function AppraisalCycleForm({ companyId }: { companyId: string }) {
  const router = useRouter(); const [message, setMessage] = useState("");
  return <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><summary className="cursor-pointer text-sm font-semibold">Create appraisal cycle</summary><form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await createAppraisalCycleAction({ companyId, name: String(form.get("name")), startsOn: String(form.get("startsOn")), endsOn: String(form.get("endsOn")) }); setMessage("Appraisal cycle created."); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create the cycle."); } }}><input required name="name" placeholder="Cycle name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><input required name="startsOn" type="date" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><input required name="endsOn" type="date" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><div className="flex items-center gap-3 sm:col-span-3"><Button>Create cycle</Button>{message && <span role="status" className="text-xs text-slate-500">{message}</span>}</div></form></details>;
}

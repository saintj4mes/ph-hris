"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTrainingProgramAction } from "@/modules/performance/actions/cycles";
import { Button } from "@/components/ui/button";

export function TrainingProgramForm({ companyId }: { companyId: string }) {
  const router = useRouter(); const [message, setMessage] = useState("");
  return <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><summary className="cursor-pointer text-sm font-semibold">Create training program</summary><form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await createTrainingProgramAction({ companyId, code: String(form.get("code")), name: String(form.get("name")), description: String(form.get("description") || "") }); setMessage("Program created."); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create the program."); } }}><input required name="code" placeholder="Program code" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><input required name="name" placeholder="Program name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><input name="description" placeholder="Description" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><div className="flex items-center gap-3 sm:col-span-3"><Button>Create program</Button>{message && <span role="status" className="text-xs text-slate-500">{message}</span>}</div></form></details>;
}

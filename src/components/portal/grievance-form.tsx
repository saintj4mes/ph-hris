"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fileEmployeeGrievanceAction } from "@/modules/core-hr/actions/employee-services";
import { Button } from "@/components/ui/button";

export function GrievanceForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={async (event) => {
    event.preventDefault(); setPending(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try { await fileEmployeeGrievanceAction({ grievanceType: String(form.get("grievanceType")), title: String(form.get("title")), description: String(form.get("description")) }); setMessage("Your confidential report was sent to HR."); event.currentTarget.reset(); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not file the report."); }
    finally { setPending(false); }
  }}>
    <h2 className="text-sm font-semibold">Contact employee relations</h2><p className="mt-1 text-xs text-slate-500">Reports are marked confidential and visible only to authorized reviewers.</p>
    <div className="mt-4 space-y-3"><select name="grievanceType" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">{["WORKPLACE_CONCERN", "HARASSMENT", "SAFETY", "PAYROLL", "OTHER"].map((type) => <option key={type}>{type}</option>)}</select><input required minLength={3} name="title" placeholder="Short title" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /><textarea required minLength={10} name="description" rows={5} placeholder="Describe your concern" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
    <div className="mt-3 flex items-center gap-3"><Button disabled={pending}>{pending ? "Sending…" : "Send confidential report"}</Button>{message && <span role="status" className="text-xs text-slate-600">{message}</span>}</div>
  </form>;
}

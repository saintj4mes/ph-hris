"use client";

import { useState } from "react";
import { submitPublicJobApplicationAction } from "@/modules/recruitment/actions/pipeline";
import { Button } from "@/components/ui/button";

export function PublicApplicationForm({ jobOpeningId }: { jobOpeningId: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={async (event) => {
    event.preventDefault(); setPending(true); setMessage(""); const form = new FormData(event.currentTarget);
    try { await submitPublicJobApplicationAction({ jobOpeningId, fullName: String(form.get("fullName")), email: String(form.get("email")), phone: String(form.get("phone")), resumeUrl: String(form.get("resumeUrl")) }); setMessage("Application submitted. Thank you."); event.currentTarget.reset(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not submit application."); }
    finally { setPending(false); }
  }}><input required minLength={2} name="fullName" placeholder="Full name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><input required type="email" name="email" placeholder="Email" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><input name="phone" placeholder="Phone" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><input type="url" name="resumeUrl" placeholder="Resume link (optional)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><div className="flex items-center gap-3 sm:col-span-2"><Button disabled={pending}>{pending ? "Submitting…" : "Apply"}</Button>{message && <span role="status" className="text-xs text-slate-600">{message}</span>}</div></form>;
}

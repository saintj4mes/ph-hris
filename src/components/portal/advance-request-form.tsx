"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestEmployeeAdvanceAction } from "@/modules/expenses/actions/loans";
import { Button } from "@/components/ui/button";

export function AdvanceRequestForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return <form className="rounded-xl border border-slate-200 bg-white p-4" onSubmit={async (event) => {
    event.preventDefault(); setPending(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try { await requestEmployeeAdvanceAction({ requestedAmount: String(form.get("requestedAmount")), purpose: String(form.get("purpose")) }); setMessage("Advance request sent for approval."); event.currentTarget.reset(); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not request a salary advance."); }
    finally { setPending(false); }
  }}>
    <h2 className="text-sm font-semibold">Request a salary advance</h2><p className="mt-1 text-xs text-slate-500">Approved advances are released by HR and repaid through payroll.</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-2"><input required name="requestedAmount" type="number" min="0.01" step="0.01" placeholder="Amount in PHP" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><input required name="purpose" minLength={3} placeholder="Purpose" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /></div>
    <div className="mt-3 flex items-center gap-3"><Button disabled={pending}>{pending ? "Submitting…" : "Submit advance request"}</Button>{message && <span role="status" className="text-xs text-slate-600">{message}</span>}</div>
  </form>;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelMyLeaveApplicationAction, createMyLeaveApplicationAction, submitMyLeaveApplicationAction } from "@/modules/leave/actions/applications";
import { Button } from "@/components/ui/button";

export function LeaveApplicationForm({ leaveTypes }: { leaveTypes: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={async (event) => {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const draft = await createMyLeaveApplicationAction({ leaveTypeId: String(form.get("leaveTypeId")), fromDate: String(form.get("fromDate")), toDate: String(form.get("toDate")), halfDay: form.get("halfDay") === "on", reason: String(form.get("reason")), attachmentUrl: String(form.get("attachmentUrl") || "") });
      await submitMyLeaveApplicationAction(draft.id);
      setMessage("Leave request submitted for approval.");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not submit the leave request."); }
    finally { setPending(false); }
  }}>
    <h2 className="text-sm font-semibold">Request a leave</h2><p className="mt-1 text-xs text-slate-500">Your balance is checked before the request enters approval.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="block sm:col-span-2"><span className="mb-1 block text-xs font-semibold">Leave type</span><select name="leaveTypeId" required className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Select leave type</option>{leaveTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label><label className="block"><span className="mb-1 block text-xs font-semibold">From</span><input name="fromDate" type="date" required className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label><label className="block"><span className="mb-1 block text-xs font-semibold">To</span><input name="toDate" type="date" required className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label><label className="flex items-center gap-2 text-xs text-slate-600"><input name="halfDay" type="checkbox" className="rounded border-slate-300 text-teal-700" />Half day</label><label className="block sm:col-span-2"><span className="mb-1 block text-xs font-semibold">Reason</span><textarea name="reason" required rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label><label className="block sm:col-span-2"><span className="mb-1 block text-xs font-semibold">Supporting document URL, if required</span><input name="attachmentUrl" type="url" placeholder="https://…" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label></div>
    <div className="mt-4 flex items-center gap-3"><Button disabled={pending || leaveTypes.length === 0}>{pending ? "Submitting…" : "Submit leave request"}</Button>{message && <p role="status" className="text-xs text-slate-600">{message}</p>}</div>
  </form>;
}

export function CancelLeaveButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return <div className="flex items-center gap-2"><button type="button" disabled={pending} onClick={async () => {
    setPending(true); setMessage("");
    try { await cancelMyLeaveApplicationAction(applicationId); setMessage("Cancelled"); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not cancel this request."); }
    finally { setPending(false); }
  }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-50">{pending ? "Cancelling…" : "Cancel"}</button>{message && <span role="status" className="max-w-48 text-xs text-slate-500">{message}</span>}</div>;
}

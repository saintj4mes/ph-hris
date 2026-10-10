"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { requestCompensatoryLeaveAction, requestLeaveEncashmentAction } from "@/modules/leave/actions/leave-benefits";

type LeaveOption = { id: string; name: string };

export function LeaveBenefitForms({ encashableTypes, compensatoryTypes }: { encashableTypes: LeaveOption[]; compensatoryTypes: LeaveOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function submit(action: () => Promise<unknown>, success: string) {
    setMessage("");
    startTransition(async () => {
      try { await action(); setMessage(success); router.refresh(); }
      catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not submit request."); }
    });
  }
  return <div className="grid gap-4 lg:grid-cols-2">
    <form className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); submit(() => requestLeaveEncashmentAction({ leaveTypeId: String(form.get("leaveTypeId")), days: String(form.get("days")) }), "Encashment request sent for approval."); }}>
      <div><h2 className="text-sm font-semibold">Request leave encashment</h2><p className="mt-1 text-xs text-slate-500">Amount is estimated from your active salary rate and company divisor.</p></div>
      <select required name="leaveTypeId" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Select eligible leave</option>{encashableTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select>
      <div className="flex gap-2"><input required name="days" type="number" min="0.01" step="0.01" placeholder="Days to encash" className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm" /><button disabled={pending || !encashableTypes.length} className="rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50">Request</button></div>
      {!encashableTypes.length && <p className="text-xs text-slate-500">No leave types are enabled for encashment.</p>}
    </form>
    <form className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); submit(() => requestCompensatoryLeaveAction({ leaveTypeId: String(form.get("leaveTypeId")), workDate: String(form.get("workDate")), hoursWorked: String(form.get("hoursWorked")), reason: String(form.get("reason")) }), "Compensatory time request sent for approval."); }}>
      <div><h2 className="text-sm font-semibold">Request compensatory time</h2><p className="mt-1 text-xs text-slate-500">Earned days are calculated from approved hours and scheduled hours per day.</p></div>
      <select required name="leaveTypeId" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Select compensatory leave type</option>{compensatoryTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select>
      <div className="grid gap-2 sm:grid-cols-2"><input required name="workDate" type="date" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><input required name="hoursWorked" type="number" min="0.01" step="0.25" placeholder="Approved extra hours" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /></div>
      <div className="flex gap-2"><input required name="reason" minLength={3} placeholder="Work performed / approval reference" className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm" /><button disabled={pending || !compensatoryTypes.length} className="rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50">Request</button></div>
      {!compensatoryTypes.length && <p className="text-xs text-slate-500">No compensatory leave types are configured.</p>}
    </form>
    {message && <p role="status" className="rounded-lg bg-slate-100 p-3 text-xs text-slate-700 lg:col-span-2">{message}</p>}
  </div>;
}

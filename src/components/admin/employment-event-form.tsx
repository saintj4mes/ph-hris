"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recordEmploymentEventAction } from "@/modules/core-hr/actions/employees";

type Option = { id: string; name: string };
export function EmploymentEventForm({ employeeId, departments, designations }: { employeeId: string; departments: Option[]; designations: Option[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <summary className="cursor-pointer text-sm font-semibold">Record promotion, transfer, status change, or separation</summary>
    <form className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" onSubmit={(event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget); setMessage("");
      const value = (name: string) => String(form.get(name) ?? "");
      const eventType = value("eventType") as "TRANSFER" | "PROMOTION" | "STATUS_CHANGE" | "SEPARATION" | "REHIRE";
      startTransition(async () => {
        try {
          await recordEmploymentEventAction({ employeeId, eventType, effectiveDate: value("effectiveDate"), reason: value("reason"), newValue: { departmentId: value("departmentId"), designationId: value("designationId"), status: value("status") } });
          setMessage("Employment event recorded."); router.refresh();
        } catch (error) { setMessage(error instanceof Error ? error.message : "Could not record the employment event."); }
      });
    }}>
      <select required name="eventType" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">{["TRANSFER", "PROMOTION", "STATUS_CHANGE", "SEPARATION", "REHIRE"].map((kind) => <option key={kind}>{kind}</option>)}</select>
      <input required name="effectiveDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
      <select name="departmentId" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Destination department (for transfer)</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select name="designationId" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">New designation (for promotion)</option>{designations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select name="status" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">New status</option>{["ACTIVE", "INACTIVE", "ON_LEAVE", "SEPARATED"].map((status) => <option key={status}>{status}</option>)}</select>
      <input required minLength={3} name="reason" placeholder="Reason" className="h-10 rounded-lg border border-slate-200 px-3 text-sm sm:col-span-2" />
      <div className="flex items-center gap-3"><button disabled={pending} className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : "Apply change"}</button>{message && <span role="status" className="text-xs text-slate-600">{message}</span>}</div>
    </form>
    <p className="mt-3 text-xs text-slate-500">The request enters the approval queue. Approved changes update the employee record and preserve before/after values. Future-dated changes require a scheduled workflow, which is not enabled.</p>
  </details>;
}

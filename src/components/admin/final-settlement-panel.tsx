"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveFullAndFinalSettlementAction, createFullAndFinalSettlementAction, markFullAndFinalSettlementPaidAction } from "@/modules/core-hr/actions/employee-services";
import { StatusBadge } from "@/components/ui/status-badge";
import { Decimal } from "@/shared/lib/decimal";

type EmployeeOption = { id: string; label: string; separationDate: string };
type Settlement = { id: string; employee: string; separationDate: string; grossSettlement: string; netSettlement: string; status: string; paidAt: string | null };

export function FinalSettlementPanel({ employees, settlements }: { employees: EmployeeOption[]; settlements: Settlement[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function run(action: () => Promise<unknown>) {
    setMessage(""); startTransition(async () => {
      try { await action(); setMessage("Saved."); router.refresh(); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Could not update final settlement."); }
    });
  }
  return <div className="space-y-6">
    <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 xl:grid-cols-4" onSubmit={(event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget); const value = (key: string) => String(form.get(key) ?? "");
      run(() => createFullAndFinalSettlementAction({ employeeId: value("employeeId"), separationDate: value("separationDate"), finalBasicPay: value("finalBasicPay") || "0", leaveEncashment: value("leaveEncashment") || "0", thirteenthMonthPay: value("thirteenthMonthPay") || "0", otherEarnings: value("otherEarnings") || "0", loanOutstanding: value("loanOutstanding") || "0", otherDeductions: value("otherDeductions") || "0" }));
      event.currentTarget.reset();
    }}>
      <h2 className="text-sm font-semibold sm:col-span-2 xl:col-span-4">Prepare final settlement</h2>
      <select required name="employeeId" onChange={(event) => { const employee = employees.find((item) => item.id === event.target.value); const date = event.currentTarget.form?.elements.namedItem("separationDate") as HTMLInputElement | null; if (date && employee) date.value = employee.separationDate; }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Separated employee</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.label}</option>)}</select>
      <input required name="separationDate" type="date" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
      {["finalBasicPay", "leaveEncashment", "thirteenthMonthPay", "otherEarnings", "loanOutstanding", "otherDeductions"].map((name) => <input key={name} name={name} type="number" min="0" step="0.01" placeholder={`${name.replaceAll(/([A-Z])/g, " $1")} PHP`} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />)}
      <button disabled={pending || !employees.length} className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2 xl:col-span-4">Submit for approval</button>
    </form>
    <section className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{settlements.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="text-sm font-semibold">{item.employee}</p><p className="mt-1 text-xs text-slate-500">Separated {item.separationDate} · gross ₱{new Decimal(item.grossSettlement).toFixed(2)} · net ₱{new Decimal(item.netSettlement).toFixed(2)}</p><p className="mt-1 text-xs text-slate-500">{item.paidAt ? `Paid ${item.paidAt}` : "Payment pending"}</p></div><div className="flex items-center gap-3"><StatusBadge tone={item.paidAt ? "success" : item.status === "REJECTED" ? "warning" : "info"}>{item.paidAt ? "PAID" : item.status}</StatusBadge>{item.status === "PENDING" && <button disabled={pending} onClick={() => run(() => approveFullAndFinalSettlementAction(item.id))} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white">Approve</button>}{item.status === "APPROVED" && !item.paidAt && <button disabled={pending} onClick={() => run(() => markFullAndFinalSettlementPaidAction(item.id))} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white">Mark paid</button>}</div></article>)}{settlements.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No final settlements prepared.</p>}</section>
    {message && <p role="status" className="text-xs text-slate-600">{message}</p>}
  </div>;
}

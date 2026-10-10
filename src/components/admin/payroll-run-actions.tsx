"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approvePayrollRunAction, calculatePayrollRunAction, markPayrollRunPaidAction, postPayrollRunAction } from "@/modules/payroll/actions/payroll-runs";

export function PayrollRunActions({ id, status }: { id: string; status: string }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [message, setMessage] = useState("");
  async function run(action: () => Promise<unknown>) { setPending(true); setMessage(""); try { await action(); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Payroll action failed."); } finally { setPending(false); } }
  return <div className="space-y-2"><div className="flex flex-wrap gap-2">{["DRAFT", "FAILED"].includes(status) && <button disabled={pending} onClick={() => run(() => calculatePayrollRunAction(id))} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white">Calculate</button>}{status === "CALCULATED" && <button disabled={pending} onClick={() => run(() => approvePayrollRunAction(id))} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white">Approve & freeze</button>}{status === "APPROVED" && <button disabled={pending} onClick={() => run(() => postPayrollRunAction(id))} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white">Post payroll journal</button>}{status === "SUBMITTED" && <button disabled={pending} onClick={() => run(() => markPayrollRunPaidAction(id))} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white">Mark paid</button>}</div>{message && <p role="alert" className="text-xs text-rose-600">{message}</p>}</div>;
}

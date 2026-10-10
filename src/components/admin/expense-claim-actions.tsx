"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markExpenseClaimPaidAction, reviewExpenseClaimAction } from "@/modules/expenses/actions/claims";

export function ExpenseClaimActions({ id, status }: { id: string; status: string }) {
  const router = useRouter(); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<unknown>) { setBusy(true); try { await action(); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Action failed."); } finally { setBusy(false); } }
  return <div className="flex items-center gap-2">{status === "SUBMITTED" && <><button disabled={busy} onClick={() => run(() => reviewExpenseClaimAction({ claimId: id, approve: true }))} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white">Approve</button><button disabled={busy} onClick={() => run(() => reviewExpenseClaimAction({ claimId: id, approve: false }))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Reject</button></>}{status === "APPROVED" && <button disabled={busy} onClick={() => run(() => markExpenseClaimPaidAction(id))} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white">Mark reimbursed</button>}{message && <span role="alert" className="text-[11px] text-rose-600">{message}</span>}</div>;
}

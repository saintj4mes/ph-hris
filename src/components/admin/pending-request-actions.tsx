"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { decideLeaveApplicationAction } from "@/modules/leave/actions/applications";
import { reviewExpenseClaimAction } from "@/modules/expenses/actions/claims";
import { releaseEmployeeAdvanceAction, reviewEmployeeAdvanceAction, reviewEmployeeLoanAction, releaseEmployeeLoanAction } from "@/modules/expenses/actions/loans";
import { approveAttendanceCorrectionAction } from "@/modules/timekeeping/actions/checkins";
import { reviewOvertimeRequestAction, reviewShiftRequestAction } from "@/modules/timekeeping/actions/shift-requests";
import { reviewEmploymentEventAction } from "@/modules/core-hr/actions/employees";

export type RequestKind = "LEAVE" | "EXPENSE" | "LOAN" | "ADVANCE" | "EMPLOYMENT_EVENT" | "ATTENDANCE" | "OVERTIME" | "SHIFT";
export function PendingRequestActions({ kind, id, status }: { kind: RequestKind; id: string; status: string }) {
  const router = useRouter(); const [busy, startTransition] = useTransition(); const [error, setError] = useState<string | null>(null);
  function perform(approve: boolean) { setError(null); startTransition(async () => { try {
    if (kind === "LEAVE") await decideLeaveApplicationAction({ applicationId: id, decision: approve ? "APPROVE" : "REJECT" });
    if (kind === "EXPENSE") await reviewExpenseClaimAction({ claimId: id, approve });
    if (kind === "LOAN") await reviewEmployeeLoanAction({ loanId: id, approve });
    if (kind === "ADVANCE") await reviewEmployeeAdvanceAction({ advanceId: id, approve });
    if (kind === "EMPLOYMENT_EVENT") await reviewEmploymentEventAction({ eventId: id, approve });
    if (kind === "ATTENDANCE") await approveAttendanceCorrectionAction({ id, approve });
    if (kind === "OVERTIME") await reviewOvertimeRequestAction({ requestId: id, approve });
    if (kind === "SHIFT") await reviewShiftRequestAction({ requestId: id, approve });
    router.refresh();
  } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update request."); } }); }
  function release() { setError(null); startTransition(async () => { try { await releaseEmployeeLoanAction(id); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not release loan."); } }); }
  function releaseAdvance() { setError(null); startTransition(async () => { try { await releaseEmployeeAdvanceAction(id); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not release advance."); } }); }
  return <div className="flex flex-wrap items-center gap-2">{status === "APPROVED" && kind === "LOAN" ? <button disabled={busy} onClick={release} className="h-8 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white">Release loan</button> : status === "APPROVED" && kind === "ADVANCE" ? <button disabled={busy} onClick={releaseAdvance} className="h-8 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white">Release advance</button> : <><button disabled={busy} onClick={() => perform(false)} className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600">Reject</button><button disabled={busy} onClick={() => perform(true)} className="h-8 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white">Approve</button></>}{error && <span role="alert" className="basis-full text-xs text-rose-700">{error}</span>}</div>;
}

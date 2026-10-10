"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markLeaveEncashmentPaidAction, reviewLeaveBenefitAction } from "@/modules/leave/actions/leave-benefits";

export function LeaveBenefitReviewActions({ id, kind, status, paid }: { id: string; kind: "ENCASHMENT" | "COMPENSATORY"; status: string; paid?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function decide(decision: "APPROVE" | "REJECT") {
    setError("");
    startTransition(async () => {
      try { await reviewLeaveBenefitAction({ requestId: id, kind, decision }); router.refresh(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Could not review request."); }
    });
  }
  if (kind === "ENCASHMENT" && status === "APPROVED" && !paid) return <div><button disabled={pending} onClick={() => startTransition(async () => { try { await markLeaveEncashmentPaidAction(id); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not record payment."); } })} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Mark paid</button>{error && <p role="alert" className="mt-1 text-xs text-rose-700">{error}</p>}</div>;
  if (status !== "PENDING") return <span className="text-xs text-slate-500">No action</span>;
  return <div><div className="flex gap-2"><button disabled={pending} onClick={() => decide("APPROVE")} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white">Approve</button><button disabled={pending} onClick={() => decide("REJECT")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Reject</button></div>{error && <p role="alert" className="mt-1 text-xs text-rose-700">{error}</p>}</div>;
}

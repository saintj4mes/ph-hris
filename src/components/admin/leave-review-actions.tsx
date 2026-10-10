"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { decideLeaveApplicationAction } from "@/modules/leave/actions/applications";

export function LeaveReviewActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function decide(decision: "APPROVE" | "REJECT") {
    setPending(true);
    setMessage("");
    try { await decideLeaveApplicationAction({ applicationId, decision }); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not review this request."); }
    finally { setPending(false); }
  }
  return <div className="flex flex-wrap items-center gap-2"><button disabled={pending} onClick={() => decide("APPROVE")} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Approve</button><button disabled={pending} onClick={() => decide("REJECT")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">Reject</button>{message && <span role="alert" className="text-[11px] text-rose-600">{message}</span>}</div>;
}

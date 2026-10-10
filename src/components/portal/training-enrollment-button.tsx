"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enrollMyselfInTrainingAction } from "@/modules/performance/actions/cycles";

export function TrainingEnrollmentButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return <div className="flex items-center gap-2"><button disabled={pending} onClick={() => startTransition(async () => { try { await enrollMyselfInTrainingAction(eventId); setMessage("Enrolled"); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not enroll."); } })} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending ? "Enrolling…" : "Enroll"}</button>{message && <span role="status" className="text-xs text-slate-500">{message}</span>}</div>;
}

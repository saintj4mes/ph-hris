"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordSelfCheckinAction } from "@/modules/timekeeping/actions/checkins";
import { Button } from "@/components/ui/button";

export function SelfCheckinControl({ lastLogType, lastEventAt }: { lastLogType: "IN" | "OUT" | "UNKNOWN" | null; lastEventAt: string | null }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [message, setMessage] = useState("");
  const nextType = lastLogType === "IN" ? "OUT" : "IN";
  async function submit() {
    setPending(true); setMessage("");
    try {
      let coords: { latitude?: number; longitude?: number } = {};
      if (navigator.geolocation) {
        try { const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 60_000 })); coords = { latitude: position.coords.latitude, longitude: position.coords.longitude }; } catch { /* Check-in remains available when location access is denied. */ }
      }
      const result = await recordSelfCheckinAction({ logType: nextType, ...coords });
      setMessage(`${nextType === "IN" ? "Clocked in" : "Clocked out"} at ${result.eventAt.toLocaleTimeString("en-PH", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" })}.`);
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Check-in could not be recorded."); }
    finally { setPending(false); }
  }
  return <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-300">Today’s attendance</p><p className="mt-2 text-sm text-slate-300">{lastLogType === "IN" ? "You are currently clocked in." : lastLogType === "OUT" ? "You are currently clocked out." : "No check-in recorded today."}</p>{lastEventAt && <p className="mt-1 text-xs text-slate-400">Last event {new Date(lastEventAt).toLocaleTimeString("en-PH", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" })}</p>}<Button onClick={submit} disabled={pending} className="mt-4 w-full bg-teal-400 text-slate-950 hover:bg-teal-300">{pending ? "Recording…" : `Clock ${nextType}`}</Button>{message && <p role="status" className="mt-2 text-xs text-teal-100">{message}</p>}</div>;
}

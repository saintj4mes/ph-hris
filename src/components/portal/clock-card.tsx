"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Clock3, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ClockState = { direction: "IN" | "OUT"; timestamp: string } | null;

function currentDateTime(): { time: string; date: string } {
  const now = new Date();
  return {
    time: new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }).format(now),
    date: new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", day: "numeric", month: "short", year: "numeric" }).format(now),
  };
}

export function ClockCard() {
  const [clockState, setClockState] = useState<ClockState>(null);
  const [confirming, setConfirming] = useState(false);
  const [pendingTime, setPendingTime] = useState<{ time: string; date: string } | null>(null);
  const nextDirection = clockState?.direction === "IN" ? "OUT" : "IN";
  const clockedIn = clockState?.direction === "IN";

  function handleClock() {
    setPendingTime(currentDateTime());
    setConfirming(true);
  }

  function confirmClock() {
    if (!pendingTime) return;
    setClockState({ direction: nextDirection, timestamp: pendingTime.time });
    setConfirming(false);
    setPendingTime(null);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:px-6 sm:py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-700">Time clock</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Good morning, Maria</h2><p className="mt-1 text-sm text-slate-500">Keep your attendance up to date.</p></div><div className="hidden size-11 place-items-center rounded-full bg-teal-50 text-teal-700 sm:grid"><Clock3 className="size-5" /></div></div>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-full ${clockedIn ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{clockedIn ? <Check className="size-5" /> : <Clock3 className="size-5" />}</span><div><p className="text-sm font-semibold text-slate-800">{clockState ? `Last clock ${clockState.direction === "IN" ? "in" : "out"} at ${clockState.timestamp}` : "No clock event recorded today"}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="size-3.5" />Makati Office · simulated location</p>{clockState && <a href="/portal/attendance" className="mt-1 inline-block text-xs font-medium text-teal-700 underline underline-offset-2">View check-in list</a>}</div></div>
        <Button onClick={handleClock} className={nextDirection === "OUT" ? "bg-slate-900 hover:bg-slate-800" : "bg-teal-700 hover:bg-teal-800"}>{nextDirection === "IN" ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}Clock {nextDirection}</Button>
      </div>
      <div className="bg-amber-50/70 px-5 py-2.5 text-[11px] text-amber-800 sm:px-6">Demo clock only — events are not saved to an attendance record.</div>
      {confirming && pendingTime && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4"><section role="dialog" aria-modal="true" aria-labelledby="clock-confirm-title" className="relative w-full max-w-sm rounded-t-2xl bg-white p-6 text-center shadow-2xl sm:rounded-2xl"><button onClick={() => setConfirming(false)} className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close clock confirmation"><X className="size-4" /></button><div className="mx-auto grid size-12 place-items-center rounded-full bg-teal-50 text-teal-700"><Clock3 className="size-5" /></div><p id="clock-confirm-title" className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Confirm {nextDirection === "IN" ? "check-in" : "check-out"}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{pendingTime.time}</p><p className="mt-1 text-sm text-slate-500">{pendingTime.date}</p><p className="mt-4 flex items-center justify-center gap-1 text-xs text-slate-500"><MapPin className="size-3.5" />Makati Office · simulated location</p><div className="mt-6 grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setConfirming(false)}>Cancel</Button><Button onClick={confirmClock} className="bg-teal-700 hover:bg-teal-800">Confirm {nextDirection}</Button></div></section></div>}
    </section>
  );
}

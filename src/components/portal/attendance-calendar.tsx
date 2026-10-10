"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
const colors: Record<string, string> = {
  Present: "bg-emerald-200",
  "Work From Home": "bg-emerald-200",
  "Half Day": "bg-amber-200",
  Absent: "bg-rose-200",
  "On Leave": "bg-blue-200",
  Holiday: "bg-slate-200",
};

export function AttendanceCalendar({ events }: { events: Record<string, string> }) {
  const [month, setMonth] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1); });
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset = new Date(year, monthIndex, 1).getDay();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const monthName = new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric", timeZone: "Asia/Manila" }).format(month);
  const eventsForMonth = Object.entries(events).filter(([date]) => date.startsWith(`${year}-${String(monthIndex + 1).padStart(2, "0")}-`));
  const counts = eventsForMonth.reduce<Record<string, number>>((summary, [, status]) => { summary[status] = (summary[status] ?? 0) + 1; return summary; }, {});

  function moveMonth(amount: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  return <section className="w-full"><h2 className="mb-3 text-lg font-semibold text-slate-900">Attendance Calendar</h2><div className="rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-sm"><div className="flex items-center justify-between"><button onClick={() => moveMonth(-1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Previous month"><ChevronLeft className="size-4" /></button><h3 className="text-base font-semibold text-slate-800">{monthName}</h3><button onClick={() => moveMonth(1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Next month"><ChevronRight className="size-4" /></button></div><div className="mt-4 grid grid-cols-7 gap-y-2 text-center">{weekdays.map((day, index) => <div key={`${day}-${index}`} className="pb-1 text-xs font-semibold text-slate-500">{day}</div>)}{Array.from({ length: offset }, (_, index) => <span key={`offset-${index}`} />)}{Array.from({ length: days }, (_, index) => { const day = index + 1; const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; const status = events[date]; return <div key={date} title={status ?? "No attendance recorded"} className="grid place-items-center"><span className={`grid size-8 place-items-center rounded-full text-xs font-medium text-slate-800 ${status ? colors[status] : ""} ${date === new Date().toISOString().slice(0,10) ? "ring-2 ring-teal-600 ring-offset-1" : ""}`}>{day}</span></div>; })}</div><div className="my-4 border-t border-slate-100" /><div className="grid grid-cols-4 gap-2">{["Present", "Half Day", "Absent", "On Leave"].map((status) => <div key={status} className="text-center"><span className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500"><span className={`size-2.5 rounded-full ${colors[status]}`} />{status}</span><span className="mt-1 block text-sm font-semibold text-slate-800">{counts[status] ?? 0}</span></div>)}</div></div></section>;
}

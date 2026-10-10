"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setMyPerformanceGoalAction, submitSelfAppraisalAction } from "@/modules/performance/actions/cycles";

type Cycle = { id: string; name: string };

export function PerformanceSelfService({ cycles, submittedCycleIds }: { cycles: Cycle[]; submittedCycleIds: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function run(action: () => Promise<unknown>, success: string) {
    setMessage("");
    startTransition(async () => {
      try { await action(); setMessage(success); router.refresh(); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Could not save your response."); }
    });
  }
  return <div className="grid gap-5 xl:grid-cols-2">
    <form className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); run(() => setMyPerformanceGoalAction({ title: String(form.get("title")), description: String(form.get("description")), measure: String(form.get("measure")), targetValue: String(form.get("targetValue")) || undefined, dueDate: String(form.get("dueDate")) || undefined, cycleId: String(form.get("cycleId")) || undefined }), "Goal saved."); event.currentTarget.reset(); }}>
      <div><h2 className="text-sm font-semibold">Add a performance goal</h2><p className="mt-1 text-xs text-slate-500">Set a measurable target for your next review.</p></div>
      <input required name="title" placeholder="Goal title" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
      <textarea name="description" placeholder="What do you plan to achieve?" rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      <div className="grid gap-3 sm:grid-cols-2"><input name="measure" placeholder="Measure (e.g. response time)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><input name="targetValue" type="number" step="0.01" placeholder="Target value" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /></div>
      <div className="grid gap-3 sm:grid-cols-2"><input name="dueDate" type="date" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><select name="cycleId" defaultValue="" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">No review cycle</option>{cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}</select></div>
      <button disabled={pending} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save goal</button>
    </form>
    <form className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); run(() => submitSelfAppraisalAction({ cycleId: String(form.get("cycleId")), selfRating: String(form.get("selfRating")), employeeNotes: String(form.get("employeeNotes")) }), "Self-assessment submitted."); }}>
      <div><h2 className="text-sm font-semibold">Submit a self-assessment</h2><p className="mt-1 text-xs text-slate-500">Rate your progress and share notes with your manager.</p></div>
      <select required name="cycleId" defaultValue="" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Select an open review cycle</option>{cycles.filter((cycle) => !submittedCycleIds.includes(cycle.id)).map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}</select>
      <label className="block text-xs font-medium text-slate-600">Self rating (1 to 5)<input required name="selfRating" type="number" min="1" max="5" step="0.5" defaultValue="3" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
      <textarea name="employeeNotes" placeholder="Achievements, challenges, and support needed" rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      <button disabled={pending || cycles.every((cycle) => submittedCycleIds.includes(cycle.id))} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Submit review</button>
    </form>
    {message && <p role="status" className="text-xs text-slate-600 xl:col-span-2">{message}</p>}
  </div>;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJobOpeningAction } from "@/modules/recruitment/actions/pipeline";
import { Button } from "@/components/ui/button";

export function JobOpeningForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  return <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><summary className="cursor-pointer text-sm font-semibold">Create job opening</summary><form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={async (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); setMessage("");
    try { await createJobOpeningAction({ companyId, title: String(form.get("title")), description: String(form.get("description")), location: String(form.get("location") || ""), employmentType: String(form.get("employmentType")) as "REGULAR" | "PROBATIONARY" | "FIXED_TERM" | "CASUAL" | "PART_TIME", opensOn: String(form.get("opensOn")), closesOn: String(form.get("closesOn") || ""), salaryRangeMin: String(form.get("salaryRangeMin") || ""), salaryRangeMax: String(form.get("salaryRangeMax") || "") }); setMessage("Job opening published."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not create the opening."); }
  }}><input name="title" required placeholder="Job title" className="form-input" /><input name="location" placeholder="Location" className="form-input" /><textarea name="description" required minLength={20} rows={4} placeholder="Job description and qualifications" className="form-input sm:col-span-2" /><select name="employmentType" className="form-input"><option value="REGULAR">Regular</option><option value="PROBATIONARY">Probationary</option><option value="FIXED_TERM">Fixed term</option><option value="PART_TIME">Part time</option></select><input name="opensOn" type="date" required className="form-input" /><input name="closesOn" type="date" className="form-input" /><input name="salaryRangeMin" type="text" inputMode="decimal" placeholder="Salary range minimum" className="form-input" /><input name="salaryRangeMax" type="text" inputMode="decimal" placeholder="Salary range maximum" className="form-input" /><div className="flex items-center gap-3 sm:col-span-2"><Button type="submit">Publish opening</Button>{message && <span role="status" className="text-xs text-slate-600">{message}</span>}</div></form><style jsx>{`.form-input { min-width: 0; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 13px; outline: none; } .form-input:focus { border-color: #0f766e; }`}</style></details>;
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { assignEmployeeBenefitAction, recordEmployeeSkillAction, saveEmergencyContactAction, saveEmployeeAddressAction } from "@/modules/core-hr/actions/employee-services";

type Contact = { name: string; relationship: string; phone: string; email: string };
type Address = { label: string; line1: string; line2: string; barangay: string; city: string; province: string; postalCode: string };

export function EmployeeRecordsForm({ employeeId, address, emergencyContact }: { employeeId: string; address: Address | null; emergencyContact: Contact | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>, action: (form: FormData) => Promise<unknown>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setMessage("");
    startTransition(async () => {
      try { await action(form); setMessage("Saved."); router.refresh(); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Could not save this employee record."); }
    });
  }
  const value = (form: FormData, key: string) => String(form.get(key) ?? "");
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="text-sm font-semibold">Contact & employee records</h2>
    <p className="mt-1 text-xs text-slate-500">Address updates preserve the previous address with its effective dates.</p>
    <div className="mt-4 grid gap-5 xl:grid-cols-2">
      <form className="grid gap-2 sm:grid-cols-2" onSubmit={(event) => submit(event, (form) => saveEmployeeAddressAction({ employeeId, label: value(form, "label"), line1: value(form, "line1"), line2: value(form, "line2"), barangay: value(form, "barangay"), city: value(form, "city"), province: value(form, "province"), postalCode: value(form, "postalCode") }))}>
        <h3 className="text-xs font-semibold sm:col-span-2">Primary address</h3>
        <input name="label" defaultValue={address?.label ?? "HOME"} placeholder="Label" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input required name="line1" defaultValue={address?.line1 ?? ""} placeholder="House / street" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input name="line2" defaultValue={address?.line2 ?? ""} placeholder="Unit / subdivision" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input name="barangay" defaultValue={address?.barangay ?? ""} placeholder="Barangay" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input required name="city" defaultValue={address?.city ?? ""} placeholder="City / municipality" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input required name="province" defaultValue={address?.province ?? ""} placeholder="Province" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input name="postalCode" defaultValue={address?.postalCode ?? ""} placeholder="Postal code" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <button disabled={pending} className="h-9 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white disabled:opacity-50">Save address</button>
      </form>
      <form className="grid gap-2 sm:grid-cols-2" onSubmit={(event) => submit(event, (form) => saveEmergencyContactAction({ employeeId, name: value(form, "name"), relationship: value(form, "relationship"), phone: value(form, "phone"), email: value(form, "email") }))}>
        <h3 className="text-xs font-semibold sm:col-span-2">Primary emergency contact</h3>
        <input required name="name" defaultValue={emergencyContact?.name ?? ""} placeholder="Contact name" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input required name="relationship" defaultValue={emergencyContact?.relationship ?? ""} placeholder="Relationship" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input required name="phone" defaultValue={emergencyContact?.phone ?? ""} placeholder="Phone" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input name="email" type="email" defaultValue={emergencyContact?.email ?? ""} placeholder="Email (optional)" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <button disabled={pending} className="h-9 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white disabled:opacity-50">Save contact</button>
      </form>
      <form className="grid gap-2 sm:grid-cols-2" onSubmit={(event) => submit(event, (form) => assignEmployeeBenefitAction({ employeeId, benefitType: value(form, "benefitType"), provider: value(form, "provider"), coverage: value(form, "coverage"), amount: value(form, "amount"), taxable: form.get("taxable") === "on", effectiveFrom: value(form, "effectiveFrom"), effectiveTo: value(form, "effectiveTo") || undefined }))}>
        <h3 className="text-xs font-semibold sm:col-span-2">Assign benefit</h3>
        <input required name="benefitType" placeholder="Benefit (e.g. HMO)" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input name="provider" placeholder="Provider" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input name="coverage" placeholder="Coverage details" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input name="amount" type="number" min="0" step="0.01" placeholder="PHP amount" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input required name="effectiveFrom" type="date" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input name="effectiveTo" type="date" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <label className="flex items-center gap-2 text-xs"><input name="taxable" type="checkbox" className="accent-teal-700" />Taxable benefit</label>
        <button disabled={pending} className="h-9 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white disabled:opacity-50">Assign benefit</button>
      </form>
      <form className="grid gap-2 sm:grid-cols-2" onSubmit={(event) => submit(event, (form) => recordEmployeeSkillAction({ employeeId, skill: value(form, "skill"), proficiency: value(form, "proficiency"), notes: value(form, "notes"), assessedAt: value(form, "assessedAt") || undefined, expiresAt: value(form, "expiresAt") || undefined }))}>
        <h3 className="text-xs font-semibold sm:col-span-2">Add or update skill</h3>
        <input required name="skill" placeholder="Skill" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input name="proficiency" placeholder="Proficiency" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input name="assessedAt" type="date" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input name="expiresAt" type="date" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />
        <input name="notes" placeholder="Assessment notes" className="h-9 rounded-lg border border-slate-200 px-3 text-xs sm:col-span-2" />
        <button disabled={pending} className="h-9 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white disabled:opacity-50">Save skill</button>
      </form>
    </div>
    {message && <p role="status" className="mt-4 text-xs text-slate-600">{message}</p>}
  </section>;
}

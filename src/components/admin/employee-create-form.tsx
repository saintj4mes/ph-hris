"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEmployeeAction } from "@/modules/core-hr/actions/employees";
import { Button } from "@/components/ui/button";

type Choice = { id: string; name: string };

export function EmployeeCreateForm({ companies, departments, designations }: { companies: Choice[]; departments: Choice[]; designations: Choice[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Add an employee</h2><p className="mt-1 text-xs text-slate-500">Create an employee record with PH statutory identifiers.</p></div><Button type="button" onClick={() => setOpen((value) => !value)}>{open ? "Close form" : "New employee"}</Button></div>
    {open && <form action={async (form) => {
      setMessage("");
      try {
        await createEmployeeAction({
          employeeNumber: String(form.get("employeeNumber")), firstName: String(form.get("firstName")), middleName: String(form.get("middleName") || ""), lastName: String(form.get("lastName")),
          email: String(form.get("email") || ""), dateHired: String(form.get("dateHired")), employmentType: String(form.get("employmentType")) as "REGULAR" | "PROBATIONARY" | "FIXED_TERM" | "CASUAL" | "PART_TIME",
          workerClass: String(form.get("workerClass")) as "RANK_AND_FILE" | "MANAGERIAL" | "SUPERVISORY", companyId: String(form.get("companyId")), departmentId: String(form.get("departmentId") || ""), designationId: String(form.get("designationId") || ""),
          isMinimumWageEarner: form.get("isMinimumWageEarner") === "on",
          tin: String(form.get("tin") || ""), sssNumber: String(form.get("sssNumber") || ""), philHealthNumber: String(form.get("philHealthNumber") || ""), pagIbigNumber: String(form.get("pagIbigNumber") || ""),
        });
        setMessage("Employee created.");
        router.refresh();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create the employee."); }
    }} className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <input required name="employeeNumber" placeholder="Employee code" className="input" />
      <input required name="firstName" placeholder="First name" className="input" />
      <input name="middleName" placeholder="Middle name" className="input" />
      <input required name="lastName" placeholder="Last name" className="input" />
      <input name="email" type="email" placeholder="Work email" className="input" />
      <input required name="dateHired" type="date" className="input" />
      <select name="employmentType" className="input"><option value="REGULAR">Regular</option><option value="PROBATIONARY">Probationary</option><option value="FIXED_TERM">Fixed term</option><option value="CASUAL">Casual</option><option value="PART_TIME">Part time</option></select>
      <select name="workerClass" className="input"><option value="RANK_AND_FILE">Rank and file</option><option value="SUPERVISORY">Supervisory</option><option value="MANAGERIAL">Managerial</option></select>
      <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs text-slate-700"><input name="isMinimumWageEarner" type="checkbox" className="accent-teal-700" />Minimum wage earner</label>
      <select required name="companyId" className="input"><option value="">Select company</option>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select name="departmentId" className="input"><option value="">No department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select name="designationId" className="input"><option value="">No designation</option>{designations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <input name="tin" placeholder="TIN" className="input" /><input name="sssNumber" placeholder="SSS number" className="input" /><input name="philHealthNumber" placeholder="PhilHealth number" className="input" /><input name="pagIbigNumber" placeholder="Pag-IBIG number" className="input" />
      <div className="flex items-center gap-3 sm:col-span-2 xl:col-span-4"><Button type="submit">Create employee</Button>{message && <p role="status" className="text-xs text-slate-600">{message}</p>}</div>
    </form>}
    <style jsx>{`.input { min-width: 0; height: 40px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; padding: 0 12px; font-size: 13px; outline: none; } .input:focus { border-color: #0f766e; box-shadow: 0 0 0 2px rgb(13 148 136 / 12%); }`}</style>
  </section>;
}

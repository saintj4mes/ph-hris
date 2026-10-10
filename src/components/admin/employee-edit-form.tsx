"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateEmployeeProfileAction } from "@/modules/core-hr/actions/employees";

type EmployeeValues = {
  employeeId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  mobilePhone: string;
  workLocation: string;
  departmentId: string;
  designationId: string;
  reportsToId: string;
  dateOfBirth: string;
  gender: string;
  civilStatus: string;
};
type Option = { id: string; name: string };

export function EmployeeEditForm({ employee, departments, designations, managers }: { employee: EmployeeValues; departments: Option[]; designations: Option[]; managers: Option[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <summary className="cursor-pointer text-sm font-semibold">Edit employee profile</summary>
    <form className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" onSubmit={(event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget); setMessage("");
      const value = (name: string) => String(form.get(name) ?? "");
      startTransition(async () => {
        try {
          await updateEmployeeProfileAction({ employeeId: employee.employeeId, firstName: value("firstName"), middleName: value("middleName"), lastName: value("lastName"), suffix: value("suffix"), email: value("email"), mobilePhone: value("mobilePhone"), workLocation: value("workLocation"), departmentId: value("departmentId"), designationId: value("designationId"), reportsToId: value("reportsToId"), dateOfBirth: value("dateOfBirth"), gender: value("gender"), civilStatus: value("civilStatus") });
          setMessage("Profile saved."); router.refresh();
        } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update employee profile."); }
      });
    }}>
      <input required name="firstName" defaultValue={employee.firstName} placeholder="First name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
      <input name="middleName" defaultValue={employee.middleName} placeholder="Middle name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
      <input required name="lastName" defaultValue={employee.lastName} placeholder="Last name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
      <input name="suffix" defaultValue={employee.suffix} placeholder="Suffix" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
      <input name="email" type="email" defaultValue={employee.email} placeholder="Work email" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
      <input name="mobilePhone" defaultValue={employee.mobilePhone} placeholder="Mobile phone" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
      <input name="workLocation" defaultValue={employee.workLocation} placeholder="Work location" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
      <select name="departmentId" defaultValue={employee.departmentId} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">No department</option>{departments.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select>
      <select name="designationId" defaultValue={employee.designationId} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">No designation</option>{designations.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select>
      <select name="reportsToId" defaultValue={employee.reportsToId} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">No manager</option>{managers.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select>
      <label className="text-xs text-slate-500">Date of birth<input name="dateOfBirth" type="date" defaultValue={employee.dateOfBirth} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800" /></label>
      <select name="gender" defaultValue={employee.gender} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Gender (optional)</option>{["FEMALE", "MALE", "NON_BINARY", "UNDISCLOSED"].map((option) => <option key={option}>{option}</option>)}</select>
      <select name="civilStatus" defaultValue={employee.civilStatus} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Civil status (optional)</option>{["SINGLE", "MARRIED", "WIDOWED", "SEPARATED", "UNDISCLOSED"].map((option) => <option key={option}>{option}</option>)}</select>
      <div className="flex items-center gap-3 sm:col-span-2 xl:col-span-3"><button disabled={pending} className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : "Save profile"}</button>{message && <span role="status" className="text-xs text-slate-600">{message}</span>}</div>
    </form>
  </details>;
}

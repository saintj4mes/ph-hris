"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inviteUserAction } from "@/modules/core-hr/actions/access";

type Option = { id: string; label: string };
export function UserInviteForm({ roles, employees }: { roles: Option[]; employees: Array<{ id: string; employeeNumber: string; firstName: string; lastName: string }> }) {
  const router = useRouter(); const [busy, startTransition] = useTransition(); const [message, setMessage] = useState<string | null>(null);
  return <form action={(data) => { setMessage(null); startTransition(async () => { try { await inviteUserAction({ email: String(data.get("email")), displayName: String(data.get("displayName")), temporaryPassword: String(data.get("password")), roleId: String(data.get("roleId")), employeeId: String(data.get("employeeId") || "") }); setMessage("User account created."); router.refresh(); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not create account."); } }); }} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
    <label className="text-xs font-medium text-slate-600">Name<input required name="displayName" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label><label className="text-xs font-medium text-slate-600">Email<input required name="email" type="email" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
    <label className="text-xs font-medium text-slate-600">Temporary password<input required name="password" type="password" minLength={12} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label><label className="text-xs font-medium text-slate-600">Role<select required name="roleId" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">{roles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select></label>
    <label className="text-xs font-medium text-slate-600 sm:col-span-2">Link employee record<select name="employeeId" defaultValue="" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"><option value="">No employee link</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.employeeNumber} · {employee.firstName} {employee.lastName}</option>)}</select></label>
    {message && <p role="status" className="text-xs text-slate-700 sm:col-span-2">{message}</p>}<button disabled={busy} className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">{busy ? "Creating…" : "Create user account"}</button>
  </form>;
}

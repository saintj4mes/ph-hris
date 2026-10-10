import Link from "next/link";
import { ArrowUpRight, UsersRound } from "lucide-react";
import { EmployeeCreateForm } from "@/components/admin/employee-create-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  await requirePermission("employee", "read");
  const [employees, companies, departments, designations] = await Promise.all([
    prisma.employee.findMany({ include: { department: true, designation: true }, orderBy: [{ status: "asc" }, { lastName: "asc" }] }),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.designation.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);
  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">People directory</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[30px]">Employees</h1><p className="mt-1.5 text-sm text-slate-500">Employee master data and employment status.</p></div><div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3"><UsersRound className="size-5 text-teal-700" /><div><p className="text-xl font-semibold">{employees.length}</p><p className="text-[11px] text-slate-500">Employee records</p></div></div></div>
    <EmployeeCreateForm companies={companies} departments={departments} designations={designations.map(({ id, title }) => ({ id, name: title }))} />
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-sm font-semibold">All employees</h2><p className="mt-1 text-xs text-slate-500">Records stored in the HRIS employee master.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Employee code</th><th className="px-4 py-3">Full name</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Designation</th><th className="px-4 py-3">Status</th><th className="px-5 py-3">Profile</th></tr></thead><tbody className="divide-y divide-slate-100">{employees.map((employee) => <tr key={employee.id}><td className="px-5 py-4 font-semibold text-slate-800">{employee.employeeNumber}</td><td className="px-4 py-4"><span className="font-medium text-slate-800">{[employee.firstName, employee.middleName, employee.lastName, employee.suffix].filter(Boolean).join(" ")}</span><span className="mt-0.5 block text-xs text-slate-500">{employee.email ?? "No work email"}</span></td><td className="px-4 py-4 text-slate-600">{employee.department?.name ?? "—"}</td><td className="px-4 py-4 text-slate-600">{employee.designation?.title ?? "—"}</td><td className="px-4 py-4"><StatusBadge tone={employee.status === "ACTIVE" ? "success" : employee.status === "ON_LEAVE" ? "warning" : "neutral"}>{employee.status.replaceAll("_", " ")}</StatusBadge></td><td className="px-5 py-4"><Link href={`/employees/${employee.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900">View profile <ArrowUpRight className="size-3.5" /></Link></td></tr>)}</tbody></table></div>{employees.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No employee records yet.</p>}</section>
  </div>;
}

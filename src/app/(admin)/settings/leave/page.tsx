import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";
import { LeaveSetupForms } from "@/components/admin/leave-setup-forms";

export const dynamic = "force-dynamic";
export default async function LeaveSettingsPage({ searchParams }: { searchParams: Promise<{ companyId?: string }> }) {
  await requirePermission("leave_type", "create");
  const query = await searchParams;
  const companies = await prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  const company = companies.find((item) => item.id === query.companyId) ?? companies[0];
  const [employees, leaveTypes, leavePeriods, leavePolicies] = company ? await Promise.all([
    prisma.employee.findMany({ where: { companyId: company.id, status: { not: "SEPARATED" } }, select: { id: true, employeeNumber: true, firstName: true, lastName: true }, orderBy: { lastName: "asc" } }),
    prisma.leaveType.findMany({ where: { companyId: company.id, active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.leavePeriod.findMany({ where: { companyId: company.id }, select: { id: true, name: true }, orderBy: { startsOn: "desc" } }),
    prisma.leavePolicy.findMany({ where: { companyId: company.id, active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]) : [[], [], [], []];
  return <div className="space-y-5"><Link href="/leaves" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><ArrowLeft className="size-4" />Leave requests</Link><div className="flex items-center gap-3"><CalendarDays className="size-6 text-teal-700" /><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Leave administration</p><h1 className="mt-1 text-2xl font-semibold">Types, periods & balances</h1></div></div>{companies.length > 1 && <nav className="flex flex-wrap gap-2">{companies.map((item) => <Link key={item.id} href={`/settings/leave?companyId=${item.id}`} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${item.id === company?.id ? "border-teal-700 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-600"}`}>{item.name}</Link>)}</nav>}{company ? <><p className="text-sm text-slate-500">Configure {company.name}. Leave balances are recorded as ledger entries and policy accruals are idempotent.</p><LeaveSetupForms companyId={company.id} employees={employees.map(({ id, employeeNumber, firstName, lastName }) => ({ id, employeeNumber, name: `${firstName} ${lastName}` }))} types={leaveTypes} periods={leavePeriods} policies={leavePolicies} /></> : <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Create a company first.</p>}</div>;
}

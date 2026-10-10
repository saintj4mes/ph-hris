import Link from "next/link";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";
import { PayrollPolicyForm } from "@/components/admin/payroll-policy-form";

export const dynamic = "force-dynamic";
export default async function PayrollSettingsPage({ searchParams }: { searchParams: Promise<{ companyId?: string }> }) {
  await requirePermission("payroll_configuration", "manage");
  const query = await searchParams;
  const rows = await prisma.company.findMany({ include: { payrollPolicy: { include: { contributionAllocations: { orderBy: { effectiveFrom: "desc" } } } } }, orderBy: { name: "asc" } });
  const companies = rows.map((company) => ({ id: company.id, name: company.name, payrollPolicy: company.payrollPolicy ? { monthlyToDailyDivisor: company.payrollPolicy.monthlyToDailyDivisor.toString(), scheduledHoursPerDay: company.payrollPolicy.scheduledHoursPerDay.toString(), firstCutoffStartDay: company.payrollPolicy.firstCutoffStartDay, firstCutoffEndDay: company.payrollPolicy.firstCutoffEndDay, secondCutoffStartDay: company.payrollPolicy.secondCutoffStartDay, secondCutoffEndDay: company.payrollPolicy.secondCutoffEndDay, dailyProrationBasis: company.payrollPolicy.dailyProrationBasis, allocations: company.payrollPolicy.contributionAllocations.map(({ agency, contributionProgram, mode, exactFirstCutoffAmount }) => ({ agency, contributionProgram, mode, exactFirstCutoffAmount: exactFirstCutoffAmount?.toString() ?? null })) } : null }));
  return <div className="space-y-5"><Link href="/settings/company" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><ArrowLeft className="size-4" />Company setup</Link><div className="flex items-center gap-3"><SlidersHorizontal className="size-6 text-teal-700" /><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Payroll configuration</p><h1 className="mt-1 text-2xl font-semibold">Cutoffs, rate conversion & deductions</h1></div></div><PayrollPolicyForm companies={companies} selected={query.companyId ?? ""} /></div>;
}

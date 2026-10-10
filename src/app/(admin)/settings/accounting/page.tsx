import Link from "next/link";
import { ArrowLeft, BookOpenCheck } from "lucide-react";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";
import { PayrollAccountingForms } from "@/components/admin/payroll-accounting-forms";

export const dynamic = "force-dynamic";
export default async function AccountingSettingsPage({ searchParams }: { searchParams: Promise<{ companyId?: string }> }) {
  await requirePermission("payroll_configuration", "manage");
  const query = await searchParams;
  const companies = await prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  const company = companies.find((item) => item.id === query.companyId) ?? companies[0];
  const [accountRows, rules] = company ? await Promise.all([
    prisma.journalAccount.findMany({ where: { companyId: company.id, active: true }, orderBy: { code: "asc" } }),
    prisma.payrollPostingRule.findMany({ where: { companyId: company.id }, orderBy: { lineCode: "asc" } }),
  ]) : [[], []];
  const accounts = accountRows.map(({ id, code, name, accountType }) => ({ id, code, name, accountType }));
  const postingRules = rules.map(({ lineCode, behavior, debitAccountId, creditAccountId }) => ({ lineCode, behavior, debitAccountId, creditAccountId }));
  return <div className="space-y-5"><Link href="/settings/company" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><ArrowLeft className="size-4" />Company setup</Link><div className="flex items-center gap-3"><BookOpenCheck className="size-6 text-teal-700" /><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Accounting touchpoint</p><h1 className="mt-1 text-2xl font-semibold">Payroll journal mappings</h1><p className="mt-1 text-sm text-slate-500">Configure the standalone ledger accounts and balanced journal rules.</p></div></div>{companies.length > 1 && <nav className="flex flex-wrap gap-2">{companies.map((item) => <Link key={item.id} href={`/settings/accounting?companyId=${item.id}`} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${item.id === company?.id ? "border-teal-700 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-600"}`}>{item.name}</Link>)}</nav>}{company ? <PayrollAccountingForms companyId={company.id} accounts={accounts} rules={postingRules} /> : <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Create a company first.</p>}</div>;
}

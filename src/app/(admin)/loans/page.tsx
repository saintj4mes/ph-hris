import { Banknote } from "lucide-react";
import { LoanOperations } from "@/components/admin/loan-operations";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function LoansPage() {
  await requirePermission("loan", "read");
  const [companies, products, repayments] = await Promise.all([
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.loanProduct.findMany({ where: { active: true }, include: { company: true }, orderBy: [{ company: { name: "asc" } }, { name: "asc" }] }),
    prisma.loanRepayment.findMany({ where: { loan: { status: "RELEASED" }, paidAt: null }, include: { loan: { include: { employee: true, loanProduct: true } } }, orderBy: [{ dueDate: "asc" }, { id: "asc" }], take: 150 }),
  ]);
  return <div className="space-y-6"><header className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-teal-50 text-teal-700"><Banknote className="size-6" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-700">Employee finance</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Loans & repayments</h1><p className="mt-1 text-sm text-slate-500">Configure products, monitor installments, and reconcile payroll deductions.</p></div></header><LoanOperations companies={companies} products={products.map((product) => ({ id: product.id, code: product.code, name: `${product.company.name} · ${product.name}`, interestRate: product.interestRate.toString(), maximumAmount: product.maximumAmount?.toString() ?? null }))} repayments={repayments.map((repayment) => ({ id: repayment.id, employee: `${repayment.loan.employee.firstName} ${repayment.loan.employee.lastName}`, product: repayment.loan.loanProduct.name, dueDate: repayment.dueDate.toISOString().slice(0, 10), amount: repayment.amount.toString(), paidAmount: repayment.paidAmount.toString(), assignedToPayroll: Boolean(repayment.salarySlipId) }))} /></div>;
}

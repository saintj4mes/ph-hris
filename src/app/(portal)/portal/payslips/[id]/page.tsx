import { notFound } from "next/navigation";
import { PayslipDetail } from "@/components/payroll/payslip-detail";
import type { SalarySlipRecord } from "@/modules/payroll/types/payslip";
import { Decimal } from "@/shared/lib/decimal";
import { prisma } from "@/shared/db/prisma";
import { requireUser } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function PortalPayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user.employeeId) notFound();
  const { id } = await params;
  const slip = await prisma.salarySlip.findFirst({ where: { id, employeeId: user.employeeId, status: { in: ["SUBMITTED", "PAID"] } }, include: { employee: { include: { department: true } }, payrollRun: true, details: true } });
  if (!slip) notFound();
  const prior = await prisma.salarySlip.findMany({ where: { employeeId: slip.employeeId, id: { not: slip.id }, status: { in: ["SUBMITTED", "PAID"] }, payrollRun: { periodEnd: { gte: new Date(Date.UTC(slip.payrollRun.periodEnd.getUTCFullYear(), 0, 1)), lt: slip.payrollRun.periodStart } } }, select: { taxableIncome: true } });
  const monthStart = new Date(Date.UTC(slip.payrollRun.periodEnd.getUTCFullYear(), slip.payrollRun.periodEnd.getUTCMonth(), 1));
  const month = await prisma.salarySlip.findMany({ where: { employeeId: slip.employeeId, status: { in: ["SUBMITTED", "PAID"] }, payrollRun: { periodEnd: { gte: monthStart, lte: slip.payrollRun.periodEnd } } }, select: { grossPay: true } });
  const metadata = slip.inputSnapshot as { daysWorked?: string; unpaidDays?: string };
  const sumKind = (kind: "EARNING" | "DEDUCTION" | "EMPLOYER_CONTRIBUTION" | "EMPLOYER_TAX") => slip.details.filter((detail) => detail.kind === kind).reduce((sum, detail) => sum.plus(detail.amount), new Decimal(0));
  const lines = (kind: "EARNING" | "DEDUCTION" | "EMPLOYER_CONTRIBUTION" | "EMPLOYER_TAX") => slip.details.filter((detail) => detail.kind === kind).map((detail) => ({ code: detail.code, label: detail.label, amount: detail.amount.toFixed(2) }));
  const record: SalarySlipRecord = {
    id: slip.id,
    employeeId: slip.employee.employeeNumber,
    employeeName: `${slip.employee.firstName} ${slip.employee.lastName}`,
    department: slip.employee.department?.name ?? "—",
    periodStart: slip.payrollRun.periodStart.toISOString().slice(0, 10),
    periodEnd: slip.payrollRun.periodEnd.toISOString().slice(0, 10),
    workingDays: metadata.daysWorked ?? "—",
    paidDays: metadata.daysWorked ?? "—",
    gross: slip.grossPay.toFixed(2),
    withholdingTax: slip.taxWithheld.toFixed(2),
    sss: "0.00",
    philHealth: "0.00",
    pagIbig: "0.00",
    netPay: slip.netPay.toFixed(2),
    yearToDate: prior.reduce((sum, priorSlip) => sum.plus(priorSlip.taxableIncome), new Decimal(slip.taxableIncome)).toFixed(2),
    monthToDate: month.reduce((sum, monthSlip) => sum.plus(monthSlip.grossPay), new Decimal(0)).toFixed(2),
    taxableIncome: slip.taxableIncome.toFixed(2),
    nonTaxableEarnings: slip.details.filter((detail) => detail.kind === "EARNING" && !detail.taxable).reduce((sum, detail) => sum.plus(detail.amount), new Decimal(0)).toFixed(2),
    status: "Posted",
    paymentDate: slip.payrollRun.payDate.toISOString().slice(0, 10),
    earnings: lines("EARNING"),
    deductions: lines("DEDUCTION"),
    employerContributions: [...lines("EMPLOYER_CONTRIBUTION"), ...lines("EMPLOYER_TAX")],
    totalEmployerContributions: sumKind("EMPLOYER_CONTRIBUTION").plus(sumKind("EMPLOYER_TAX")).toFixed(2),
  };
  return <PayslipDetail slip={record} backHref="/portal/payslips" />;
}

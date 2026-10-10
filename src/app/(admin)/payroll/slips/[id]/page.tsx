import { notFound } from "next/navigation";
import { PayslipDetail } from "@/components/payroll/payslip-detail";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";
import { Decimal } from "@/shared/lib/decimal";
import type { SalarySlipRecord } from "@/modules/payroll/types/payslip";

export const dynamic = "force-dynamic";

export default async function SalarySlipPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("payroll", "read");
  const { id } = await params;
  const slip = await prisma.salarySlip.findUnique({ where: { id }, include: { employee: { include: { department: true } }, payrollRun: { include: { company: true } }, details: true } });
  if (!slip) notFound();
  const priorSlips = await prisma.salarySlip.findMany({ where: { employeeId: slip.employeeId, id: { not: slip.id }, status: { in: ["SUBMITTED", "PAID"] }, payrollRun: { periodEnd: { gte: new Date(Date.UTC(slip.payrollRun.periodEnd.getUTCFullYear(), 0, 1)), lt: slip.payrollRun.periodStart } } }, select: { taxableIncome: true } });
  const monthStart = new Date(Date.UTC(slip.payrollRun.periodEnd.getUTCFullYear(), slip.payrollRun.periodEnd.getUTCMonth(), 1));
  const monthSlips = await prisma.salarySlip.findMany({ where: { employeeId: slip.employeeId, status: { in: ["SUBMITTED", "PAID"] }, payrollRun: { periodEnd: { gte: monthStart, lte: slip.payrollRun.periodEnd } } }, select: { grossPay: true } });
  const snapshot = slip.inputSnapshot as { daysWorked?: string; unpaidDays?: string; hoursWorked?: string };
  const total = (kind: string) => slip.details.filter((detail) => detail.kind === kind).reduce((sum, detail) => sum.plus(detail.amount), new Decimal(0)).toFixed(2);
  const agencyTotal = (agency: "SSS" | "PHILHEALTH" | "PAGIBIG") => slip.details.filter((detail) => detail.kind === "DEDUCTION" && detail.agency === agency).reduce((sum, detail) => sum.plus(detail.amount), new Decimal(0)).toFixed(2);
  const record: SalarySlipRecord = {
    id: slip.id,
    employeeId: slip.employee.employeeNumber,
    employeeName: `${slip.employee.firstName} ${slip.employee.lastName}`,
    department: slip.employee.department?.name ?? "—",
    periodStart: slip.payrollRun.periodStart.toISOString().slice(0, 10),
    periodEnd: slip.payrollRun.periodEnd.toISOString().slice(0, 10),
    workingDays: snapshot.daysWorked ?? "—",
    paidDays: snapshot.daysWorked ?? "—",
    gross: slip.grossPay.toFixed(2),
    withholdingTax: slip.taxWithheld.toFixed(2),
    sss: agencyTotal("SSS"),
    philHealth: agencyTotal("PHILHEALTH"),
    pagIbig: agencyTotal("PAGIBIG"),
    netPay: slip.netPay.toFixed(2),
    yearToDate: priorSlips.reduce((sum, row) => sum.plus(row.taxableIncome), new Decimal(slip.taxableIncome)).toFixed(2),
    monthToDate: monthSlips.reduce((sum, row) => sum.plus(row.grossPay), new Decimal(0)).toFixed(2),
    taxableIncome: slip.taxableIncome.toFixed(2),
    nonTaxableEarnings: slip.details.filter((detail) => detail.kind === "EARNING" && !detail.taxable).reduce((sum, detail) => sum.plus(detail.amount), new Decimal(0)).toFixed(2),
    status: slip.status === "SUBMITTED" || slip.status === "PAID" ? "Posted" : "Draft",
    paymentDate: slip.payrollRun.payDate.toISOString().slice(0, 10),
    totalEmployerContributions: total("EMPLOYER_CONTRIBUTION"),
    earnings: slip.details.filter((detail) => detail.kind === "EARNING").map((detail) => ({ code: detail.code, label: detail.label, amount: detail.amount.toFixed(2) })),
    deductions: slip.details.filter((detail) => detail.kind === "DEDUCTION").map((detail) => ({ code: detail.code, label: detail.label, amount: detail.amount.toFixed(2) })),
    employerContributions: slip.details.filter((detail) => detail.kind === "EMPLOYER_CONTRIBUTION" || detail.kind === "EMPLOYER_TAX").map((detail) => ({ code: detail.code, label: detail.label, amount: detail.amount.toFixed(2) })),
  };
  return <PayslipDetail slip={record} backHref={`/payroll/runs/${slip.payrollRunId}`} />;
}

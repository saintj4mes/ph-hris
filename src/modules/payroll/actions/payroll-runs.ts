"use server";

import { Prisma } from "@prisma/client";
import { Decimal } from "@/shared/lib/decimal";
import type { DayType, PayrollCalculationInput, WorkSegment } from "@/modules/payroll/engine/types";
import { calculatePayroll } from "@/modules/payroll/engine";
import { evaluatePayrollFormula } from "@/modules/payroll/engine/formula";
import { loadStatutoryRules } from "@/modules/statutory/load-rules";
import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission } from "@/shared/platform/auth";

function utcDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf())) throw new Error("Invalid payroll date.");
  return date;
}

function dayTypeFor(attendance: { restDay: boolean; holidayType: string | null }): DayType {
  if (attendance.restDay && attendance.holidayType?.includes("REGULAR")) return "REGULAR_HOLIDAY_REST";
  if (attendance.restDay && attendance.holidayType?.includes("SPECIAL")) return "SPECIAL_DAY_REST";
  if (attendance.restDay) return "REST_DAY";
  if (attendance.holidayType?.includes("REGULAR")) return "REGULAR_HOLIDAY";
  if (attendance.holidayType?.includes("SPECIAL")) return "SPECIAL_DAY";
  return "ORDINARY";
}

function buildSegments(attendanceRows: Array<{ workedMinutes: number; overtimeMinutes: number; nightShiftMinutes: number; restDay: boolean; holidayType: string | null }>): WorkSegment[] {
  const result: WorkSegment[] = [];
  const hours = (minutes: number) => new Decimal(minutes).div(60).toString();
  for (const row of attendanceRows) {
    const dayType = dayTypeFor(row);
    const overtime = Math.min(row.overtimeMinutes, row.workedMinutes);
    const night = Math.min(row.nightShiftMinutes, row.workedMinutes);
    const overtimeNight = Math.min(overtime, night);
    const overtimeDay = overtime - overtimeNight;
    const regularMinutes = Math.max(0, row.workedMinutes - overtime);
    const regularNight = Math.max(0, night - overtimeNight);
    const regularDay = Math.max(0, regularMinutes - regularNight);
    if (regularDay) result.push({ dayType, hours: hours(regularDay), isOvertime: false, isNightShift: false });
    if (regularNight) result.push({ dayType, hours: hours(regularNight), isOvertime: false, isNightShift: true });
    if (overtimeDay) result.push({ dayType, hours: hours(overtimeDay), isOvertime: true, isNightShift: false });
    if (overtimeNight) result.push({ dayType, hours: hours(overtimeNight), isOvertime: true, isNightShift: true });
  }
  return result;
}

function number(value: Prisma.Decimal | null | undefined): string { return value?.toString() ?? "0"; }

async function employeePayrollInput(employee: {
  id: string;
  workerClass: "RANK_AND_FILE" | "MANAGERIAL" | "SUPERVISORY";
  isMinimumWageEarner: boolean;
  dateHired: Date;
  dateSeparated: Date | null;
  salaryAssignments: Array<{
    payType: "MONTHLY" | "DAILY" | "HOURLY";
    monthlyRate: Prisma.Decimal | null;
    dailyRate: Prisma.Decimal | null;
    hourlyRate: Prisma.Decimal | null;
    salaryStructure: { payFrequency: string; components: Array<{ amount: Prisma.Decimal | null; formulaOverride: string | null; salaryComponent: { code: string; name: string; kind: "EARNING" | "DEDUCTION" | "EMPLOYER_CONTRIBUTION"; formula: string | null; taxable: boolean; compensationClass: string; recurring: boolean; is13thMonthOrDeMinimisBenefit: boolean } }> } | null;
  }>;
}, run: { cutoffNumber: number; periodStart: Date; periodEnd: Date }, companyPolicy: { monthlyToDailyDivisor: Prisma.Decimal; scheduledHoursPerDay: Prisma.Decimal }, rows: Array<{ workDate: Date; status: string; workedMinutes: number; lateMinutes: number; undertimeMinutes: number; overtimeMinutes: number; nightShiftMinutes: number; unpaidLeaveDays: Prisma.Decimal; restDay: boolean; holidayType: string | null }>, overrides: Array<{ agency: string; contributionProgram: string; mode: "FIRST_CUTOFF" | "SECOND_CUTOFF" | "EVEN_SPLIT" | "EXACT_FIRST_CUTOFF_AMOUNT"; exactFirstCutoffAmount: Prisma.Decimal | null }>, allocations: Array<{ agency: string; contributionProgram: string; mode: "FIRST_CUTOFF" | "SECOND_CUTOFF" | "EVEN_SPLIT" | "EXACT_FIRST_CUTOFF_AMOUNT"; exactFirstCutoffAmount: Prisma.Decimal | null }>, ytd: { taxableRegularCompensation: Prisma.Decimal; taxableSupplementaryCompensation: Prisma.Decimal; taxWithheld: Prisma.Decimal; payrollPeriodsElapsed: number; previousEmployers: Array<{ taxableCompensation: Prisma.Decimal; taxWithheld: Prisma.Decimal }> }, eligible: Record<string, boolean>) {
  const assignment = employee.salaryAssignments[0];
  if (!assignment) throw new Error(`Employee ${employee.id} has no effective salary assignment.`);
  const rules = await loadStatutoryRules(run.periodEnd);
  const payType = assignment.payType;
  const monthlyRate = assignment.monthlyRate;
  const dailyRate = assignment.dailyRate ?? (monthlyRate ? monthlyRate.div(companyPolicy.monthlyToDailyDivisor) : null);
  const hourlyRate = assignment.hourlyRate ?? (dailyRate ? dailyRate.div(companyPolicy.scheduledHoursPerDay) : null);
  const monthlyContributionBase = payType === "MONTHLY" ? monthlyRate : payType === "DAILY" ? dailyRate?.mul(companyPolicy.monthlyToDailyDivisor) : hourlyRate?.mul(companyPolicy.scheduledHoursPerDay).mul(companyPolicy.monthlyToDailyDivisor);
  if (!monthlyContributionBase) throw new Error(`Employee ${employee.id} is missing the contracted rate for ${payType}.`);

  const unpaid = rows.reduce((sum, row) => sum.plus(row.unpaidLeaveDays).plus(row.status === "ABSENT" ? 1 : 0), new Prisma.Decimal(0));
  const workedDays = rows.reduce((sum, row) => sum.plus(row.status === "PRESENT" ? 1 : row.status === "HALF_DAY" ? "0.5" : 0), new Decimal(0));
  const workedMinutes = rows.reduce((sum, row) => sum + row.workedMinutes, 0);
  const lateMinutes = rows.reduce((sum, row) => sum + row.lateMinutes, 0);
  const undertimeMinutes = rows.reduce((sum, row) => sum + row.undertimeMinutes, 0);
  const allocationMap: PayrollCalculationInput["contributionAllocations"] = {};
  const names: Record<string, string> = { SSS: "SSS", MPF_WISP: "SSS_MPF", SS: "SSS_SS", EC: "SSS_EC", PHILHEALTH: "PHILHEALTH", PAGIBIG: "PAGIBIG", PAGIBIG_ER: "PAGIBIG_ER" };
  for (const agency of ["SSS", "PHILHEALTH", "PAGIBIG"]) {
    for (const program of ["SS", "MPF_WISP", "EC", "PHILHEALTH", "PAGIBIG", "PAGIBIG_ER"]) {
      const key = `${agency}:${program}`;
      const override = overrides.find((item) => `${item.agency}:${item.contributionProgram}` === key);
      const company = allocations.find((item) => `${item.agency}:${item.contributionProgram}` === key);
      const selected = override ?? company;
      if (!selected) continue;
      const allocation = { mode: selected.mode, exactFirstCutoffAmount: selected.exactFirstCutoffAmount?.toString() };
      const name = names[program];
      if (name) allocationMap[name] = allocation;
      if (program === "SS") allocationMap.SSS_SS = allocation;
      if (program === "PHILHEALTH") allocationMap.PHILHEALTH_ER = allocation;
    }
  }
  const statutoryEligibility = {
    sss: eligible.SSS === true,
    philHealth: eligible.PHILHEALTH === true,
    pagIbig: eligible.PAGIBIG === true,
    overtime: eligible.OVERTIME === true,
    nightDifferential: eligible.NIGHT_DIFFERENTIAL === true,
    birCompensationTax: eligible.BIR_COMPENSATION_TAX === true,
    fringeBenefitTax: eligible.FRINGE_BENEFIT_TAX === true,
  };

  const from = run.periodStart > employee.dateHired ? run.periodStart : employee.dateHired;
  const to = employee.dateSeparated && employee.dateSeparated < run.periodEnd ? employee.dateSeparated : run.periodEnd;
  let partialUnpaidDays = 0;
  for (let day = run.periodStart.valueOf(); day <= run.periodEnd.valueOf(); day += 86_400_000) {
    const date = new Date(day);
    if (date < from || date > to) {
      const weekday = date.getUTCDay();
      if (weekday !== 0 && weekday !== 6) partialUnpaidDays += 1;
    }
  }
  const unpaidDays = unpaid.plus(partialUnpaidDays);
  const cutoffCountPerMonth = "2";
  const baseCompensation = payType === "MONTHLY"
    ? new Decimal(number(monthlyRate)).div(cutoffCountPerMonth).minus(unpaidDays.mul(dailyRate?.toString() ?? "0"))
    : payType === "DAILY"
      ? new Decimal(number(dailyRate)).mul(workedDays)
      : new Decimal(number(hourlyRate)).mul(new Decimal(workedMinutes).div(60));
  const formulaVariables: Record<string, string> = {
    BASE: baseCompensation.toString(),
    MONTHLY_RATE: number(monthlyRate),
    DAILY_RATE: number(dailyRate),
    HOURLY_RATE: number(hourlyRate),
    DAYS_WORKED: workedDays.toString(),
    HOURS_WORKED: new Decimal(workedMinutes).div(60).toString(),
  };
  const otherEarnings: PayrollCalculationInput["otherEarnings"] = [];
  const otherDeductions: PayrollCalculationInput["otherDeductions"] = [];
  const otherEmployerContributions: PayrollCalculationInput["otherEmployerContributions"] = [];
  const structure = assignment.salaryStructure;
  for (const row of structure?.components ?? []) {
    const component = row.salaryComponent;
    if (!component.recurring || component.code === "BASE_COMPENSATION") continue;
    const formula = row.formulaOverride ?? component.formula;
    let amount = formula
      ? evaluatePayrollFormula(formula, formulaVariables)
      : new Decimal(row.amount?.toString() ?? "0");
    if (!formula && structure?.payFrequency === "MONTHLY") amount = amount.div(cutoffCountPerMonth);
    formulaVariables[component.code] = amount.toString();
    const line = { code: component.code, label: component.name, amount: amount.toString(), taxable: component.taxable, compensationClass: component.compensationClass === "SUPPLEMENTARY" ? "SUPPLEMENTARY" as const : "REGULAR" as const, benefitExemptible: component.is13thMonthOrDeMinimisBenefit };
    if (component.kind === "EARNING") otherEarnings.push(line);
    else if (component.kind === "DEDUCTION") otherDeductions.push(line);
    else otherEmployerContributions.push(line);
  }

  return {
    employee: { employeeId: employee.id, workerClass: employee.workerClass, isMinimumWageEarner: employee.isMinimumWageEarner, eligible: statutoryEligibility },
    payRate: { type: payType, monthlyRate: number(monthlyRate), dailyRate: number(dailyRate), hourlyRate: number(hourlyRate) },
    policy: { monthlyToDailyDivisor: companyPolicy.monthlyToDailyDivisor.toString(), scheduledHoursPerDay: companyPolicy.scheduledHoursPerDay.toString(), cutoffCountPerMonth, cutoffNumber: run.cutoffNumber as 1 | 2 },
    monthlyContributionBase: monthlyContributionBase.toString(),
    unpaidDays: unpaidDays.toString(),
    daysWorked: workedDays.toString(),
    hoursWorked: new Decimal(workedMinutes).div(60).toString(),
    lateMinutes: String(lateMinutes),
    undertimeMinutes: String(undertimeMinutes),
    workSegments: buildSegments(rows),
    otherEarnings,
    otherDeductions,
    otherEmployerContributions,
    contributionAllocations: allocationMap,
    statutoryRules: rules,
    yearToDateTax: {
      taxableRegularCompensation: ytd.taxableRegularCompensation.toString(),
      taxableSupplementaryCompensation: ytd.taxableSupplementaryCompensation.toString(),
      taxWithheld: ytd.taxWithheld.toString(),
      payrollPeriodsElapsed: String(ytd.payrollPeriodsElapsed),
      previousEmployers: ytd.previousEmployers.map((item) => ({ taxableCompensation: item.taxableCompensation.toString(), taxWithheld: item.taxWithheld.toString() })),
    },
    isFinalPayrollPeriodOfYear: run.periodEnd.getUTCMonth() === 11 && run.cutoffNumber === 2,
  } satisfies PayrollCalculationInput;
}

export async function createPayrollRunAction(input: { companyId: string; name: string; cutoffNumber: 1 | 2; periodStart: string; periodEnd: string; payDate: string }) {
  const actor = await requirePermission("payroll", "create");
  const periodStart = utcDate(input.periodStart);
  const periodEnd = utcDate(input.periodEnd);
  const payDate = utcDate(input.payDate);
  if (periodEnd < periodStart) throw new Error("Payroll end date must be on or after the start date.");
  const created = await prisma.payrollRun.create({ data: { companyId: input.companyId, name: input.name.trim(), cutoffNumber: input.cutoffNumber, periodStart, periodEnd, payDate, createdBy: actor.id } });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "PayrollRun", entityId: created.id, action: "CREATE", after: { status: created.status, periodStart: input.periodStart, periodEnd: input.periodEnd } });
  return created;
}

export async function calculatePayrollRunAction(payrollRunId: string) {
  const actor = await requirePermission("payroll", "calculate");
  const run = await prisma.payrollRun.findFirst({ where: { id: payrollRunId, status: { in: ["DRAFT", "FAILED"] } }, include: { company: { include: { payrollPolicy: { include: { contributionAllocations: true } } } } } });
  if (!run || !run.company.payrollPolicy) throw new Error("Draft payroll run with a configured company payroll policy is required.");
  const policy = run.company.payrollPolicy;
  const [employees, allocations, eligibilityRows] = await Promise.all([
    prisma.employee.findMany({
      where: { companyId: run.companyId, dateHired: { lte: run.periodEnd }, OR: [{ dateSeparated: null }, { dateSeparated: { gte: run.periodStart } }] },
      include: {
        salaryAssignments: {
          where: { effectiveFrom: { lte: run.periodEnd }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: run.periodStart } }] },
          include: {
            salaryStructure: {
              include: {
                components: {
                  include: { salaryComponent: true },
                  orderBy: { displayOrder: "asc" },
                },
              },
            },
          },
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
    }),
    prisma.contributionAllocationPolicy.findMany({ where: { payrollPolicyId: policy.id, effectiveFrom: { lte: run.periodEnd }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: run.periodEnd } }] } }),
    prisma.statutoryEligibility.findMany({ where: { employeeId: { in: (await prisma.employee.findMany({ where: { companyId: run.companyId }, select: { id: true } })).map(({ id }) => id) }, effectiveFrom: { lte: run.periodEnd }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: run.periodEnd } }] }, orderBy: { effectiveFrom: "desc" } }),
  ]);
  if (!employees.length) throw new Error("No employees are eligible for this payroll period.");

  await prisma.payrollRun.update({ where: { id: run.id }, data: { status: "CALCULATING" } });
  try {
    await prisma.$transaction(async (tx) => {
      for (const employee of employees) {
        if (!employee.salaryAssignments[0]) throw new Error(`Employee ${employee.employeeNumber} has no salary assignment effective for this run.`);
        const rows = await tx.dailyAttendance.findMany({ where: { employeeId: employee.id, workDate: { gte: run.periodStart, lte: run.periodEnd } }, orderBy: { workDate: "asc" } });
        const flags = new Map<string, boolean>();
        for (const item of eligibilityRows.filter((row) => row.employeeId === employee.id)) if (!flags.has(item.ruleCode)) flags.set(item.ruleCode, item.eligible);
        const requiredFlags = ["SSS", "PHILHEALTH", "PAGIBIG", "OVERTIME", "NIGHT_DIFFERENTIAL", "BIR_COMPENSATION_TAX", "FRINGE_BENEFIT_TAX"];
        const missing = requiredFlags.filter((code) => !flags.has(code));
        if (missing.length) throw new Error(`Employee ${employee.employeeNumber} has unconfigured eligibility flags: ${missing.join(", ")}.`);
        const overrideRows = await tx.employeeContributionAllocationOverride.findMany({ where: { employeeId: employee.id, effectiveFrom: { lte: run.periodEnd }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: run.periodEnd } }] } });
        const existing = await tx.salarySlip.findFirst({ where: { payrollRunId: run.id, employeeId: employee.id, isFrozen: false }, orderBy: { revision: "desc" } });
        const loanRepayments = await tx.loanRepayment.findMany({
          where: {
            loan: { employeeId: employee.id, status: "RELEASED" },
            dueDate: { lte: run.periodEnd },
            paidAt: null,
            OR: [{ salarySlipId: null }, ...(existing ? [{ salarySlipId: existing.id }] : [])],
          },
          orderBy: [{ dueDate: "asc" }, { id: "asc" }],
        });
        const employeeAdvances = await tx.employeeAdvance.findMany({
          where: { employeeId: employee.id, status: "RELEASED", approvedAmount: { not: null }, OR: [{ salarySlipId: null }, ...(existing ? [{ salarySlipId: existing.id }] : [])] },
          orderBy: [{ requestedOn: "asc" }, { id: "asc" }],
        });
        const previousSlips = await tx.salarySlip.findMany({ where: { employeeId: employee.id, status: { in: ["SUBMITTED", "PAID"] }, payrollRun: { periodEnd: { gte: new Date(Date.UTC(run.periodEnd.getUTCFullYear(), 0, 1)), lt: run.periodStart } } }, include: { details: true, payrollRun: true } });
        const priorEmployerInputs = await tx.payrollTaxYearInput.findMany({ where: { employeeId: employee.id, taxYear: run.periodEnd.getUTCFullYear(), source: { not: "CURRENT_EMPLOYER" } } });
        const ytd = {
          taxableRegularCompensation: previousSlips.reduce((sum, slip) => sum.plus(slip.details.filter((detail) => detail.taxable && (detail.metadata as { compensationClass?: string } | null)?.compensationClass !== "SUPPLEMENTARY").reduce((lines, detail) => lines.plus(new Prisma.Decimal((detail.metadata as { taxableAmount?: string } | null)?.taxableAmount ?? detail.amount.toString())), new Prisma.Decimal(0))), new Prisma.Decimal(0)),
          taxableSupplementaryCompensation: previousSlips.reduce((sum, slip) => sum.plus(slip.details.filter((detail) => detail.taxable && (detail.metadata as { compensationClass?: string } | null)?.compensationClass === "SUPPLEMENTARY").reduce((lines, detail) => lines.plus(new Prisma.Decimal((detail.metadata as { taxableAmount?: string } | null)?.taxableAmount ?? detail.amount.toString())), new Prisma.Decimal(0))), new Prisma.Decimal(0)),
          nonTaxableBenefitAmountToDate: previousSlips.reduce((sum, slip) => sum.plus(slip.details.filter((detail) => (detail.metadata as { benefitExemptible?: string } | null)?.benefitExemptible === "true").reduce((lines, detail) => lines.plus(detail.amount), new Prisma.Decimal(0))), new Prisma.Decimal(0)),
          taxWithheld: previousSlips.reduce((sum, slip) => sum.plus(slip.taxWithheld), new Prisma.Decimal(0)),
          payrollPeriodsElapsed: previousSlips.length,
          previousEmployers: priorEmployerInputs.map((item) => ({ taxableCompensation: item.taxableCompensationToDate, taxWithheld: item.taxWithheldToDate })),
        };
        const input = await employeePayrollInput(employee, run, policy, rows, overrideRows, allocations, ytd, Object.fromEntries(flags));
        const basePayroll = calculatePayroll(input);
        let loanDeductionCapacity = Decimal.max(new Decimal(basePayroll.netPay), new Decimal(0));
        const selectedLoanRepayments: Array<{ id: string; amount: Decimal }> = [];
        const selectedAdvances: Array<{ id: string; amount: Decimal }> = [];
        for (const repayment of loanRepayments) {
          const remaining = repayment.amount.minus(repayment.paidAmount);
          const amount = Decimal.min(remaining, loanDeductionCapacity);
          if (amount.lte(0)) continue;
          selectedLoanRepayments.push({ id: repayment.id, amount });
          loanDeductionCapacity = loanDeductionCapacity.minus(amount);
        }
        for (const advance of employeeAdvances) {
          const remaining = new Decimal(advance.approvedAmount!.toString()).minus(advance.settledAmount.toString());
          const amount = Decimal.min(remaining, loanDeductionCapacity);
          if (amount.lte(0)) continue;
          selectedAdvances.push({ id: advance.id, amount });
          loanDeductionCapacity = loanDeductionCapacity.minus(amount);
        }
        input.otherDeductions = [
          ...(input.otherDeductions ?? []),
          ...selectedLoanRepayments.map((item) => ({
            code: `LOAN_REPAYMENT_${item.id}`,
            label: "Employee loan repayment",
            amount: item.amount.toString(),
            taxable: false,
            compensationClass: "REGULAR" as const,
          })),
          ...selectedAdvances.map((advance) => ({
            code: `ADVANCE_SETTLEMENT_${advance.id}`,
            label: "Salary advance settlement",
            amount: advance.amount.toString(),
            taxable: false,
            compensationClass: "REGULAR" as const,
          })),
        ];
        const result = calculatePayroll(input);
        if (existing) await tx.salarySlipDetail.deleteMany({ where: { salarySlipId: existing.id } });
        const slipData = {
          status: "DRAFT" as const,
          isFrozen: false,
          currency: result.currency,
          baseCompensation: result.baseCompensation,
          overtimePay: result.details.filter((line) => line.code === "OVERTIME").reduce((sum, line) => sum.plus(line.amount), new Prisma.Decimal(0)).toString(),
          nightDifferential: result.details.find((line) => line.code === "NIGHT_DIFFERENTIAL")?.amount ?? "0",
          otherEarnings: result.details.filter((line) => line.kind === "EARNING" && !["BASE_COMPENSATION", "OVERTIME", "DAY_PREMIUM", "NIGHT_DIFFERENTIAL"].includes(line.code)).reduce((sum, line) => sum.plus(line.amount), new Prisma.Decimal(0)).toString(),
          grossPay: result.grossPay,
          taxableIncome: result.taxableIncome,
          taxWithheld: result.taxWithheld,
          totalEmployeeDeductions: result.totalEmployeeDeductions,
          totalEmployerContributions: result.totalEmployerContributions,
          employerFringeBenefitTax: result.employerFringeBenefitTax,
          netPay: result.netPay,
          calculationVersion: "ph-hris-payroll-v2",
          inputSnapshot: input as unknown as Prisma.InputJsonValue,
          details: { create: result.details.map((line) => ({ kind: line.kind, code: line.code, label: line.label, amount: line.amount, taxable: line.taxable, agency: line.agency, metadata: line.metadata as Prisma.InputJsonValue | undefined })) },
        };
        let salarySlipId: string;
        if (existing) {
          await tx.salarySlip.update({ where: { id: existing.id }, data: { ...slipData, details: undefined } });
          await tx.salarySlipDetail.createMany({ data: result.details.map((line) => ({ salarySlipId: existing.id, kind: line.kind, code: line.code, label: line.label, amount: line.amount, taxable: line.taxable, agency: line.agency, metadata: line.metadata as Prisma.InputJsonValue | undefined })) });
          salarySlipId = existing.id;
        } else {
          const createdSlip = await tx.salarySlip.create({ data: { payrollRunId: run.id, employeeId: employee.id, revision: 1, ...slipData } });
          salarySlipId = createdSlip.id;
        }
        if (selectedLoanRepayments.length) {
          await tx.loanRepayment.updateMany({ where: { id: { in: selectedLoanRepayments.map(({ id }) => id) }, paidAt: null }, data: { salarySlipId } });
        }
        if (selectedAdvances.length) {
          await tx.employeeAdvance.updateMany({ where: { id: { in: selectedAdvances.map(({ id }) => id) }, status: "RELEASED" }, data: { salarySlipId } });
        }
      }
      await tx.payrollRun.update({ where: { id: run.id }, data: { status: "CALCULATED" } });
      await recordAudit(tx, { actorUserId: actor.id, entityType: "PayrollRun", entityId: run.id, action: "CALCULATE", after: { employees: employees.length, status: "CALCULATED" } });
    }, { isolationLevel: "Serializable", timeout: 120_000 });
  } catch (error) {
    await prisma.payrollRun.update({ where: { id: run.id }, data: { status: "FAILED" } });
    throw error;
  }
  return prisma.payrollRun.findUniqueOrThrow({ where: { id: run.id }, include: { salarySlips: true } });
}

export async function approvePayrollRunAction(payrollRunId: string) {
  const actor = await requirePermission("payroll", "approve");
  return prisma.$transaction(async (tx) => {
    const run = await tx.payrollRun.findFirst({ where: { id: payrollRunId, status: "CALCULATED" }, include: { salarySlips: { include: { employee: { select: { authUser: { select: { id: true } } } } } } } });
    if (!run || run.salarySlips.length === 0 || run.salarySlips.some((slip) => slip.status !== "DRAFT" || slip.isFrozen)) throw new Error("Only a calculated payroll run with draft slips can be approved.");
    const now = new Date();
    await tx.salarySlip.updateMany({ where: { payrollRunId: run.id, status: "DRAFT", isFrozen: false }, data: { status: "SUBMITTED", isFrozen: true, submittedAt: now } });
    const approved = await tx.payrollRun.update({ where: { id: run.id }, data: { status: "APPROVED", approvedBy: actor.id } });
    for (const slip of run.salarySlips) if (slip.employee.authUser) await tx.notification.create({ data: { recipientId: slip.employee.authUser.id, category: "PAYROLL", title: "Payslip published", body: `Your payslip for ${run.periodStart.toISOString().slice(0, 10)} to ${run.periodEnd.toISOString().slice(0, 10)} is ready.`, actionUrl: "/portal/payslips" } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "PayrollRun", entityId: run.id, action: "APPROVE_AND_FREEZE_SLIPS", before: { status: "CALCULATED" }, after: { status: "APPROVED", frozenSlips: run.salarySlips.length } });
    return approved;
  }, { isolationLevel: "Serializable" });
}

export async function postPayrollRunAction(payrollRunId: string) {
  const actor = await requirePermission("payroll", "post");
  return prisma.$transaction(async (tx) => {
    const run = await tx.payrollRun.findFirst({ where: { id: payrollRunId, status: "APPROVED" }, include: { salarySlips: { include: { details: true } } } });
    if (!run || !run.salarySlips.length || run.salarySlips.some((slip) => !slip.isFrozen || slip.status !== "SUBMITTED")) throw new Error("Payroll must be approved with all payslips frozen before posting.");
    const rules = await tx.payrollPostingRule.findMany({ where: { companyId: run.companyId }, include: { debitAccount: true, creditAccount: true } });
    const ruleByCode = new Map(rules.map((rule) => [rule.lineCode, rule]));
    const netRule = ruleByCode.get("NET_PAY");
    if (!netRule?.creditAccountId) throw new Error("Configure a NET_PAY credit account before posting payroll.");
    const lines: Array<{ accountId: string; description: string; debit: Prisma.Decimal; credit: Prisma.Decimal; employeeId?: string }> = [];
    for (const slip of run.salarySlips) {
      for (const detail of slip.details) {
        if (detail.amount.isZero()) continue;
        const rule = ruleByCode.get(detail.code);
        if (!rule) throw new Error(`Missing payroll posting account mapping for line ${detail.code}.`);
        if (detail.kind === "EARNING") {
          if (!rule.debitAccountId) throw new Error(`Missing expense account mapping for ${detail.code}.`);
          lines.push({ accountId: rule.debitAccountId, description: detail.label, debit: detail.amount, credit: new Prisma.Decimal(0), employeeId: slip.employeeId });
        } else if (detail.kind === "DEDUCTION") {
          if (rule.behavior === "DEBIT" && rule.debitAccountId) lines.push({ accountId: rule.debitAccountId, description: detail.label, debit: detail.amount, credit: new Prisma.Decimal(0), employeeId: slip.employeeId });
          else if (rule.creditAccountId) lines.push({ accountId: rule.creditAccountId, description: detail.label, debit: new Prisma.Decimal(0), credit: detail.amount, employeeId: slip.employeeId });
          else throw new Error(`Missing liability or receivable account mapping for ${detail.code}.`);
        } else {
          if (!rule.debitAccountId || !rule.creditAccountId) throw new Error(`Both expense and liability accounts are required for ${detail.code}.`);
          lines.push({ accountId: rule.debitAccountId, description: `${detail.label} expense`, debit: detail.amount, credit: new Prisma.Decimal(0), employeeId: slip.employeeId });
          lines.push({ accountId: rule.creditAccountId, description: `${detail.label} payable`, debit: new Prisma.Decimal(0), credit: detail.amount, employeeId: slip.employeeId });
        }
      }
      if (!new Prisma.Decimal(slip.netPay).isZero()) lines.push({ accountId: netRule.creditAccountId, description: "Net salary payable", debit: new Prisma.Decimal(0), credit: new Prisma.Decimal(slip.netPay), employeeId: slip.employeeId });
    }
    const totalDebit = lines.reduce((sum, line) => sum.plus(line.debit), new Prisma.Decimal(0));
    const totalCredit = lines.reduce((sum, line) => sum.plus(line.credit), new Prisma.Decimal(0));
    if (!totalDebit.eq(totalCredit)) throw new Error(`Payroll journal is out of balance (debit ${totalDebit.toFixed(2)}, credit ${totalCredit.toFixed(2)}).`);
    const journal = await tx.journalEntry.create({
      data: {
        companyId: run.companyId,
        payrollRunId: run.id,
        postingDate: run.payDate,
        reference: run.name,
        memo: `Payroll posting for ${run.periodStart.toISOString().slice(0, 10)} – ${run.periodEnd.toISOString().slice(0, 10)}`,
        status: "POSTED",
        totalDebit,
        totalCredit,
        postedAt: new Date(),
        createdBy: actor.id,
        lines: { create: lines.map((line) => ({ ...line, costCenter: undefined })) },
      },
    });
    const postedRun = await tx.payrollRun.update({ where: { id: run.id }, data: { status: "SUBMITTED", submittedAt: new Date() } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "PayrollRun", entityId: run.id, action: "POST_JOURNAL", after: { journalEntryId: journal.id, totalDebit: totalDebit.toFixed(2), totalCredit: totalCredit.toFixed(2) } });
    return postedRun;
  }, { isolationLevel: "Serializable", timeout: 120_000 });
}

export async function markPayrollRunPaidAction(payrollRunId: string) {
  const actor = await requirePermission("payroll", "pay");
  return prisma.$transaction(async (tx) => {
    const run = await tx.payrollRun.findFirst({ where: { id: payrollRunId, status: "SUBMITTED" }, include: { salarySlips: { include: { details: true, employee: { select: { authUser: { select: { id: true } } } } } } } });
    if (!run) throw new Error("Only a posted payroll run can be marked paid.");
    const repayments = await tx.loanRepayment.findMany({ where: { salarySlipId: { in: run.salarySlips.map(({ id }) => id) }, paidAt: null }, include: { loan: true } });
    for (const repayment of repayments) {
      const linkedSlip = run.salarySlips.find(({ id }) => id === repayment.salarySlipId);
      const detail = linkedSlip?.details.find(({ code }) => code === `LOAN_REPAYMENT_${repayment.id}`);
      if (!detail) {
        await tx.loanRepayment.update({ where: { id: repayment.id }, data: { salarySlipId: null } });
        continue;
      }
      const payment = Decimal.min(detail.amount, repayment.loan.outstanding);
      if (payment.lte(0)) {
        await tx.loanRepayment.update({ where: { id: repayment.id }, data: { salarySlipId: null } });
        continue;
      }
      const nextPaidAmount = repayment.paidAmount.plus(payment);
      const nextOutstanding = repayment.loan.outstanding.minus(payment);
      const installmentPaid = nextPaidAmount.greaterThanOrEqualTo(repayment.amount);
      await tx.loanRepayment.update({ where: { id: repayment.id }, data: { paidAmount: nextPaidAmount, paidAt: installmentPaid ? new Date() : null, salarySlipId: installmentPaid ? repayment.salarySlipId : null } });
      await tx.employeeLoan.update({ where: { id: repayment.loanId }, data: { outstanding: nextOutstanding, status: nextOutstanding.isZero() ? "CLOSED" : "RELEASED" } });
    }
    const advances = await tx.employeeAdvance.findMany({ where: { salarySlipId: { in: run.salarySlips.map(({ id }) => id) }, status: "RELEASED" } });
    for (const advance of advances) {
      const linkedSlip = run.salarySlips.find(({ id }) => id === advance.salarySlipId);
      const detail = linkedSlip?.details.find(({ code }) => code === `ADVANCE_SETTLEMENT_${advance.id}`);
      if (!detail || !advance.approvedAmount) {
        await tx.employeeAdvance.update({ where: { id: advance.id }, data: { salarySlipId: null } });
        continue;
      }
      const settledAmount = advance.settledAmount.plus(Decimal.min(detail.amount, advance.approvedAmount.minus(advance.settledAmount)));
      const settled = settledAmount.greaterThanOrEqualTo(advance.approvedAmount);
      await tx.employeeAdvance.update({ where: { id: advance.id }, data: { settledAmount, status: settled ? "SETTLED" : "RELEASED", salarySlipId: settled ? advance.salarySlipId : null } });
    }
    await tx.salarySlip.updateMany({ where: { payrollRunId: run.id, status: "SUBMITTED", isFrozen: true }, data: { status: "PAID" } });
    const paid = await tx.payrollRun.update({ where: { id: run.id }, data: { status: "PAID" } });
    for (const slip of run.salarySlips) if (slip.employee.authUser) await tx.notification.create({ data: { recipientId: slip.employee.authUser.id, category: "PAYROLL", title: "Payroll marked paid", body: `Your payroll for ${run.periodStart.toISOString().slice(0, 10)} to ${run.periodEnd.toISOString().slice(0, 10)} has been marked paid.`, actionUrl: "/portal/payslips" } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "PayrollRun", entityId: run.id, action: "MARK_PAID", before: { status: "SUBMITTED" }, after: { status: "PAID" } });
    return paid;
  });
}

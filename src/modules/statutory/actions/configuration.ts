"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission } from "@/shared/platform/auth";

export async function setEmployeeStatutoryEligibilityAction(input: { employeeId: string; agency: "SSS" | "PHILHEALTH" | "PAGIBIG" | "BIR" | "LABOR"; ruleCode: string; eligible: boolean; effectiveFrom: string; reason: string }) {
  const actor = await requirePermission("statutory_eligibility", "manage");
  const effectiveFrom = new Date(`${input.effectiveFrom}T00:00:00.000Z`);
  if (Number.isNaN(effectiveFrom.valueOf()) || input.reason.trim().length < 5) throw new Error("Enter a valid effective date and an audit reason.");
  return prisma.$transaction(async (tx) => {
    const current = await tx.statutoryEligibility.findFirst({ where: { employeeId: input.employeeId, agency: input.agency, ruleCode: input.ruleCode, effectiveTo: null }, orderBy: { effectiveFrom: "desc" } });
    if (current && current.effectiveFrom >= effectiveFrom) throw new Error("A later or same-date eligibility record already exists.");
    if (current) await tx.statutoryEligibility.update({ where: { id: current.id }, data: { effectiveTo: new Date(effectiveFrom.valueOf() - 86_400_000) } });
    const record = await tx.statutoryEligibility.create({ data: { employeeId: input.employeeId, agency: input.agency, ruleCode: input.ruleCode.trim().toUpperCase(), eligible: input.eligible, effectiveFrom, reason: input.reason.trim(), createdBy: actor.id } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "StatutoryEligibility", entityId: record.id, action: "SET_ELIGIBILITY", before: current ? { eligible: current.eligible, effectiveFrom: current.effectiveFrom.toISOString() } : undefined, after: { eligible: input.eligible, agency: input.agency, ruleCode: input.ruleCode, effectiveFrom: input.effectiveFrom, reason: input.reason } });
    return record;
  }, { isolationLevel: "Serializable" });
}

export async function saveCompanyPayrollConfigurationAction(input: {
  companyId: string;
  monthlyToDailyDivisor: string;
  scheduledHoursPerDay: string;
  firstCutoffStartDay: number;
  firstCutoffEndDay: number;
  secondCutoffStartDay: number;
  secondCutoffEndDay?: number;
  dailyProrationBasis: string;
  allocations: Array<{ agency: "SSS" | "PHILHEALTH" | "PAGIBIG"; contributionProgram: string; mode: "FIRST_CUTOFF" | "SECOND_CUTOFF" | "EVEN_SPLIT" | "EXACT_FIRST_CUTOFF_AMOUNT"; exactFirstCutoffAmount?: string; effectiveFrom: string }>;
}) {
  const actor = await requirePermission("payroll_configuration", "manage");
  const divisor = new Prisma.Decimal(input.monthlyToDailyDivisor);
  const hours = new Prisma.Decimal(input.scheduledHoursPerDay);
  if (divisor.lessThanOrEqualTo(0) || hours.lessThanOrEqualTo(0)) throw new Error("Monthly divisor and scheduled hours must be greater than zero.");
  if (input.firstCutoffStartDay < 1 || input.firstCutoffStartDay > input.firstCutoffEndDay || input.firstCutoffEndDay >= input.secondCutoffStartDay || input.secondCutoffStartDay > 31 || (input.secondCutoffEndDay !== undefined && (input.secondCutoffEndDay < input.secondCutoffStartDay || input.secondCutoffEndDay > 31))) throw new Error("Cutoff day ranges must be valid and non-overlapping.");
  return prisma.$transaction(async (tx) => {
    const policy = await tx.payrollPolicy.upsert({
      where: { companyId: input.companyId },
      update: { monthlyToDailyDivisor: divisor, scheduledHoursPerDay: hours, firstCutoffStartDay: input.firstCutoffStartDay, firstCutoffEndDay: input.firstCutoffEndDay, secondCutoffStartDay: input.secondCutoffStartDay, secondCutoffEndDay: input.secondCutoffEndDay ?? null, dailyProrationBasis: input.dailyProrationBasis },
      create: { companyId: input.companyId, monthlyToDailyDivisor: divisor, scheduledHoursPerDay: hours, firstCutoffStartDay: input.firstCutoffStartDay, firstCutoffEndDay: input.firstCutoffEndDay, secondCutoffStartDay: input.secondCutoffStartDay, secondCutoffEndDay: input.secondCutoffEndDay ?? null, dailyProrationBasis: input.dailyProrationBasis },
    });
    for (const allocation of input.allocations) {
      const effectiveFrom = new Date(`${allocation.effectiveFrom}T00:00:00.000Z`);
      const exactFirstCutoffAmount = allocation.exactFirstCutoffAmount ? new Prisma.Decimal(allocation.exactFirstCutoffAmount) : null;
      if (allocation.mode === "EXACT_FIRST_CUTOFF_AMOUNT" && (!exactFirstCutoffAmount || exactFirstCutoffAmount.lessThan(0))) throw new Error(`An exact first-cutoff amount is required for ${allocation.agency} ${allocation.contributionProgram}.`);
      await tx.contributionAllocationPolicy.updateMany({ where: { payrollPolicyId: policy.id, agency: allocation.agency, contributionProgram: allocation.contributionProgram, effectiveTo: null, effectiveFrom: { lt: effectiveFrom } }, data: { effectiveTo: new Date(effectiveFrom.valueOf() - 86_400_000) } });
      await tx.contributionAllocationPolicy.upsert({
        where: { payrollPolicyId_agency_contributionProgram_effectiveFrom: { payrollPolicyId: policy.id, agency: allocation.agency, contributionProgram: allocation.contributionProgram, effectiveFrom } },
        update: { mode: allocation.mode, exactFirstCutoffAmount, effectiveTo: null },
        create: { payrollPolicyId: policy.id, agency: allocation.agency, contributionProgram: allocation.contributionProgram, mode: allocation.mode, exactFirstCutoffAmount, effectiveFrom },
      });
    }
    await recordAudit(tx, { actorUserId: actor.id, entityType: "PayrollPolicy", entityId: policy.id, action: "CONFIGURE", after: { divisor: divisor.toString(), hours: hours.toString(), firstCutoffEndDay: input.firstCutoffEndDay, secondCutoffStartDay: input.secondCutoffStartDay, allocationCount: input.allocations.length } });
    return policy;
  });
}

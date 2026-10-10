import { Prisma, StatutoryAgency, StatutoryRuleKind } from "@prisma/client";
import type { AnnualTaxBracket, SssBracket, StatutoryRules, WithholdingTaxBracket } from "@/modules/payroll/engine/types";
import { prisma } from "@/shared/db/prisma";

const zero = new Prisma.Decimal(0);
function text(value: Prisma.Decimal | null | undefined, fallback = "0"): string { return value?.toString() ?? fallback; }

async function schedule(agency: StatutoryAgency, ruleKind: StatutoryRuleKind, at: Date) {
  const found = await prisma.statutorySchedule.findFirst({
    where: { agency, ruleKind, publicationStatus: "PUBLISHED", effectiveFrom: { lte: at }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }] },
    include: { slabs: true },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!found) throw new Error(`No published ${agency} ${ruleKind} schedule is configured for ${at.toISOString().slice(0, 10)}.`);
  return found;
}

export async function loadStatutoryRules(at: Date): Promise<StatutoryRules> {
  const [sssSchedule, philHealthSchedule, pagIbigSchedule, birSchedule, fbtSchedule] = await Promise.all([
    schedule("SSS", "CONTRIBUTION", at),
    schedule("PHILHEALTH", "CONTRIBUTION", at),
    schedule("PAGIBIG", "CONTRIBUTION", at),
    schedule("BIR", "WITHHOLDING_TAX", at),
    schedule("BIR", "FRINGE_BENEFIT_TAX", at),
  ]);

  const ssSlabs = sssSchedule.slabs.filter((slab) => slab.contributionProgram === "SS").sort((a, b) => (a.compensationMin ?? zero).cmp(b.compensationMin ?? zero));
  const sss: SssBracket[] = ssSlabs.map((ss) => {
    const mpf = sssSchedule.slabs.find((slab) => slab.contributionProgram === "MPF_WISP" && slab.compensationMin?.eq(ss.compensationMin ?? zero));
    const ec = sssSchedule.slabs.find((slab) => slab.contributionProgram === "EC" && slab.compensationMin?.eq(ss.compensationMin ?? zero));
    if (!mpf || !ec) throw new Error(`SSS schedule ${sssSchedule.version} is missing MPF or EC rows for ${ss.code}.`);
    return {
      compensationMin: text(ss.compensationMin),
      compensationMax: ss.compensationMax?.toString(),
      monthlySalaryCredit: text(ss.contributionBaseFloor),
      regularEe: text(ss.employeeFixedAmount),
      mpfEe: text(mpf.employeeFixedAmount),
      regularEr: text(ss.employerFixedAmount),
      mpfEr: text(mpf.employerFixedAmount),
      ecEr: text(ec.employerFixedAmount),
    };
  });
  if (!sss.length) throw new Error(`SSS schedule ${sssSchedule.version} has no contribution brackets.`);

  const phil = philHealthSchedule.slabs[0];
  const pagLow = pagIbigSchedule.slabs.find((slab) => slab.compensationMax !== null);
  const pagHigh = pagIbigSchedule.slabs.find((slab) => slab.compensationMax === null);
  if (!phil || !pagLow || !pagHigh) throw new Error("PhilHealth or Pag-IBIG schedule is missing its required contribution rows.");

  const semiRows = birSchedule.slabs.filter((slab) => slab.payrollPeriod === "SEMI_MONTHLY").sort((a, b) => (a.compensationMin ?? zero).cmp(b.compensationMin ?? zero));
  const annualRows = birSchedule.slabs.filter((slab) => slab.payrollPeriod === "ANNUAL").sort((a, b) => (a.compensationMin ?? zero).cmp(b.compensationMin ?? zero));
  if (!semiRows.length || !annualRows.length) throw new Error(`BIR schedule ${birSchedule.version} must include semi-monthly and annual tax rows.`);
  const semiMonthlyBrackets: WithholdingTaxBracket[] = semiRows.map((row) => ({ minimum: text(row.compensationMin), maximum: row.compensationMax?.toString(), baseTax: text(row.taxBaseAmount), marginalRate: text(row.marginalRate), marginalOver: text(row.marginalOver) }));
  const annualBrackets: AnnualTaxBracket[] = annualRows.map((row) => ({ minimum: text(row.compensationMin), maximum: row.compensationMax?.toString(), baseTax: text(row.taxBaseAmount), marginalRate: text(row.marginalRate), marginalOver: text(row.marginalOver) }));
  const fbt = fbtSchedule.slabs[0];
  if (!fbt) throw new Error(`BIR fringe-benefit schedule ${fbtSchedule.version} is empty.`);
  const fbtMetadata = (fbt.metadata ?? {}) as { grossUpDivisor?: string };

  return {
    sss: { brackets: sss },
    philHealth: {
      rate: text(phil.employeeRate).toString(),
      incomeFloor: text(phil.contributionBaseFloor),
      incomeCeiling: text(phil.contributionBaseCeiling),
      employeeShare: text(phil.employeeRate),
      employerShare: text(phil.employerRate),
    },
    pagIbig: {
      salaryCeiling: text(pagHigh.contributionBaseCeiling),
      lowSalaryThreshold: text(pagLow.compensationMax),
      employeeRateAtOrBelowThreshold: text(pagLow.employeeRate),
      employeeRateAboveThreshold: text(pagHigh.employeeRate),
      employerRate: text(pagHigh.employerRate),
    },
    bir: {
      semiMonthlyBrackets,
      annualBrackets,
      minimumWageEarnerTaxExempt: true,
      regularCompensationThreshold: "10417",
      nonTaxable13thMonthAndBenefitsCap: "90000",
      fringeBenefitTaxRate: text(fbt.employeeRate),
      fringeBenefitTaxGrossUpDivisor: fbtMetadata.grossUpDivisor ?? "0.65",
    },
  };
}

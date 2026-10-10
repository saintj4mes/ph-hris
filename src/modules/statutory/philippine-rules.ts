import { Decimal } from "@/shared/lib/decimal";
import type { SssBracket, StatutoryRules } from "@/modules/payroll/engine/types";

export const PHILIPPINE_STATUTORY_SOURCES = {
  sss: "https://www.sss.gov.ph/wp-content/uploads/2024/12/2025-SSS-Contribution-Table-rev.pdf",
  philHealth: "https://www.philhealth.gov.ph/advisories/2025/PA2025-0002.pdf",
  pagIbig: "https://www.pagibigfund.gov.ph/document/pdf/circulars/provident/HDMF%20Circular%20No.%20274%20-%20Revised%20Guidelines%20on%20Pag-IBIG%20Fund%20Membership.pdf",
  bir: "https://bir-cdn.bir.gov.ph/local/pdf/Annex%20E%20RR%2011-2018.pdf",
} as const;

export const PHILIPPINE_SCHEDULE_VERSIONS = [
  { agency: "SSS", version: "2025-01", effectiveFrom: "2025-01-01", status: "PUBLISHED" },
  { agency: "PHILHEALTH", version: "2025-01", effectiveFrom: "2025-01-01", status: "PUBLISHED" },
  { agency: "PAGIBIG", version: "2024-02", effectiveFrom: "2024-02-01", status: "PUBLISHED" },
  { agency: "BIR", version: "2023-01", effectiveFrom: "2023-01-01", status: "PUBLISHED" },
  { agency: "SSS", version: "2026-PENDING", effectiveFrom: "2026-01-01", status: "PENDING_CONFIRMATION" },
  { agency: "PHILHEALTH", version: "2026-PENDING", effectiveFrom: "2026-01-01", status: "PENDING_CONFIRMATION" },
  { agency: "PAGIBIG", version: "2026-PENDING", effectiveFrom: "2026-01-01", status: "PENDING_CONFIRMATION" },
  { agency: "BIR", version: "2026-PENDING", effectiveFrom: "2026-01-01", status: "PENDING_CONFIRMATION" },
] as const;

function makeSssBrackets(): SssBracket[] {
  const brackets: SssBracket[] = [];
  for (let index = 0; index <= 60; index += 1) {
    const compensationMin = index === 0 ? new Decimal(0) : new Decimal(5250).plus(new Decimal(index - 1).mul(500));
    const compensationMax = index === 60 ? undefined : compensationMin.plus("499.99");
    const msc = index === 0 ? new Decimal(5000) : new Decimal(5500).plus(new Decimal(index - 1).mul(500));
    const regularMsc = Decimal.min(msc, new Decimal(20000));
    const mpfMsc = Decimal.max(msc.minus(20000), 0);
    brackets.push({
      compensationMin,
      compensationMax,
      monthlySalaryCredit: msc,
      regularEe: regularMsc.mul("0.05"),
      mpfEe: mpfMsc.mul("0.05"),
      regularEr: regularMsc.mul("0.10"),
      mpfEr: mpfMsc.mul("0.10"),
      ecEr: msc.lte(14500) ? new Decimal(10) : new Decimal(30),
    });
  }
  return brackets;
}

/** Latest published Philippine private-sector schedules verified for this scaffold. */
export function getPublishedPhilippineRules(): StatutoryRules {
  return {
    sss: { brackets: makeSssBrackets() },
    philHealth: {
      rate: "0.05",
      incomeFloor: "10000",
      incomeCeiling: "100000",
      employeeShare: "0.025",
      employerShare: "0.025",
    },
    pagIbig: {
      salaryCeiling: "10000",
      lowSalaryThreshold: "1500",
      employeeRateAtOrBelowThreshold: "0.01",
      employeeRateAboveThreshold: "0.02",
      employerRate: "0.02",
    },
    bir: {
      semiMonthlyBrackets: [
        { minimum: "0", maximum: "10416.99", baseTax: "0", marginalRate: "0", marginalOver: "0" },
        { minimum: "10417", maximum: "16666.99", baseTax: "0", marginalRate: "0.15", marginalOver: "10417" },
        { minimum: "16667", maximum: "33332.99", baseTax: "937.50", marginalRate: "0.20", marginalOver: "16667" },
        { minimum: "33333", maximum: "83332.99", baseTax: "4270.70", marginalRate: "0.25", marginalOver: "33333" },
        { minimum: "83333", maximum: "333332.99", baseTax: "16770.70", marginalRate: "0.30", marginalOver: "83333" },
        { minimum: "333333", baseTax: "91770.70", marginalRate: "0.35", marginalOver: "333333" },
      ],
      annualBrackets: [
        { minimum: "0", maximum: "250000", baseTax: "0", marginalRate: "0", marginalOver: "0" },
        { minimum: "250000.01", maximum: "400000", baseTax: "0", marginalRate: "0.15", marginalOver: "250000" },
        { minimum: "400000.01", maximum: "800000", baseTax: "22500", marginalRate: "0.20", marginalOver: "400000" },
        { minimum: "800000.01", maximum: "2000000", baseTax: "102500", marginalRate: "0.25", marginalOver: "800000" },
        { minimum: "2000000.01", maximum: "8000000", baseTax: "402500", marginalRate: "0.30", marginalOver: "2000000" },
        { minimum: "8000000.01", baseTax: "2202500", marginalRate: "0.35", marginalOver: "8000000" },
      ],
      minimumWageEarnerTaxExempt: true,
      regularCompensationThreshold: "10417",
      nonTaxable13thMonthAndBenefitsCap: "90000",
      fringeBenefitTaxRate: "0.35",
      fringeBenefitTaxGrossUpDivisor: "0.65",
    },
  };
}

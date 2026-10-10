import { Decimal, money } from "@/shared/lib/decimal";
import type {
  AnnualTaxBracket,
  AllocationMode,
  ContributionAllocation,
  DayType,
  PayrollCalculationInput,
  PayrollCalculationResult,
  SalarySlipDetailResult,
  SssBracket,
  WithholdingTaxBracket,
} from "./types";

const ZERO = new Decimal(0);
const ONE = new Decimal(1);
const HALF = new Decimal("0.5");
function d(value: Decimal.Value | undefined, fallback = "0"): Decimal {
  return new Decimal(value ?? fallback);
}

function moneyText(value: Decimal): string {
  return money(value).toFixed(2);
}

function findSssBracket(brackets: SssBracket[], compensation: Decimal): SssBracket {
  const selected = brackets.find((bracket) => {
    const lower = d(bracket.compensationMin);
    const upper = bracket.compensationMax === undefined ? undefined : d(bracket.compensationMax);
    return compensation.gte(lower) && (upper === undefined || compensation.lte(upper));
  });

  if (!selected) {
    throw new Error(`No SSS contribution bracket matches monthly compensation ${compensation.toFixed(2)}.`);
  }
  return selected;
}

function calculateTaxFromBrackets(
  taxableCompensation: Decimal,
  brackets: Array<WithholdingTaxBracket | AnnualTaxBracket>,
): Decimal {
  const selected = brackets
    .filter((bracket) => taxableCompensation.gte(d(bracket.minimum)))
    .sort((a, b) => d(b.minimum).cmp(d(a.minimum)))[0];

  if (!selected) return ZERO;
  const raw = d(selected.baseTax).plus(
    taxableCompensation.minus(d(selected.marginalOver)).mul(d(selected.marginalRate)),
  );
  return Decimal.max(raw, ZERO);
}

function allocationFor(
  monthlyAmount: Decimal,
  cutoffNumber: 1 | 2,
  configured: ContributionAllocation | undefined,
): Decimal {
  if (!configured) {
    throw new Error("Each statutory contribution needs a cutoff allocation policy.");
  }

  const mode: AllocationMode = configured.employeeOverride?.mode ?? configured.mode;
  const customFirst = d(
    configured.employeeOverride?.exactFirstCutoffAmount ?? configured.exactFirstCutoffAmount,
  );
  let firstAmount: Decimal;

  switch (mode) {
    case "FIRST_CUTOFF":
      firstAmount = monthlyAmount;
      break;
    case "SECOND_CUTOFF":
      firstAmount = ZERO;
      break;
    case "EVEN_SPLIT":
      firstAmount = money(monthlyAmount.mul(HALF));
      break;
    case "EXACT_FIRST_CUTOFF_AMOUNT":
      if (customFirst.lt(ZERO) || customFirst.gt(monthlyAmount)) {
        throw new Error("The first-cutoff allocation must be between zero and the monthly employee contribution.");
      }
      firstAmount = money(customFirst);
      break;
  }

  return cutoffNumber === 1 ? firstAmount : money(monthlyAmount.minus(firstAmount));
}

function dayPremiumMultiplier(dayType: DayType): Decimal {
  const multipliers: Record<DayType, string> = {
    ORDINARY: "1",
    REST_DAY: "1.3",
    SPECIAL_DAY: "1.3",
    SPECIAL_DAY_REST: "1.5",
    DOUBLE_SPECIAL: "1.5",
    DOUBLE_SPECIAL_REST: "1.95",
    REGULAR_HOLIDAY: "2",
    REGULAR_HOLIDAY_REST: "2.6",
    DOUBLE_HOLIDAY: "3",
    DOUBLE_HOLIDAY_REST: "3.9",
  };
  return new Decimal(multipliers[dayType]);
}

function overtimeMultiplier(dayType: DayType): Decimal {
  return new Decimal(dayType === "ORDINARY" ? "1.25" : "1.3");
}

function addDetail(
  details: SalarySlipDetailResult[],
  item: Omit<SalarySlipDetailResult, "amount"> & { amount: Decimal },
): Decimal {
  const rounded = money(item.amount);
  if (rounded.isZero()) return ZERO;
  details.push({ ...item, amount: rounded.toFixed(2) });
  return rounded;
}

function calculateAnnualizedTrueUp(input: PayrollCalculationInput, currentTaxable: Decimal): Decimal | undefined {
  if (!input.isFinalPayrollPeriodOfYear || !input.yearToDateTax) return undefined;

  const ytd = input.yearToDateTax;
  const previousEmployerCompensation = (ytd.previousEmployers ?? []).reduce(
    (sum, employer) => sum.plus(d(employer.taxableCompensation)),
    ZERO,
  );
  const previousEmployerTax = (ytd.previousEmployers ?? []).reduce(
    (sum, employer) => sum.plus(d(employer.taxWithheld)),
    ZERO,
  );
  const annualTaxable = d(ytd.taxableRegularCompensation)
    .plus(d(ytd.taxableSupplementaryCompensation))
    .plus(previousEmployerCompensation)
    .plus(currentTaxable);
  const annualTax = calculateTaxFromBrackets(annualTaxable, input.statutoryRules.bir.annualBrackets);
  const alreadyWithheld = d(ytd.taxWithheld).plus(previousEmployerTax);
  return money(annualTax.minus(alreadyWithheld));
}

function calculateCumulativeAverageTax(input: PayrollCalculationInput, regularTaxable: Decimal, supplementaryTaxable: Decimal): Decimal | undefined {
  const ytd = input.yearToDateTax;
  if (!ytd) return undefined;

  const threshold = d(input.statutoryRules.bir.regularCompensationThreshold);
  const hasPreviousEmployer = (ytd.previousEmployers?.length ?? 0) > 0;
  const exceptionalCase =
    (supplementaryTaxable.gt(ZERO) && regularTaxable.lte(threshold)) ||
    supplementaryTaxable.gte(regularTaxable) ||
    hasPreviousEmployer;
  if (!exceptionalCase) return undefined;

  const priorEmployerCompensation = (ytd.previousEmployers ?? []).reduce(
    (sum, employer) => sum.plus(d(employer.taxableCompensation)),
    ZERO,
  );
  const priorEmployerTax = (ytd.previousEmployers ?? []).reduce(
    (sum, employer) => sum.plus(d(employer.taxWithheld)),
    ZERO,
  );
  const priorPeriods = d(ytd.payrollPeriodsElapsed);
  const periodsIncludingCurrent = priorPeriods.plus(ONE);
  const cumulativeIncome = d(ytd.taxableRegularCompensation)
    .plus(d(ytd.taxableSupplementaryCompensation))
    .plus(priorEmployerCompensation)
    .plus(regularTaxable)
    .plus(supplementaryTaxable);
  const averagePerPeriod = periodsIncludingCurrent.isZero()
    ? ZERO
    : cumulativeIncome.div(periodsIncludingCurrent);
  const cumulativeTax = calculateTaxFromBrackets(
    averagePerPeriod,
    input.statutoryRules.bir.semiMonthlyBrackets,
  ).mul(periodsIncludingCurrent);
  const priorWithheld = d(ytd.taxWithheld).plus(priorEmployerTax);
  return money(cumulativeTax.minus(priorWithheld));
}

/**
 * Calculate a single employee's cutoff payroll from normalized, already-approved inputs.
 * The function is pure: all statutory rules, time facts, and company settings are inputs.
 */
export function calculatePayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const details: SalarySlipDetailResult[] = [];
  const divisor = d(input.policy.monthlyToDailyDivisor);
  const hoursPerDay = d(input.policy.scheduledHoursPerDay);
  const cutoffCount = d(input.policy.cutoffCountPerMonth);
  if (divisor.lte(ZERO) || hoursPerDay.lte(ZERO) || cutoffCount.lte(ZERO)) {
    throw new Error("Payroll divisor, scheduled hours, and cutoff count must be greater than zero.");
  }

  const monthlyRate = d(input.payRate.monthlyRate);
  const dailyRate = input.payRate.type === "DAILY"
    ? d(input.payRate.dailyRate)
    : monthlyRate.div(divisor);
  const hourlyRate = input.payRate.type === "HOURLY"
    ? d(input.payRate.hourlyRate)
    : input.payRate.type === "DAILY"
      ? dailyRate.div(hoursPerDay)
      : dailyRate.div(hoursPerDay);

  let baseCompensation: Decimal;
  switch (input.payRate.type) {
    case "MONTHLY":
      baseCompensation = monthlyRate.div(cutoffCount).minus(d(input.unpaidDays).mul(dailyRate));
      break;
    case "DAILY":
      baseCompensation = dailyRate.mul(d(input.daysWorked));
      break;
    case "HOURLY":
      baseCompensation = hourlyRate.mul(d(input.hoursWorked));
      break;
  }
  baseCompensation = money(Decimal.max(baseCompensation, ZERO));

  const baseTotal = addDetail(details, {
    code: "BASE_COMPENSATION",
    label: "Base cutoff compensation",
    kind: "EARNING",
    amount: baseCompensation,
    taxable: !input.employee.isMinimumWageEarner,
  });

  let overtimePay = ZERO;
  let dayPremiumPay = ZERO;
  let nightDifferential = ZERO;
  for (const segment of input.workSegments) {
    const hours = d(segment.hours);
    if (hours.lt(ZERO)) throw new Error("Work segment hours cannot be negative.");
    const dayMultiplier = dayPremiumMultiplier(segment.dayType);
    const otMultiplier = segment.isOvertime ? overtimeMultiplier(segment.dayType) : ONE;
    const totalRateMultiplier = dayMultiplier.mul(otMultiplier);

    if (segment.isOvertime && input.employee.eligible.overtime) {
      overtimePay = overtimePay.plus(hourlyRate.mul(hours).mul(totalRateMultiplier));
    } else if (!segment.isOvertime && !dayMultiplier.eq(ONE)) {
      dayPremiumPay = dayPremiumPay.plus(hourlyRate.mul(hours).mul(dayMultiplier.minus(ONE)));
    }

    if (segment.isNightShift && input.employee.eligible.nightDifferential) {
      nightDifferential = nightDifferential.plus(
        hourlyRate.mul(hours).mul(dayMultiplier).mul(otMultiplier).mul("0.10"),
      );
    }
  }
  overtimePay = addDetail(details, {
    code: "OVERTIME",
    label: "Overtime pay",
    kind: "EARNING",
    amount: overtimePay,
    taxable: !input.employee.isMinimumWageEarner,
  });
  dayPremiumPay = addDetail(details, {
    code: "DAY_PREMIUM",
    label: "Rest day and holiday premium pay",
    kind: "EARNING",
    amount: dayPremiumPay,
    taxable: !input.employee.isMinimumWageEarner,
  });
  nightDifferential = addDetail(details, {
    code: "NIGHT_DIFFERENTIAL",
    label: "Night shift differential",
    kind: "EARNING",
    amount: nightDifferential,
    taxable: !input.employee.isMinimumWageEarner,
  });

  let otherRegularTaxable = ZERO;
  let otherSupplementaryTaxable = ZERO;
  let otherEarnings = ZERO;
  let exemptibleBenefitsUsed = d(input.yearToDateTax?.nonTaxableBenefitAmountToDate);
  const benefitExemptionCap = d(input.statutoryRules.bir.nonTaxable13thMonthAndBenefitsCap);
  for (const earning of input.otherEarnings ?? []) {
    const originalAmount = d(earning.amount);
    let taxableAmount = earning.taxable ? originalAmount : ZERO;
    if (earning.benefitExemptible) {
      const remainingExemption = Decimal.max(benefitExemptionCap.minus(exemptibleBenefitsUsed), ZERO);
      const exemptAmount = Decimal.min(originalAmount, remainingExemption);
      taxableAmount = Decimal.max(originalAmount.minus(exemptAmount), ZERO);
      exemptibleBenefitsUsed = exemptibleBenefitsUsed.plus(originalAmount);
    }
    const amount = addDetail(details, {
      code: earning.code,
      label: earning.label,
      kind: "EARNING",
      amount: originalAmount,
      taxable: !taxableAmount.isZero(),
      metadata: { compensationClass: earning.compensationClass, taxableAmount: moneyText(taxableAmount), benefitExemptible: String(Boolean(earning.benefitExemptible)) },
    });
    otherEarnings = otherEarnings.plus(amount);
    if (earning.compensationClass === "REGULAR") otherRegularTaxable = otherRegularTaxable.plus(taxableAmount);
    if (earning.compensationClass === "SUPPLEMENTARY") otherSupplementaryTaxable = otherSupplementaryTaxable.plus(taxableAmount);
  }

  const grossPay = money(baseTotal.plus(overtimePay).plus(dayPremiumPay).plus(nightDifferential).plus(otherEarnings));
  const lateDeduction = money(hourlyRate.mul(d(input.lateMinutes)).div(60));
  const undertimeDeduction = money(hourlyRate.mul(d(input.undertimeMinutes)).div(60));
  let employeeDeductions = addDetail(details, {
    code: "LATE",
    label: "Late minutes",
    kind: "DEDUCTION",
    amount: lateDeduction,
    taxable: false,
  });
  employeeDeductions = employeeDeductions.plus(addDetail(details, {
    code: "UNDERTIME",
    label: "Undertime minutes",
    kind: "DEDUCTION",
    amount: undertimeDeduction,
    taxable: false,
  }));
  for (const deduction of input.otherDeductions ?? []) {
    employeeDeductions = employeeDeductions.plus(addDetail(details, {
      code: deduction.code,
      label: deduction.label,
      kind: "DEDUCTION",
      amount: d(deduction.amount),
      taxable: false,
    }));
  }

  const monthlyBase = d(input.monthlyContributionBase);
  let monthlySssEe = ZERO;
  let employerContributions = ZERO;
  if (input.employee.eligible.sss) {
    const sss = findSssBracket(input.statutoryRules.sss.brackets, monthlyBase);
    const sssEe = d(sss.regularEe);
    const mpfEe = d(sss.mpfEe);
    const sssEr = d(sss.regularEr);
    const mpfEr = d(sss.mpfEr);
    const ecEr = d(sss.ecEr);
    monthlySssEe = sssEe.plus(mpfEe);
    const sssRegularEeAllocated = allocationFor(
      sssEe,
      input.policy.cutoffNumber,
      input.contributionAllocations.SSS_SS ?? input.contributionAllocations.SSS,
    );
    const mpfEeAllocated = allocationFor(
      mpfEe,
      input.policy.cutoffNumber,
      input.contributionAllocations.SSS_MPF,
    );
    employeeDeductions = employeeDeductions.plus(addDetail(details, {
      code: "SSS_EE",
      label: "SSS employee share",
      kind: "DEDUCTION",
      amount: sssRegularEeAllocated,
      taxable: false,
      agency: "SSS",
      metadata: { program: "SS" },
    }));
    employeeDeductions = employeeDeductions.plus(addDetail(details, {
      code: "SSS_MPF_EE",
      label: "SSS MPF / WISP employee share",
      kind: "DEDUCTION",
      amount: mpfEeAllocated,
      taxable: false,
      agency: "SSS",
      metadata: { program: "MPF_WISP" },
    }));
    for (const contribution of [
      { code: "SSS_ER", label: "SSS employer share", amount: sssEr, program: "SS" },
      { code: "SSS_MPF_ER", label: "SSS MPF / WISP employer share", amount: mpfEr, program: "MPF_WISP" },
      { code: "SSS_EC_ER", label: "Employees' Compensation employer share", amount: ecEr, program: "EC" },
    ]) {
      const allocated = allocationFor(
        contribution.amount,
        input.policy.cutoffNumber,
        input.contributionAllocations[`SSS_${contribution.program === "MPF_WISP" ? "MPF" : contribution.program}`],
      );
      employerContributions = employerContributions.plus(addDetail(details, {
        code: contribution.code,
        label: contribution.label,
        kind: "EMPLOYER_CONTRIBUTION",
        amount: allocated,
        taxable: false,
        agency: "SSS",
        metadata: { program: contribution.program },
      }));
    }
  }

  for (const contribution of input.otherEmployerContributions ?? []) {
    employerContributions = employerContributions.plus(addDetail(details, {
      code: contribution.code,
      label: contribution.label,
      kind: "EMPLOYER_CONTRIBUTION",
      amount: d(contribution.amount),
      taxable: false,
    }));
  }

  let monthlyPhilHealthEe = ZERO;
  if (input.employee.eligible.philHealth) {
    const rules = input.statutoryRules.philHealth;
    const base = Decimal.max(d(rules.incomeFloor), Decimal.min(monthlyBase, d(rules.incomeCeiling)));
    const ee = money(base.mul(d(rules.employeeShare)));
    const er = money(base.mul(d(rules.employerShare)));
    monthlyPhilHealthEe = ee;
    const eeAllocated = allocationFor(ee, input.policy.cutoffNumber, input.contributionAllocations.PHILHEALTH);
    employeeDeductions = employeeDeductions.plus(addDetail(details, {
      code: "PHILHEALTH_EE",
      label: "PhilHealth employee share",
      kind: "DEDUCTION",
      amount: eeAllocated,
      taxable: false,
      agency: "PHILHEALTH",
    }));
    const erAllocated = allocationFor(er, input.policy.cutoffNumber, input.contributionAllocations.PHILHEALTH_ER);
    employerContributions = employerContributions.plus(addDetail(details, {
      code: "PHILHEALTH_ER",
      label: "PhilHealth employer share",
      kind: "EMPLOYER_CONTRIBUTION",
      amount: erAllocated,
      taxable: false,
      agency: "PHILHEALTH",
    }));
  }

  let monthlyPagIbigEe = ZERO;
  if (input.employee.eligible.pagIbig) {
    const rules = input.statutoryRules.pagIbig;
    const base = Decimal.min(monthlyBase, d(rules.salaryCeiling));
    const eeRate = monthlyBase.lte(d(rules.lowSalaryThreshold))
      ? d(rules.employeeRateAtOrBelowThreshold)
      : d(rules.employeeRateAboveThreshold);
    const ee = money(base.mul(eeRate));
    const er = money(base.mul(d(rules.employerRate)));
    monthlyPagIbigEe = ee;
    const eeAllocated = allocationFor(ee, input.policy.cutoffNumber, input.contributionAllocations.PAGIBIG);
    employeeDeductions = employeeDeductions.plus(addDetail(details, {
      code: "PAGIBIG_EE",
      label: "Pag-IBIG employee share",
      kind: "DEDUCTION",
      amount: eeAllocated,
      taxable: false,
      agency: "PAGIBIG",
    }));
    const erAllocated = allocationFor(er, input.policy.cutoffNumber, input.contributionAllocations.PAGIBIG_ER);
    employerContributions = employerContributions.plus(addDetail(details, {
      code: "PAGIBIG_ER",
      label: "Pag-IBIG employer share",
      kind: "EMPLOYER_CONTRIBUTION",
      amount: erAllocated,
      taxable: false,
      agency: "PAGIBIG",
    }));
  }

  const totalMonthlyMandatoryEe = monthlySssEe.plus(monthlyPhilHealthEe).plus(monthlyPagIbigEe);
  const allocatedMandatoryEe = totalMonthlyMandatoryEe.isZero()
    ? ZERO
    : employeeDeductions.minus(lateDeduction).minus(undertimeDeduction);
  const regularCashPay = Decimal.max(baseTotal.plus(otherRegularTaxable).minus(lateDeduction).minus(undertimeDeduction), ZERO);
  const supplementaryCashPay = overtimePay.plus(dayPremiumPay).plus(nightDifferential).plus(otherSupplementaryTaxable);
  const taxableRegularCompensation = input.employee.isMinimumWageEarner && input.statutoryRules.bir.minimumWageEarnerTaxExempt
    ? ZERO
    : Decimal.max(regularCashPay.minus(allocatedMandatoryEe), ZERO);
  const taxableSupplementaryCompensation = input.employee.isMinimumWageEarner && input.statutoryRules.bir.minimumWageEarnerTaxExempt
    ? ZERO
    : supplementaryCashPay;
  const taxableIncome = money(taxableRegularCompensation.plus(taxableSupplementaryCompensation));

  let taxWithheld = ZERO;
  if (input.employee.eligible.birCompensationTax) {
    const annualizedTrueUp = calculateAnnualizedTrueUp(input, taxableIncome);
    const cumulativeAverage = calculateCumulativeAverageTax(
      input,
      taxableRegularCompensation,
      taxableSupplementaryCompensation,
    );
    taxWithheld = annualizedTrueUp ?? cumulativeAverage ?? calculateTaxFromBrackets(
      taxableRegularCompensation,
      input.statutoryRules.bir.semiMonthlyBrackets,
    );
    taxWithheld = money(Decimal.max(taxWithheld, ZERO));
    employeeDeductions = employeeDeductions.plus(addDetail(details, {
      code: "BIR_WITHHOLDING",
      label: "BIR compensation tax withheld",
      kind: "DEDUCTION",
      amount: taxWithheld,
      taxable: false,
      agency: "BIR",
      metadata: { basis: "REGULAR_AND_SUPPLEMENTARY" },
    }));
  }

  const fringeBenefit = d(input.fringeBenefits);
  let employerFringeBenefitTax = ZERO;
  if (
    !fringeBenefit.isZero() &&
    input.employee.eligible.fringeBenefitTax &&
    input.employee.workerClass !== "RANK_AND_FILE"
  ) {
    const bir = input.statutoryRules.bir;
    employerFringeBenefitTax = money(
      fringeBenefit.div(d(bir.fringeBenefitTaxGrossUpDivisor)).mul(d(bir.fringeBenefitTaxRate)),
    );
    addDetail(details, {
      code: "BIR_FRINGE_BENEFIT_TAX",
      label: "Fringe Benefits Tax (employer-paid)",
      kind: "EMPLOYER_TAX",
      amount: employerFringeBenefitTax,
      taxable: false,
      agency: "BIR",
    });
  }

  const netPay = money(grossPay.minus(employeeDeductions));
  return {
    currency: "PHP",
    baseCompensation: moneyText(baseCompensation),
    grossPay: moneyText(grossPay),
    taxableIncome: moneyText(taxableIncome),
    regularTaxableCompensation: moneyText(taxableRegularCompensation),
    supplementaryTaxableCompensation: moneyText(taxableSupplementaryCompensation),
    taxWithheld: moneyText(taxWithheld),
    totalEmployeeDeductions: moneyText(employeeDeductions),
    totalEmployerContributions: moneyText(employerContributions),
    employerFringeBenefitTax: moneyText(employerFringeBenefitTax),
    netPay: moneyText(netPay),
    hourlyRate: moneyText(hourlyRate),
    details,
  };
}

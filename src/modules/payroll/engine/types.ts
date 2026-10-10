import type { DecimalInput } from "@/shared/lib/decimal";

export type PayType = "MONTHLY" | "DAILY" | "HOURLY";
export type StatutoryAgency = "SSS" | "PHILHEALTH" | "PAGIBIG" | "BIR";
export type DayType =
  | "ORDINARY"
  | "REST_DAY"
  | "SPECIAL_DAY"
  | "SPECIAL_DAY_REST"
  | "DOUBLE_SPECIAL"
  | "DOUBLE_SPECIAL_REST"
  | "REGULAR_HOLIDAY"
  | "REGULAR_HOLIDAY_REST"
  | "DOUBLE_HOLIDAY"
  | "DOUBLE_HOLIDAY_REST";

export interface EmployeePayrollProfile {
  employeeId: string;
  workerClass: "RANK_AND_FILE" | "MANAGERIAL" | "SUPERVISORY";
  isMinimumWageEarner: boolean;
  eligible: {
    sss: boolean;
    philHealth: boolean;
    pagIbig: boolean;
    overtime: boolean;
    nightDifferential: boolean;
    birCompensationTax: boolean;
    fringeBenefitTax: boolean;
  };
}

export interface PayRate {
  type: PayType;
  monthlyRate?: DecimalInput;
  dailyRate?: DecimalInput;
  hourlyRate?: DecimalInput;
}

export interface PayrollPolicyInput {
  monthlyToDailyDivisor: DecimalInput;
  scheduledHoursPerDay: DecimalInput;
  cutoffCountPerMonth: DecimalInput;
  cutoffNumber: 1 | 2;
}

export type AllocationMode = "FIRST_CUTOFF" | "SECOND_CUTOFF" | "EVEN_SPLIT" | "EXACT_FIRST_CUTOFF_AMOUNT";

export interface ContributionAllocation {
  mode: AllocationMode;
  /** Employee-specific setting takes precedence over the company policy. */
  employeeOverride?: {
    mode: AllocationMode;
    exactFirstCutoffAmount?: DecimalInput;
  };
  exactFirstCutoffAmount?: DecimalInput;
}

export interface SssBracket {
  compensationMin: DecimalInput;
  compensationMax?: DecimalInput;
  monthlySalaryCredit: DecimalInput;
  regularEe: DecimalInput;
  mpfEe: DecimalInput;
  regularEr: DecimalInput;
  mpfEr: DecimalInput;
  ecEr: DecimalInput;
}

export interface SssRules {
  brackets: SssBracket[];
}

export interface PhilHealthRules {
  rate: DecimalInput;
  incomeFloor: DecimalInput;
  incomeCeiling: DecimalInput;
  employeeShare: DecimalInput;
  employerShare: DecimalInput;
}

export interface PagIbigRules {
  salaryCeiling: DecimalInput;
  lowSalaryThreshold: DecimalInput;
  employeeRateAtOrBelowThreshold: DecimalInput;
  employeeRateAboveThreshold: DecimalInput;
  employerRate: DecimalInput;
}

export interface WithholdingTaxBracket {
  minimum: DecimalInput;
  maximum?: DecimalInput;
  baseTax: DecimalInput;
  marginalRate: DecimalInput;
  marginalOver: DecimalInput;
}

export interface AnnualTaxBracket {
  minimum: DecimalInput;
  maximum?: DecimalInput;
  baseTax: DecimalInput;
  marginalRate: DecimalInput;
  marginalOver: DecimalInput;
}

export interface BirRules {
  semiMonthlyBrackets: WithholdingTaxBracket[];
  annualBrackets: AnnualTaxBracket[];
  minimumWageEarnerTaxExempt: boolean;
  regularCompensationThreshold: DecimalInput;
  nonTaxable13thMonthAndBenefitsCap: DecimalInput;
  fringeBenefitTaxRate: DecimalInput;
  fringeBenefitTaxGrossUpDivisor: DecimalInput;
}

export interface StatutoryRules {
  sss: SssRules;
  philHealth: PhilHealthRules;
  pagIbig: PagIbigRules;
  bir: BirRules;
}

export interface PayrollLineInput {
  code: string;
  label: string;
  amount: DecimalInput;
  taxable: boolean;
  compensationClass: "REGULAR" | "SUPPLEMENTARY";
  benefitExemptible?: boolean;
}

export interface WorkSegment {
  dayType: DayType;
  hours: DecimalInput;
  isOvertime: boolean;
  isNightShift: boolean;
}

export interface PriorEmployerTaxData {
  taxableCompensation: DecimalInput;
  taxWithheld: DecimalInput;
}

export interface YearToDateTaxData {
  taxableRegularCompensation: DecimalInput;
  taxableSupplementaryCompensation: DecimalInput;
  taxWithheld: DecimalInput;
  payrollPeriodsElapsed: DecimalInput;
  nonTaxableBenefitAmountToDate?: DecimalInput;
  previousEmployers?: PriorEmployerTaxData[];
}

export interface PayrollCalculationInput {
  employee: EmployeePayrollProfile;
  payRate: PayRate;
  policy: PayrollPolicyInput;
  monthlyContributionBase: DecimalInput;
  /** For monthly employees this is unpaid time/partial-employment days to deduct from monthly/2. */
  unpaidDays: DecimalInput;
  daysWorked: DecimalInput;
  hoursWorked: DecimalInput;
  lateMinutes: DecimalInput;
  undertimeMinutes: DecimalInput;
  workSegments: WorkSegment[];
  otherEarnings?: PayrollLineInput[];
  otherDeductions?: PayrollLineInput[];
  otherEmployerContributions?: PayrollLineInput[];
  fringeBenefits?: DecimalInput;
  contributionAllocations: Partial<Record<string, ContributionAllocation>>;
  statutoryRules: StatutoryRules;
  yearToDateTax?: YearToDateTaxData;
  isFinalPayrollPeriodOfYear?: boolean;
}

export interface SalarySlipDetailResult {
  code: string;
  label: string;
  kind: "EARNING" | "DEDUCTION" | "EMPLOYER_CONTRIBUTION" | "EMPLOYER_TAX";
  amount: string;
  taxable: boolean;
  agency?: StatutoryAgency;
  metadata?: Record<string, string>;
}

export interface PayrollCalculationResult {
  currency: "PHP";
  baseCompensation: string;
  grossPay: string;
  taxableIncome: string;
  regularTaxableCompensation: string;
  supplementaryTaxableCompensation: string;
  taxWithheld: string;
  totalEmployeeDeductions: string;
  totalEmployerContributions: string;
  employerFringeBenefitTax: string;
  netPay: string;
  hourlyRate: string;
  details: SalarySlipDetailResult[];
}

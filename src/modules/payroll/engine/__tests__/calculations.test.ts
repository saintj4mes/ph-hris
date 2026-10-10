import { describe, expect, it } from "vitest";
import { calculatePayroll } from "../calculations";
import { getPublishedPhilippineRules } from "@/modules/statutory/philippine-rules";
import { Decimal } from "@/shared/lib/decimal";
import type { PayrollCalculationInput } from "../types";

function sampleInput(cutoffNumber: 1 | 2 = 1): PayrollCalculationInput {
  return {
    employee: {
      employeeId: "EMP-0001",
      workerClass: "RANK_AND_FILE",
      isMinimumWageEarner: false,
      eligible: {
        sss: true,
        philHealth: true,
        pagIbig: true,
        overtime: true,
        nightDifferential: true,
        birCompensationTax: true,
        fringeBenefitTax: true,
      },
    },
    payRate: { type: "MONTHLY", monthlyRate: "30000" },
    policy: {
      monthlyToDailyDivisor: "26",
      scheduledHoursPerDay: "8",
      cutoffCountPerMonth: "2",
      cutoffNumber,
    },
    monthlyContributionBase: "30000",
    unpaidDays: "0",
    daysWorked: "11",
    hoursWorked: "88",
    lateMinutes: "30",
    undertimeMinutes: "0",
    workSegments: [
      { dayType: "ORDINARY", hours: "1", isOvertime: true, isNightShift: false },
      { dayType: "ORDINARY", hours: "2", isOvertime: false, isNightShift: true },
    ],
    contributionAllocations: {
      SSS: { mode: "FIRST_CUTOFF" },
      SSS_SS: { mode: "FIRST_CUTOFF" },
      SSS_MPF: { mode: "FIRST_CUTOFF" },
      SSS_EC: { mode: "FIRST_CUTOFF" },
      PHILHEALTH: { mode: "FIRST_CUTOFF" },
      PHILHEALTH_ER: { mode: "FIRST_CUTOFF" },
      PAGIBIG: { mode: "FIRST_CUTOFF" },
      PAGIBIG_ER: { mode: "FIRST_CUTOFF" },
    },
    statutoryRules: getPublishedPhilippineRules(),
  };
}

describe("calculatePayroll", () => {
  it("calculates the agreed ₱30,000 monthly first-cutoff scenario exactly to centavos", () => {
    const result = calculatePayroll(sampleInput());
    const byCode = Object.fromEntries(result.details.map((line) => [line.code, line.amount]));

    expect(result.hourlyRate).toBe("144.23");
    expect(result.baseCompensation).toBe("15000.00");
    expect(byCode.OVERTIME).toBe("180.29");
    expect(byCode.NIGHT_DIFFERENTIAL).toBe("28.85");
    expect(byCode.LATE).toBe("72.12");
    expect(byCode.SSS_EE).toBe("1000.00");
    expect(byCode.SSS_MPF_EE).toBe("500.00");
    expect(byCode.PHILHEALTH_EE).toBe("750.00");
    expect(byCode.PAGIBIG_EE).toBe("200.00");
    expect(result.grossPay).toBe("15209.14");
    expect(result.regularTaxableCompensation).toBe("12477.88");
    expect(result.supplementaryTaxableCompensation).toBe("209.14");
    expect(result.taxWithheld).toBe("309.13");
    expect(result.totalEmployeeDeductions).toBe("2831.25");
    expect(result.totalEmployerContributions).toBe("3980.00");
    expect(result.netPay).toBe("12377.89");
  });

  it("reconciles monthly employee contributions across the two cutoffs", () => {
    const first = calculatePayroll(sampleInput(1));
    const second = calculatePayroll(sampleInput(2));
    const contributionCodes = ["SSS_EE", "SSS_MPF_EE", "PHILHEALTH_EE", "PAGIBIG_EE"];

    for (const code of contributionCodes) {
      const firstAmount = new Decimal(first.details.find((line) => line.code === code)?.amount ?? "0");
      const secondAmount = new Decimal(second.details.find((line) => line.code === code)?.amount ?? "0");
      expect(firstAmount.plus(secondAmount).toFixed(2)).toBe(
        ({ SSS_EE: "1000.00", SSS_MPF_EE: "500.00", PHILHEALTH_EE: "750.00", PAGIBIG_EE: "200.00" } as Record<string, string>)[code],
      );
    }
  });
});

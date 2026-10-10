import type { Prisma, PrismaClient } from "@prisma/client";

export interface SalarySlipAmendmentInput {
  correctedTotals: {
    baseCompensation: string;
    overtimePay: string;
    nightDifferential: string;
    otherEarnings: string;
    grossPay: string;
    taxableIncome: string;
    taxWithheld: string;
    totalEmployeeDeductions: string;
    totalEmployerContributions: string;
    netPay: string;
  };
  inputSnapshot: Prisma.InputJsonValue;
  calculationVersion: string;
  details: Array<{
    kind: "EARNING" | "DEDUCTION" | "EMPLOYER_CONTRIBUTION" | "EMPLOYER_TAX";
    code: string;
    label: string;
    amount: string;
    taxable: boolean;
    agency?: "SSS" | "PHILHEALTH" | "PAGIBIG" | "BIR";
  }>;
}

/** Creates a new draft revision linked to the original; the submitted source remains untouched. */
export async function amendFrozenSalarySlipAction(
  database: PrismaClient,
  originalSlipId: string,
  correction: SalarySlipAmendmentInput,
) {
  return database.$transaction(async (transaction) => {
    const original = await transaction.salarySlip.findUnique({
      where: { id: originalSlipId },
      include: { details: true },
    });

    if (!original || !original.isFrozen || !["SUBMITTED", "PAID"].includes(original.status)) {
      throw new Error("An amendment requires a submitted or paid frozen payslip.");
    }

    const latestRevision = await transaction.salarySlip.aggregate({
      where: { payrollRunId: original.payrollRunId, employeeId: original.employeeId },
      _max: { revision: true },
    });

    return transaction.salarySlip.create({
      data: {
        payrollRunId: original.payrollRunId,
        employeeId: original.employeeId,
        amendedFromId: original.id,
        revision: (latestRevision._max.revision ?? original.revision) + 1,
        status: "DRAFT",
        isFrozen: false,
        currency: original.currency,
        ...correction.correctedTotals,
        calculationVersion: correction.calculationVersion,
        inputSnapshot: correction.inputSnapshot,
        details: {
          create: correction.details.map((detail) => ({
            ...detail,
            amount: detail.amount,
          })),
        },
      },
    });
  });
}

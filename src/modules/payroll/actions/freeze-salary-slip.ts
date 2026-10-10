import type { Prisma } from "@prisma/client";

/** Atomically submits and freezes a draft payslip. Frozen rows are never edited in place. */
export async function freezeSalarySlipAction(
  transaction: Prisma.TransactionClient,
  salarySlipId: string,
  submittedAt = new Date(),
): Promise<void> {
  const result = await transaction.salarySlip.updateMany({
    where: { id: salarySlipId, status: "DRAFT", isFrozen: false },
    data: { status: "SUBMITTED", isFrozen: true, submittedAt },
  });

  if (result.count !== 1) {
    throw new Error("Only an unfrozen draft payslip can be submitted.");
  }
}

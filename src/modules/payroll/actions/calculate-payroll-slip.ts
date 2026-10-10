import { calculatePayroll } from "@/modules/payroll/engine";
import type { PayrollCalculationInput } from "@/modules/payroll/engine";

/** Application use case: persistence and authorization remain outside the pure engine. */
export async function calculatePayrollSlipAction(input: PayrollCalculationInput) {
  return calculatePayroll(input);
}

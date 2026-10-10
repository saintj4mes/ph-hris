import { describe, expect, it } from "vitest";
import { evaluatePayrollFormula } from "@/modules/payroll/engine/formula";

describe("evaluatePayrollFormula", () => {
  it("evaluates component formulas with Decimal.js variables", () => {
    expect(evaluatePayrollFormula("1000 + (BASE / 2) * 0.1", { BASE: "1000" }).toFixed(2)).toBe("1050.00");
  });

  it("rejects unknown variables and executable syntax", () => {
    expect(() => evaluatePayrollFormula("UNKNOWN + 1", {})).toThrow("Unknown payroll formula variable");
    expect(() => evaluatePayrollFormula("process.exit()", {})).toThrow("Unsupported character");
    expect(() => evaluatePayrollFormula("2 / 0", {})).toThrow("Division by zero");
  });
});

import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };
export type DecimalInput = Decimal.Value;

export function money(value: DecimalInput): Decimal {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function decimalString(value: Decimal): string {
  return value.toFixed(2);
}

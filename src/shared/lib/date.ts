/** Date helpers operate on calendar dates in UTC to avoid local DST drift. */
export function daysInMonth(year: number, monthOneBased: number): number {
  return new Date(Date.UTC(year, monthOneBased, 0)).getUTCDate();
}

export function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function isDateWithinRange(date: Date, from: Date, to?: Date | null): boolean {
  const value = Date.parse(dateOnly(date));
  const start = Date.parse(dateOnly(from));
  const end = to ? Date.parse(dateOnly(to)) : Number.POSITIVE_INFINITY;
  return value >= start && value <= end;
}

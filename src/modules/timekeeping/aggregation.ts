export type CheckinEvent = { eventAt: Date; logType: "IN" | "OUT" | "UNKNOWN" };
export type AttendanceShift = {
  startTime: string;
  endTime: string;
  scheduledMinutes: number;
  graceMinutes: number;
  breakMinutes: number;
  nightStart: string;
  nightEnd: string;
};

export type AttendanceAggregate = {
  status: "PRESENT" | "ABSENT";
  firstIn: Date | null;
  lastOut: Date | null;
  scheduledMinutes: number;
  workedMinutes: number;
  lateMinutes: number;
  undertimeMinutes: number;
  overtimeMinutes: number;
  nightShiftMinutes: number;
};

function minuteOfDay(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Invalid shift time ${value}. Expected HH:mm.`);
  }
  return hour * 60 + minute;
}

function overlapMinutes(startA: number, endA: number, startB: number, endB: number): number {
  return Math.max(0, Math.min(endA, endB) - Math.max(startA, startB));
}

export function aggregateAttendance(events: CheckinEvent[], workDate: string, shift: AttendanceShift): AttendanceAggregate {
  const dayStart = Date.parse(`${workDate}T00:00:00.000+08:00`);
  if (Number.isNaN(dayStart)) throw new Error("Invalid attendance date.");
  const startMinute = minuteOfDay(shift.startTime);
  const endMinute = minuteOfDay(shift.endTime);
  const shiftEndDayOffset = endMinute <= startMinute ? 1 : 0;
  const scheduledStart = dayStart + startMinute * 60_000;
  const scheduledEnd = dayStart + (endMinute + shiftEndDayOffset * 1440) * 60_000;
  const ordered = [...events].sort((a, b) => a.eventAt.valueOf() - b.eventAt.valueOf());
  const ins: Date[] = [];
  const outs: Date[] = [];
  let currentlyInside = false;
  for (const event of ordered) {
    if (event.logType === "IN" || (event.logType === "UNKNOWN" && !currentlyInside)) {
      ins.push(event.eventAt);
      currentlyInside = true;
    } else if (event.logType === "OUT" || event.logType === "UNKNOWN") {
      outs.push(event.eventAt);
      currentlyInside = false;
    }
  }
  const firstIn = ins.find((event) => event.valueOf() <= scheduledEnd) ?? null;
  const lastOut = [...outs].reverse().find((event) => event.valueOf() >= scheduledStart) ?? null;
  if (!firstIn || !lastOut || lastOut <= firstIn) {
    return { status: "ABSENT", firstIn, lastOut, scheduledMinutes: shift.scheduledMinutes, workedMinutes: 0, lateMinutes: 0, undertimeMinutes: shift.scheduledMinutes, overtimeMinutes: 0, nightShiftMinutes: 0 };
  }

  const spanMinutes = Math.floor((lastOut.valueOf() - firstIn.valueOf()) / 60_000);
  const workedMinutes = Math.max(0, spanMinutes - shift.breakMinutes);
  const graceAdjustedStart = scheduledStart + shift.graceMinutes * 60_000;
  const lateMinutes = Math.max(0, Math.floor((firstIn.valueOf() - graceAdjustedStart) / 60_000));
  const undertimeMinutes = Math.max(0, shift.scheduledMinutes - workedMinutes);
  const overtimeMinutes = Math.max(0, workedMinutes - shift.scheduledMinutes);

  const nightStartMinute = minuteOfDay(shift.nightStart);
  const nightEndMinute = minuteOfDay(shift.nightEnd);
  let nightShiftMinutes = 0;
  for (let offset = -1; offset <= 1; offset += 1) {
    const windowStart = dayStart + (offset * 1440 + nightStartMinute) * 60_000;
    const endOffset = nightEndMinute <= nightStartMinute ? 1 : 0;
    const windowEnd = dayStart + (offset * 1440 + nightEndMinute + endOffset * 1440) * 60_000;
    nightShiftMinutes += overlapMinutes(firstIn.valueOf(), lastOut.valueOf(), windowStart, windowEnd);
  }

  return { status: "PRESENT", firstIn, lastOut, scheduledMinutes: shift.scheduledMinutes, workedMinutes, lateMinutes, undertimeMinutes, overtimeMinutes, nightShiftMinutes: Math.floor(nightShiftMinutes / 60_000) };
}

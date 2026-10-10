import { describe, expect, it } from "vitest";
import { aggregateAttendance } from "@/modules/timekeeping/aggregation";

describe("aggregateAttendance", () => {
  it("calculates late minutes and excludes the unpaid break from a day shift", () => {
    const result = aggregateAttendance([
      { eventAt: new Date("2026-10-10T00:10:00.000Z"), logType: "IN" },
      { eventAt: new Date("2026-10-10T09:00:00.000Z"), logType: "OUT" },
    ], "2026-10-10", {
      startTime: "08:00", endTime: "17:00", scheduledMinutes: 480, graceMinutes: 0, breakMinutes: 60,
      nightStart: "22:00", nightEnd: "06:00",
    });

    expect(result.lateMinutes).toBe(10);
    expect(result.workedMinutes).toBe(470);
    expect(result.undertimeMinutes).toBe(10);
    expect(result.overtimeMinutes).toBe(0);
  });

  it("counts a cross-midnight shift inside the Philippine night window", () => {
    const result = aggregateAttendance([
      { eventAt: new Date("2026-10-10T14:00:00.000Z"), logType: "IN" },
      { eventAt: new Date("2026-10-10T22:00:00.000Z"), logType: "OUT" },
    ], "2026-10-10", {
      startTime: "22:00", endTime: "06:00", scheduledMinutes: 480, graceMinutes: 0, breakMinutes: 0,
      nightStart: "22:00", nightEnd: "06:00",
    });

    expect(result.workedMinutes).toBe(480);
    expect(result.nightShiftMinutes).toBe(480);
  });
});

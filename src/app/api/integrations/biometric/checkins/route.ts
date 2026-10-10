import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";

export const runtime = "nodejs";

type BiometricEvent = { employeeNumber: string; companyId: string; externalId: string; occurredAt: string; logType: "IN" | "OUT" | "UNKNOWN"; deviceId?: string; latitude?: number; longitude?: number };

function authorize(request: Request): boolean {
  const secret = process.env.BIOMETRIC_WEBHOOK_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!secret || !supplied) return false;
  const expected = createHmac("sha256", secret).update("biometric-webhook").digest();
  const received = createHmac("sha256", supplied).update("biometric-webhook").digest();
  return timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  if (!authorize(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let events: BiometricEvent[];
  try {
    const body = await request.json() as { events?: BiometricEvent[] };
    events = body.events ?? [];
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!Array.isArray(events) || events.length === 0 || events.length > 500) return NextResponse.json({ error: "Provide between 1 and 500 check-in events." }, { status: 400 });

  const accepted: string[] = [];
  const rejected: Array<{ externalId: string; reason: string }> = [];
  for (const event of events) {
    if (!event.companyId || !event.employeeNumber || !event.externalId || !event.occurredAt || !["IN", "OUT", "UNKNOWN"].includes(event.logType)) {
      rejected.push({ externalId: event.externalId ?? "", reason: "Missing or invalid event fields." });
      continue;
    }
    const eventAt = new Date(event.occurredAt);
    if (Number.isNaN(eventAt.valueOf())) { rejected.push({ externalId: event.externalId, reason: "Invalid event timestamp." }); continue; }
    const employee = await prisma.employee.findFirst({ where: { employeeNumber: event.employeeNumber, companyId: event.companyId } });
    if (!employee) { rejected.push({ externalId: event.externalId, reason: "Employee was not found for this company." }); continue; }
    try {
      await prisma.$transaction(async (tx) => {
        const log = await tx.employeeCheckin.create({
          data: {
            employeeId: employee.id,
            eventAt,
            logType: event.logType,
            source: "BIOMETRIC_WEBHOOK",
            externalId: event.externalId,
            deviceId: event.deviceId,
            latitude: event.latitude === undefined ? undefined : new Prisma.Decimal(event.latitude),
            longitude: event.longitude === undefined ? undefined : new Prisma.Decimal(event.longitude),
            rawPayload: event as unknown as Prisma.InputJsonValue,
          },
        });
        await tx.integrationEvent.create({ data: { eventType: "BIOMETRIC_CHECKIN_RECEIVED", idempotencyKey: event.externalId, status: "SUCCEEDED", payload: event as unknown as Prisma.InputJsonValue, result: { checkinId: log.id }, processedAt: new Date() } });
      });
      accepted.push(event.externalId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") rejected.push({ externalId: event.externalId, reason: "Duplicate external event." });
      else rejected.push({ externalId: event.externalId, reason: "Event could not be saved." });
    }
  }
  return NextResponse.json({ accepted, rejected }, { status: rejected.length ? 207 : 202 });
}

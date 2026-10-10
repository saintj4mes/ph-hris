import { NextResponse } from "next/server";
import { clearUserSession } from "@/shared/platform/auth";

export async function POST() {
  await clearUserSession();
  return NextResponse.json({ ok: true });
}

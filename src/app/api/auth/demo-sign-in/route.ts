import { NextRequest, NextResponse } from "next/server";
import { authenticateDemoAccount } from "@/shared/demo/auth";
import { setUserSession } from "@/shared/platform/auth";

export async function POST(request: NextRequest) {
  if ((process.env.APP_MODE ?? "DEV").trim().toUpperCase() !== "DEV") {
    return NextResponse.json({ ok: false, message: "Demo sign-in is available only in DEV mode." }, { status: 404 });
  }

  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const account = authenticateDemoAccount(email, password);
  if (!account) return NextResponse.json({ ok: false, message: "Email or password is incorrect." }, { status: 401 });

  await setUserSession(account === "admin" ? "demo-admin" : "demo-employee");
  return NextResponse.json({ ok: true, redirectTo: account === "admin" ? "/dashboard" : "/" });
}

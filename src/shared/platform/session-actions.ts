"use server";

import { Prisma } from "@prisma/client";
import { authenticateDemoAccount } from "@/shared/demo/auth";
import { clearUserSession, getDemoUserForSignIn, setUserSession, verifyPassword } from "@/shared/platform/auth";

export async function signInAction(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return { ok: false as const, message: "Enter your email and password." };
  if ((process.env.APP_MODE ?? "DEV").trim().toUpperCase() === "DEV") {
    const account = authenticateDemoAccount(normalizedEmail, password);
    const user = getDemoUserForSignIn(normalizedEmail);
    if (!user || !account) return { ok: false as const, message: "Email or password is incorrect." };
    await setUserSession(user.id);
    const canUseAdmin = user.roles.some(({ role }) => role.grants.some(({ permission }) => permission.resource === "*"));
    return { ok: true as const, redirectTo: canUseAdmin ? "/dashboard" : "/" };
  }
  try {
    const { prisma } = await import("@/shared/db/prisma");
    const user = await prisma.authUser.findUnique({ where: { email: normalizedEmail }, include: { roles: { include: { role: { include: { grants: { include: { permission: true } } } } } } } });
    if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
      return { ok: false as const, message: "Email or password is incorrect." };
    }
    await prisma.authUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await setUserSession(user.id);
    const canUseAdmin = user.roles.some(({ role }) => role.grants.some(({ permission }) => permission.resource === "*" || ["employee", "payroll", "leave", "attendance", "company", "loan", "advance", "employee_grievance", "full_and_final"].includes(permission.resource)));
    return { ok: true as const, redirectTo: canUseAdmin ? "/dashboard" : "/" };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) return { ok: false as const, message: "The PostgreSQL database is unavailable. Check APP_MODE and DATABASE_URL." };
    throw error;
  }
}

export async function signOutAction() {
  await clearUserSession();
  return { ok: true as const };
}

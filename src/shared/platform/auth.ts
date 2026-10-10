import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export { hashPassword } from "@/shared/platform/password";

const SESSION_COOKIE = "phhris_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  return value;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

type SessionClaims = { userId: string; expiresAt: number };

type SessionUser = {
  id: string;
  displayName: string;
  email: string;
  active: boolean;
  employeeId: string | null;
  employee: { companyId: string; department: { name: string } | null } | null;
  roles: Array<{ role: { grants: Array<{ permission: { resource: string; action: string } }> } }>;
};

function demoUser(userId: string): SessionUser | null {
  const adminEmail = process.env.DEMO_HR_ADMIN_EMAIL?.trim().toLowerCase();
  const employeeEmail = process.env.DEMO_EMPLOYEE_EMAIL?.trim().toLowerCase();
  if (userId === "demo-admin" && adminEmail) {
    return {
      id: userId, displayName: "Alex HR Admin", email: adminEmail, active: true, employeeId: "demo-employee-admin",
      employee: { companyId: "demo-company", department: { name: "People Operations" } },
      roles: [{ role: { grants: [{ permission: { resource: "*", action: "*" } }] } }],
    };
  }
  if (userId === "demo-employee" && employeeEmail) {
    return {
      id: userId, displayName: "Maria Santos", email: employeeEmail, active: true, employeeId: "demo-employee-staff",
      employee: { companyId: "demo-company", department: { name: "People Operations" } }, roles: [{ role: { grants: [] } }],
    };
  }
  return null;
}

function encodeSession(claims: SessionClaims): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string): SessionClaims | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionClaims;
    return claims.userId && claims.expiresAt > Date.now() ? claims : null;
  } catch {
    return null;
  }
}

export async function setUserSession(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, encodeSession({ userId, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearUserSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const claims = decodeSession(token);
  if (!claims) return null;

  if ((process.env.APP_MODE ?? "DEV").trim().toUpperCase() === "DEV") return demoUser(claims.userId);

  const { prisma } = await import("@/shared/db/prisma");
  return prisma.authUser.findFirst({
    where: { id: claims.userId, active: true },
    include: {
      employee: { include: { department: true } },
      roles: { include: { role: { include: { grants: { include: { permission: true } } } } } },
    },
  });
}

export function getDemoUserForSignIn(email: string): SessionUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === process.env.DEMO_HR_ADMIN_EMAIL?.trim().toLowerCase()) return demoUser("demo-admin");
  if (normalizedEmail === process.env.DEMO_EMPLOYEE_EMAIL?.trim().toLowerCase()) return demoUser("demo-employee");
  return null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required.");
  return user;
}

export async function requirePermission(resource: string, action: string) {
  const user = await requireUser();
  const allowed = user.roles.some(({ role }) => role.grants.some(({ permission }) =>
    (permission.resource === resource || permission.resource === "*") && (permission.action === action || permission.action === "*"),
  ));
  if (!allowed) throw new Error(`Missing permission: ${resource}:${action}`);
  return user;
}

export { verifyPassword } from "@/shared/platform/password";

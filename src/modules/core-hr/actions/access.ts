"use server";

import { hashPassword, requirePermission } from "@/shared/platform/auth";
import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";

/** First-run admin is enabled only when no account exists; values come from server environment. */
export async function bootstrapFirstAdministratorAction() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const displayName = process.env.BOOTSTRAP_ADMIN_NAME ?? "System Administrator";
  if (!email || !password) throw new Error("Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD for first-run setup.");

  return prisma.$transaction(async (tx) => {
    if (await tx.authUser.count()) throw new Error("Initial administrator can only be created before the first user account.");
    const role = await tx.role.create({ data: { code: "SYSTEM_ADMIN", label: "System Administrator", system: true } });
    await tx.role.create({ data: { code: "EMPLOYEE", label: "Employee self-service", description: "Employee portal access without administrative permissions.", system: true } });
    const permission = await tx.permission.create({ data: { resource: "*", action: "*", description: "Full access to the HRMS platform." } });
    await tx.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } });
    const user = await tx.authUser.create({ data: { email, displayName, passwordHash: await hashPassword(password) } });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await recordAudit(tx, { actorUserId: user.id, entityType: "AuthUser", entityId: user.id, action: "BOOTSTRAP_ADMIN" });
    return { id: user.id, email: user.email };
  });
}

export async function inviteUserAction(input: { email: string; displayName: string; employeeId?: string; temporaryPassword: string; roleId: string }) {
  const actor = await requirePermission("user", "create");
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@") || input.displayName.trim().length < 2) throw new Error("Enter a valid email and display name.");
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.authUser.create({
      data: {
        email,
        displayName: input.displayName.trim(),
        employeeId: input.employeeId || null,
        passwordHash: await hashPassword(input.temporaryPassword),
        roles: { create: { roleId: input.roleId } },
      },
    });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "AuthUser", entityId: created.id, action: "CREATE", after: { email: created.email, roleId: input.roleId } });
    return created;
  });
  return { id: user.id, email: user.email };
}

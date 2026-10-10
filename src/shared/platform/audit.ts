import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";

type Db = PrismaClient | Prisma.TransactionClient;

export async function recordAudit(
  db: Db,
  input: { actorUserId?: string | null; entityType: string; entityId: string; action: string; before?: Prisma.InputJsonValue; after?: Prisma.InputJsonValue },
) {
  return db.auditEvent.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      before: input.before,
      after: input.after,
    },
  });
}

export async function notifyUser(input: { recipientId: string; category: string; title: string; body: string; actionUrl?: string }) {
  return prisma.notification.create({ data: input });
}

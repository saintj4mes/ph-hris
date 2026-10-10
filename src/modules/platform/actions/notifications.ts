"use server";

import { prisma } from "@/shared/db/prisma";
import { requireUser } from "@/shared/platform/auth";

export async function markMyNotificationReadAction(notificationId: string) {
  const user = await requireUser();
  return prisma.notification.updateMany({ where: { id: notificationId, recipientId: user.id, readAt: null }, data: { readAt: new Date() } });
}

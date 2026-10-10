import type { Prisma } from "@prisma/client";
import { recordAudit } from "@/shared/platform/audit";

export type WorkflowTransition = "SUBMIT" | "APPROVE" | "REJECT" | "CANCEL";

const transitions: Record<string, Partial<Record<WorkflowTransition, string>>> = {
  DRAFT: { SUBMIT: "PENDING", CANCEL: "CANCELLED" },
  OPEN: { APPROVE: "APPROVED", REJECT: "REJECTED", CANCEL: "CANCELLED" },
  PENDING: { APPROVE: "APPROVED", REJECT: "REJECTED", CANCEL: "CANCELLED" },
  APPROVED: { CANCEL: "CANCELLED" },
};

export function nextWorkflowStatus(current: string, action: WorkflowTransition): string {
  const next = transitions[current]?.[action];
  if (!next) throw new Error(`Cannot ${action.toLowerCase()} a ${current.toLowerCase()} record.`);
  return next;
}

export async function recordWorkflowAction(
  tx: Prisma.TransactionClient,
  input: { requestId: string; actorUserId: string; step: number; action: WorkflowTransition; comment?: string },
) {
  const current = await tx.approvalRequest.findUnique({ where: { id: input.requestId } });
  if (!current) throw new Error("Approval request not found.");
  const status = nextWorkflowStatus(current.status, input.action) as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  await tx.approvalAction.create({
    data: { approvalRequestId: current.id, actorUserId: input.actorUserId, step: input.step, action: input.action, comment: input.comment },
  });
  const request = await tx.approvalRequest.update({
    where: { id: current.id },
    data: { status, completedAt: status === "APPROVED" || status === "REJECTED" || status === "CANCELLED" ? new Date() : null },
  });
  await recordAudit(tx, {
    actorUserId: input.actorUserId,
    entityType: current.requestType,
    entityId: current.documentId,
    action: input.action,
    before: { status: current.status },
    after: { status },
  });
  return request;
}

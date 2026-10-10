"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission, requireUser } from "@/shared/platform/auth";

export async function createMyExpenseClaimAction(input: { claimDate: string; purpose: string; details: Array<{ expenseTypeId: string; expenseDate: string; description: string; amount: string; receiptUrl?: string }> }) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  if (input.details.length === 0) throw new Error("Add at least one expense line.");
  const total = input.details.reduce((sum, line) => sum.plus(new Prisma.Decimal(line.amount)), new Prisma.Decimal(0));
  if (total.lessThanOrEqualTo(0)) throw new Error("Expense claim total must be greater than zero.");
  const claimDate = new Date(`${input.claimDate}T00:00:00.000Z`);
  return prisma.$transaction(async (tx) => {
    const claim = await tx.expenseClaim.create({
      data: {
        employeeId: user.employeeId!,
        claimDate,
        purpose: input.purpose.trim(),
        totalAmount: total,
        details: { create: input.details.map((line) => ({ ...line, expenseDate: new Date(`${line.expenseDate}T00:00:00.000Z`), amount: new Prisma.Decimal(line.amount), receiptUrl: line.receiptUrl || null })) },
      },
    });
    await recordAudit(tx, { actorUserId: user.id, entityType: "ExpenseClaim", entityId: claim.id, action: "CREATE", after: { totalAmount: total.toFixed(2), lineCount: input.details.length } });
    return claim;
  });
}

export async function submitExpenseClaimAction(claimId: string) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const employeeId = user.employeeId;
  return prisma.$transaction(async (tx) => {
    const claim = await tx.expenseClaim.findFirst({ where: { id: claimId, employeeId, status: "DRAFT" }, include: { details: true } });
    if (!claim || !claim.details.length) throw new Error("A draft claim with at least one line is required.");
    if (claim.details.some((line) => !line.receiptUrl)) throw new Error("Attach a receipt to every expense line before submitting.");
    const saved = await tx.expenseClaim.update({ where: { id: claim.id }, data: { status: "SUBMITTED", submittedAt: new Date() } });
    await tx.approvalRequest.create({ data: { requestType: "EXPENSE_CLAIM", documentId: claim.id, submittedById: user.id } });
    await recordAudit(tx, { actorUserId: user.id, entityType: "ExpenseClaim", entityId: claim.id, action: "SUBMIT", before: { status: "DRAFT" }, after: { status: "SUBMITTED" } });
    return saved;
  });
}

export async function reviewExpenseClaimAction(input: { claimId: string; approve: boolean; approvedAmount?: string; comment?: string }) {
  const actor = await requirePermission("expense", "approve");
  return prisma.$transaction(async (tx) => {
    const claim = await tx.expenseClaim.findFirst({ where: { id: input.claimId, status: "SUBMITTED" }, include: { employee: { include: { authUser: true } } } });
    if (!claim) throw new Error("Only submitted expense claims can be reviewed.");
    const approvedAmount = input.approvedAmount ? new Prisma.Decimal(input.approvedAmount) : claim.totalAmount;
    if (input.approve && (approvedAmount.lessThan(0) || approvedAmount.greaterThan(claim.totalAmount))) throw new Error("Approved amount must be between zero and the claim total.");
    const status = input.approve ? "APPROVED" : "REJECTED";
    const updated = await tx.expenseClaim.update({ where: { id: claim.id }, data: { status, approvedAmount: input.approve ? approvedAmount : null, reviewerId: actor.id, reviewedAt: new Date() } });
    await tx.approvalRequest.updateMany({ where: { requestType: "EXPENSE_CLAIM", documentId: claim.id, status: "PENDING" }, data: { status, completedAt: new Date() } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "ExpenseClaim", entityId: claim.id, action: input.approve ? "APPROVE" : "REJECT", before: { status: "SUBMITTED" }, after: { status, approvedAmount: input.approve ? approvedAmount.toFixed(2) : null, comment: input.comment ?? null } });
    if (claim.employee.authUser) await tx.notification.create({ data: { recipientId: claim.employee.authUser.id, category: "EXPENSE", title: `Expense claim ${status.toLowerCase()}`, body: input.comment?.trim() || `Your claim was ${status.toLowerCase()}.`, actionUrl: "/portal/expenses" } });
    return updated;
  });
}

export async function markExpenseClaimPaidAction(claimId: string) {
  const actor = await requirePermission("expense", "pay");
  return prisma.$transaction(async (tx) => {
    const claim = await tx.expenseClaim.findFirst({ where: { id: claimId, status: "APPROVED" }, include: { employee: { include: { authUser: true } } } });
    if (!claim || !claim.approvedAmount) throw new Error("Only an approved claim with a reimbursement amount can be paid.");
    const updated = await tx.expenseClaim.update({ where: { id: claim.id }, data: { status: "PAID", paidAt: new Date() } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "ExpenseClaim", entityId: claim.id, action: "PAY", before: { status: "APPROVED" }, after: { status: "PAID", paidAmount: claim.approvedAmount.toFixed(2) } });
    if (claim.employee.authUser) await tx.notification.create({ data: { recipientId: claim.employee.authUser.id, category: "EXPENSE", title: "Expense reimbursement paid", body: `₱${claim.approvedAmount.toFixed(2)} was marked as paid.`, actionUrl: "/portal/expenses" } });
    return updated;
  });
}

export async function listExpenseClaimsAction(status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PARTIALLY_PAID" | "PAID" | "CANCELLED") {
  await requirePermission("expense", "read");
  return prisma.expenseClaim.findMany({ where: status ? { status } : {}, include: { employee: { include: { department: true } }, details: { include: { expenseType: true } } }, orderBy: [{ claimDate: "desc" }, { createdAt: "desc" }] });
}

"use server";

import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission } from "@/shared/platform/auth";

export async function createJournalAccountAction(input: { companyId: string; code: string; name: string; accountType: string }) {
  const actor = await requirePermission("journal_account", "create");
  const code = input.code.trim().toUpperCase();
  if (!code || input.name.trim().length < 2 || input.accountType.trim().length < 2) throw new Error("Account code, name, and type are required.");
  return prisma.$transaction(async (tx) => {
    const account = await tx.journalAccount.create({ data: { companyId: input.companyId, code, name: input.name.trim(), accountType: input.accountType.trim().toUpperCase() } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "JournalAccount", entityId: account.id, action: "CREATE", after: { code, name: account.name, accountType: account.accountType } });
    return account;
  });
}

export async function savePayrollPostingRuleAction(input: { companyId: string; lineCode: string; behavior: "DEBIT" | "CREDIT" | "BOTH"; debitAccountId?: string; creditAccountId?: string }) {
  const actor = await requirePermission("payroll_configuration", "manage");
  const lineCode = input.lineCode.trim().toUpperCase();
  if (!lineCode || (!input.debitAccountId && !input.creditAccountId)) throw new Error("Select a payroll line and at least one posting account.");
  const accounts = await prisma.journalAccount.findMany({ where: { companyId: input.companyId, id: { in: [input.debitAccountId, input.creditAccountId].filter((id): id is string => Boolean(id)) }, active: true }, select: { id: true } });
  if (accounts.length !== new Set([input.debitAccountId, input.creditAccountId].filter(Boolean)).size) throw new Error("Posting accounts must be active and belong to the selected company.");
  return prisma.$transaction(async (tx) => {
    const rule = await tx.payrollPostingRule.upsert({ where: { companyId_lineCode: { companyId: input.companyId, lineCode } }, update: { behavior: input.behavior, debitAccountId: input.debitAccountId || null, creditAccountId: input.creditAccountId || null }, create: { companyId: input.companyId, lineCode, behavior: input.behavior, debitAccountId: input.debitAccountId || null, creditAccountId: input.creditAccountId || null } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "PayrollPostingRule", entityId: rule.id, action: "CONFIGURE", after: { lineCode, behavior: input.behavior, debitAccountId: input.debitAccountId ?? null, creditAccountId: input.creditAccountId ?? null } });
    return rule;
  });
}

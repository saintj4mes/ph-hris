"use server";

import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission } from "@/shared/platform/auth";

export async function createCompanyAction(input: { name: string; legalName?: string; tin?: string }) {
  const actor = await requirePermission("company", "create");
  if (input.name.trim().length < 2) throw new Error("Company name is required.");
  return prisma.$transaction(async (tx) => {
    const company = await tx.company.create({ data: { name: input.name.trim(), legalName: input.legalName?.trim() || null, tin: input.tin?.trim() || null, payrollPolicy: { create: { contributionAllocations: { create: [
      { agency: "SSS", contributionProgram: "SS", mode: "EVEN_SPLIT", effectiveFrom: new Date("2000-01-01T00:00:00.000Z") },
      { agency: "SSS", contributionProgram: "MPF_WISP", mode: "EVEN_SPLIT", effectiveFrom: new Date("2000-01-01T00:00:00.000Z") },
      { agency: "SSS", contributionProgram: "EC", mode: "EVEN_SPLIT", effectiveFrom: new Date("2000-01-01T00:00:00.000Z") },
      { agency: "PHILHEALTH", contributionProgram: "PHILHEALTH", mode: "EVEN_SPLIT", effectiveFrom: new Date("2000-01-01T00:00:00.000Z") },
      { agency: "PHILHEALTH", contributionProgram: "PHILHEALTH_ER", mode: "EVEN_SPLIT", effectiveFrom: new Date("2000-01-01T00:00:00.000Z") },
      { agency: "PAGIBIG", contributionProgram: "PAGIBIG", mode: "EVEN_SPLIT", effectiveFrom: new Date("2000-01-01T00:00:00.000Z") },
      { agency: "PAGIBIG", contributionProgram: "PAGIBIG_ER", mode: "EVEN_SPLIT", effectiveFrom: new Date("2000-01-01T00:00:00.000Z") },
    ] } } } } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "Company", entityId: company.id, action: "CREATE", after: { name: company.name, legalName: company.legalName } });
    return company;
  });
}

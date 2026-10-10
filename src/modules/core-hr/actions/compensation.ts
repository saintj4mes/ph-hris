"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission } from "@/shared/platform/auth";

export async function createSalaryComponentAction(input: { companyId: string; code: string; name: string; kind: "EARNING" | "DEDUCTION" | "EMPLOYER_CONTRIBUTION"; formula?: string; taxable: boolean; compensationClass?: "REGULAR" | "SUPPLEMENTARY"; statutoryAgency?: "SSS" | "PHILHEALTH" | "PAGIBIG" | "BIR" }) {
  const actor = await requirePermission("salary_component", "create");
  const component = await prisma.salaryComponent.create({ data: { companyId: input.companyId, code: input.code.trim().toUpperCase(), name: input.name.trim(), kind: input.kind, formula: input.formula?.trim() || null, taxable: input.taxable, compensationClass: input.compensationClass ?? "REGULAR", statutoryAgency: input.statutoryAgency } });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "SalaryComponent", entityId: component.id, action: "CREATE", after: { code: component.code, kind: component.kind, formula: component.formula } });
  return component;
}

export async function createSalaryStructureAction(input: { companyId: string; code: string; name: string; payFrequency: string; components: Array<{ componentId: string; amount?: string; formulaOverride?: string; displayOrder: number }> }) {
  const actor = await requirePermission("salary_structure", "create");
  if (!input.components.length) throw new Error("A salary structure needs at least one component.");
  const structure = await prisma.salaryStructure.create({
    data: {
      companyId: input.companyId,
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      payFrequency: input.payFrequency,
      components: { create: input.components.map((component) => ({ salaryComponentId: component.componentId, amount: component.amount ? new Prisma.Decimal(component.amount) : null, formulaOverride: component.formulaOverride?.trim() || null, displayOrder: component.displayOrder })) },
    },
  });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "SalaryStructure", entityId: structure.id, action: "CREATE", after: { code: structure.code, componentCount: input.components.length } });
  return structure;
}

export async function createBaseSalaryStructureAction(input: { companyId: string; code: string; name: string }) {
  const actor = await requirePermission("salary_structure", "create");
  const code = input.code.trim().toUpperCase();
  if (!code || input.name.trim().length < 2) throw new Error("Enter a salary structure code and name.");
  return prisma.$transaction(async (tx) => {
    const component = await tx.salaryComponent.upsert({
      where: { companyId_code: { companyId: input.companyId, code: "BASE_COMPENSATION" } },
      update: {},
      create: { companyId: input.companyId, code: "BASE_COMPENSATION", name: "Base Compensation", kind: "EARNING", taxable: true, recurring: true },
    });
    const structure = await tx.salaryStructure.create({
      data: { companyId: input.companyId, code, name: input.name.trim(), payFrequency: "SEMI_MONTHLY", components: { create: { salaryComponentId: component.id, displayOrder: 1 } } },
    });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "SalaryStructure", entityId: structure.id, action: "CREATE_BASE_STRUCTURE", after: { code, name: structure.name } });
    return structure;
  });
}

export async function addSalaryStructureComponentAction(input: { salaryStructureId: string; code: string; name: string; kind: "EARNING" | "DEDUCTION" | "EMPLOYER_CONTRIBUTION"; amount?: string; formula?: string; taxable: boolean; compensationClass: "REGULAR" | "SUPPLEMENTARY"; benefitExemptible: boolean }) {
  const actor = await requirePermission("salary_component", "create");
  const code = input.code.trim().toUpperCase();
  if (!code || input.name.trim().length < 2 || (!input.amount && !input.formula)) throw new Error("Enter a code, name, and either an amount or formula.");
  return prisma.$transaction(async (tx) => {
    const structure = await tx.salaryStructure.findUniqueOrThrow({ where: { id: input.salaryStructureId } });
    const component = await tx.salaryComponent.create({ data: { companyId: structure.companyId, code, name: input.name.trim(), kind: input.kind, formula: input.formula?.trim() || null, taxable: input.taxable, compensationClass: input.compensationClass, is13thMonthOrDeMinimisBenefit: input.benefitExemptible, recurring: true } });
    const row = await tx.salaryStructureComponent.create({ data: { salaryStructureId: structure.id, salaryComponentId: component.id, amount: input.amount ? new Prisma.Decimal(input.amount) : null, displayOrder: 10 } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "SalaryStructureComponent", entityId: row.id, action: "ADD_COMPONENT", after: { structureId: structure.id, code, kind: input.kind, amount: input.amount ?? null, formula: input.formula ?? null } });
    return row;
  });
}

export async function assignCompensationAction(input: { employeeId: string; salaryStructureId: string; payType: "MONTHLY" | "DAILY" | "HOURLY"; monthlyRate?: string; dailyRate?: string; hourlyRate?: string; effectiveFrom: string; effectiveTo?: string }) {
  const actor = await requirePermission("salary_assignment", "create");
  const effectiveFrom = new Date(`${input.effectiveFrom}T00:00:00.000Z`);
  const effectiveTo = input.effectiveTo ? new Date(`${input.effectiveTo}T00:00:00.000Z`) : null;
  if (effectiveTo && effectiveTo < effectiveFrom) throw new Error("Compensation end date must follow its effective date.");
  const rates = { monthlyRate: input.monthlyRate, dailyRate: input.dailyRate, hourlyRate: input.hourlyRate };
  const rateKey: Record<typeof input.payType, keyof typeof rates> = { MONTHLY: "monthlyRate", DAILY: "dailyRate", HOURLY: "hourlyRate" };
  if (!rates[rateKey[input.payType]]) throw new Error(`Enter the contracted ${input.payType.toLowerCase()} rate.`);
  return prisma.$transaction(async (tx) => {
    const employee = await tx.employee.findUniqueOrThrow({ where: { id: input.employeeId } });
    const overlap = await tx.salaryAssignment.findFirst({ where: { employeeId: employee.id, effectiveFrom: { lte: effectiveTo ?? new Date("9999-12-31T00:00:00.000Z") }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveFrom } }] }, orderBy: { effectiveFrom: "desc" } });
    if (overlap && overlap.effectiveFrom >= effectiveFrom) throw new Error("A salary assignment already starts within this effective period.");
    if (overlap) await tx.salaryAssignment.update({ where: { id: overlap.id }, data: { effectiveTo: new Date(effectiveFrom.valueOf() - 86_400_000) } });
    const assignment = await tx.salaryAssignment.create({
      data: {
        employeeId: employee.id,
        companyId: employee.companyId,
        salaryStructureId: input.salaryStructureId,
        payType: input.payType,
        monthlyRate: input.monthlyRate ? new Prisma.Decimal(input.monthlyRate) : null,
        dailyRate: input.dailyRate ? new Prisma.Decimal(input.dailyRate) : null,
        hourlyRate: input.hourlyRate ? new Prisma.Decimal(input.hourlyRate) : null,
        effectiveFrom,
        effectiveTo,
        createdBy: actor.id,
      },
    });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "SalaryAssignment", entityId: assignment.id, action: "ASSIGN", after: { employeeId: employee.id, salaryStructureId: input.salaryStructureId, effectiveFrom: input.effectiveFrom, monthlyRate: input.monthlyRate ?? null, dailyRate: input.dailyRate ?? null, hourlyRate: input.hourlyRate ?? null } });
    return assignment;
  }, { isolationLevel: "Serializable" });
}

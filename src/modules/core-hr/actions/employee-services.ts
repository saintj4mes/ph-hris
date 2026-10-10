"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission, requireUser } from "@/shared/platform/auth";

export async function saveEmployeeAddressAction(input: { employeeId: string; label: string; line1: string; line2?: string; barangay?: string; city: string; province: string; postalCode?: string }) {
  const actor = await requirePermission("employee", "update");
  const employee = await prisma.employee.findUniqueOrThrow({ where: { id: input.employeeId }, select: { id: true } });
  if (input.line1.trim().length < 2 || input.city.trim().length < 2 || input.province.trim().length < 2) throw new Error("Address, city, and province are required.");
  return prisma.$transaction(async (tx) => {
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    await tx.employeeAddress.updateMany({ where: { employeeId: employee.id, isPrimary: true, effectiveTo: null }, data: { isPrimary: false, effectiveTo: today } });
    const address = await tx.employeeAddress.create({ data: { employeeId: employee.id, label: input.label.trim() || "HOME", line1: input.line1.trim(), line2: input.line2?.trim() || null, barangay: input.barangay?.trim() || null, city: input.city.trim(), province: input.province.trim(), postalCode: input.postalCode?.trim() || null, isPrimary: true, effectiveFrom: today } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "EmployeeAddress", entityId: address.id, action: "SET_PRIMARY", after: { employeeId: employee.id, city: address.city, province: address.province } });
    return address;
  });
}

export async function saveEmergencyContactAction(input: { employeeId: string; name: string; relationship: string; phone: string; email?: string }) {
  const actor = await requirePermission("employee", "update");
  if (input.name.trim().length < 2 || input.relationship.trim().length < 2 || input.phone.trim().length < 5) throw new Error("Name, relationship, and a valid phone number are required.");
  return prisma.$transaction(async (tx) => {
    await tx.emergencyContact.updateMany({ where: { employeeId: input.employeeId, isPrimary: true }, data: { isPrimary: false } });
    const contact = await tx.emergencyContact.create({ data: { employeeId: input.employeeId, name: input.name.trim(), relationship: input.relationship.trim(), phone: input.phone.trim(), email: input.email?.trim().toLowerCase() || null, isPrimary: true } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "EmergencyContact", entityId: contact.id, action: "SET_PRIMARY", after: { employeeId: input.employeeId, relationship: contact.relationship } });
    return contact;
  });
}

export async function assignEmployeeBenefitAction(input: { employeeId: string; benefitType: string; provider?: string; coverage?: string; amount?: string; taxable: boolean; effectiveFrom: string; effectiveTo?: string }) {
  const actor = await requirePermission("employee_benefit", "create");
  const effectiveFrom = new Date(`${input.effectiveFrom}T00:00:00.000Z`);
  const effectiveTo = input.effectiveTo ? new Date(`${input.effectiveTo}T00:00:00.000Z`) : null;
  const amount = input.amount ? new Prisma.Decimal(input.amount) : null;
  if (input.benefitType.trim().length < 2 || Number.isNaN(effectiveFrom.valueOf()) || (effectiveTo && (Number.isNaN(effectiveTo.valueOf()) || effectiveTo < effectiveFrom)) || (amount && amount.lt(0))) throw new Error("Enter a valid benefit, effective date, and amount.");
  const benefit = await prisma.employeeBenefit.create({ data: { employeeId: input.employeeId, benefitType: input.benefitType.trim(), provider: input.provider?.trim() || null, coverage: input.coverage?.trim() || null, amount, taxable: input.taxable, effectiveFrom, effectiveTo } });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "EmployeeBenefit", entityId: benefit.id, action: "ASSIGN", after: { employeeId: input.employeeId, benefitType: benefit.benefitType, taxable: benefit.taxable } });
  return benefit;
}

export async function recordEmployeeSkillAction(input: { employeeId: string; skill: string; proficiency?: string; notes?: string; assessedAt?: string; expiresAt?: string }) {
  const actor = await requirePermission("employee", "update");
  const skill = input.skill.trim();
  if (skill.length < 2) throw new Error("Skill name is required.");
  const assessedAt = input.assessedAt ? new Date(`${input.assessedAt}T00:00:00.000Z`) : null;
  const expiresAt = input.expiresAt ? new Date(`${input.expiresAt}T00:00:00.000Z`) : null;
  if ((assessedAt && Number.isNaN(assessedAt.valueOf())) || (expiresAt && Number.isNaN(expiresAt.valueOf())) || (assessedAt && expiresAt && expiresAt < assessedAt)) throw new Error("Enter valid skill assessment dates.");
  const record = await prisma.employeeSkillRecord.upsert({
    where: { employeeId_skill: { employeeId: input.employeeId, skill } },
    update: { proficiency: input.proficiency?.trim() || null, notes: input.notes?.trim() || null, assessedAt, expiresAt },
    create: { employeeId: input.employeeId, skill, proficiency: input.proficiency?.trim() || null, notes: input.notes?.trim() || null, assessedAt, expiresAt },
  });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "EmployeeSkillRecord", entityId: record.id, action: "UPSERT", after: { employeeId: input.employeeId, skill, proficiency: record.proficiency } });
  return record;
}

export async function createAssetInventoryAction(input: { companyId: string; assetTag: string; assetType: string; name: string; description?: string; serialNumber?: string; condition?: string; acquiredAt?: string; purchaseCost?: string }) {
  const actor = await requirePermission("employee_asset", "assign");
  const purchaseCost = input.purchaseCost ? new Prisma.Decimal(input.purchaseCost) : undefined;
  if (purchaseCost?.lessThan(0)) throw new Error("Purchase cost cannot be negative.");
  const asset = await prisma.assetInventory.create({ data: { companyId: input.companyId, assetTag: input.assetTag.trim(), assetType: input.assetType.trim(), name: input.name.trim(), description: input.description?.trim() || null, serialNumber: input.serialNumber?.trim() || null, condition: input.condition?.trim() || null, acquiredAt: input.acquiredAt ? new Date(`${input.acquiredAt}T00:00:00.000Z`) : null, purchaseCost } });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "AssetInventory", entityId: asset.id, action: "CREATE", after: { assetTag: asset.assetTag, assetType: asset.assetType, status: asset.status } });
  return asset;
}

export async function updateAssetInventoryStatusAction(input: { assetId: string; status: "AVAILABLE" | "MAINTENANCE" | "RETIRED"; condition?: string }) {
  const actor = await requirePermission("employee_asset", "assign");
  return prisma.$transaction(async (tx) => {
    const asset = await tx.assetInventory.findUnique({ where: { id: input.assetId }, include: { assignments: { where: { returnedAt: null }, select: { id: true } } } });
    if (!asset) throw new Error("Asset inventory record not found.");
    if (asset.status === "ASSIGNED" || asset.assignments.length) throw new Error("Return the asset before changing its inventory status.");
    const updated = await tx.assetInventory.update({ where: { id: asset.id }, data: { status: input.status, condition: input.condition?.trim() || asset.condition } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "AssetInventory", entityId: asset.id, action: "STATUS_CHANGE", before: { status: asset.status }, after: { status: updated.status, condition: updated.condition } });
    return updated;
  });
}

export async function assignEmployeeAssetAction(input: { employeeId: string; inventoryAssetId?: string; assetTag?: string; assetType?: string; description?: string; conditionOut?: string }) {
  const actor = await requirePermission("employee_asset", "assign");
  return prisma.$transaction(async (tx) => {
    const employee = await tx.employee.findUnique({ where: { id: input.employeeId }, select: { companyId: true } });
    if (!employee) throw new Error("Employee not found.");
    if (input.inventoryAssetId) {
      const inventory = await tx.assetInventory.findUnique({ where: { id: input.inventoryAssetId } });
      if (!inventory || inventory.companyId !== employee.companyId) throw new Error("Asset and employee must belong to the same company.");
      if (inventory.status !== "AVAILABLE") throw new Error("Only available inventory assets can be assigned.");
      const claimed = await tx.assetInventory.updateMany({ where: { id: inventory.id, status: "AVAILABLE" }, data: { status: "ASSIGNED" } });
      if (claimed.count !== 1) throw new Error("This asset was just assigned by another user.");
      const assignment = await tx.employeeAssetAssignment.create({ data: { employeeId: input.employeeId, inventoryAssetId: inventory.id, assetTag: inventory.assetTag, assetType: inventory.assetType, description: inventory.description ?? inventory.name, conditionOut: input.conditionOut?.trim() || inventory.condition } });
      await recordAudit(tx, { actorUserId: actor.id, entityType: "EmployeeAssetAssignment", entityId: assignment.id, action: "ASSIGN", after: { assetTag: assignment.assetTag, employeeId: assignment.employeeId, inventoryAssetId: inventory.id } });
      return assignment;
    }
    if (!input.assetTag?.trim() || !input.assetType?.trim() || !input.description?.trim()) throw new Error("Select an inventory asset or enter complete asset details.");
    const assignment = await tx.employeeAssetAssignment.create({ data: { employeeId: input.employeeId, assetTag: input.assetTag.trim(), assetType: input.assetType.trim(), description: input.description.trim(), conditionOut: input.conditionOut?.trim() || null } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "EmployeeAssetAssignment", entityId: assignment.id, action: "ASSIGN", after: { assetTag: assignment.assetTag, employeeId: assignment.employeeId } });
    return assignment;
  });
}

export async function returnEmployeeAssetAction(input: { assignmentId: string; conditionIn?: string }) {
  const actor = await requirePermission("employee_asset", "return");
  return prisma.$transaction(async (tx) => {
    const asset = await tx.employeeAssetAssignment.findFirst({ where: { id: input.assignmentId, returnedAt: null } });
    if (!asset) throw new Error("This asset is not currently assigned.");
    const saved = await tx.employeeAssetAssignment.update({ where: { id: asset.id }, data: { returnedAt: new Date(), conditionIn: input.conditionIn?.trim() || null } });
    if (asset.inventoryAssetId) await tx.assetInventory.update({ where: { id: asset.inventoryAssetId }, data: { status: "AVAILABLE", condition: input.conditionIn?.trim() || undefined } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "EmployeeAssetAssignment", entityId: asset.id, action: "RETURN", before: { returnedAt: null }, after: { returnedAt: saved.returnedAt?.toISOString(), conditionIn: saved.conditionIn } });
    return saved;
  });
}

export async function fileEmployeeGrievanceAction(input: { employeeId?: string; grievanceType: string; title: string; description: string }) {
  const user = await requireUser();
  const employeeId = input.employeeId ?? user.employeeId;
  if (!employeeId) throw new Error("An employee record is required to file a grievance.");
  if (employeeId !== user.employeeId) await requirePermission("employee_grievance", "create");
  const grievance = await prisma.employeeGrievance.create({ data: { employeeId, grievanceType: input.grievanceType.trim(), title: input.title.trim(), description: input.description.trim() } });
  await recordAudit(prisma, { actorUserId: user.id, entityType: "EmployeeGrievance", entityId: grievance.id, action: "FILE", after: { grievanceType: grievance.grievanceType, confidential: true } });
  return grievance;
}

export async function resolveEmployeeGrievanceAction(input: { grievanceId: string; resolution: string }) {
  const actor = await requirePermission("employee_grievance", "resolve");
  return prisma.$transaction(async (tx) => {
    const grievance = await tx.employeeGrievance.findFirst({ where: { id: input.grievanceId, status: "OPEN" } });
    if (!grievance) throw new Error("Open grievance not found.");
    const saved = await tx.employeeGrievance.update({ where: { id: grievance.id }, data: { status: "RESOLVED", resolution: input.resolution.trim(), resolvedAt: new Date(), assignedTo: actor.id } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "EmployeeGrievance", entityId: grievance.id, action: "RESOLVE", before: { status: "OPEN" }, after: { status: "RESOLVED" } });
    return saved;
  });
}

export async function giveEmployeeFeedbackAction(input: { employeeId: string; category: string; rating?: number; comments: string; isPrivate?: boolean }) {
  const author = await requireUser();
  if (!author.employeeId) throw new Error("This account is not linked to an employee.");
  if (input.rating !== undefined && (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)) throw new Error("Feedback rating must be from 1 to 5.");
  const feedback = await prisma.employeeFeedbackEntry.create({ data: { employeeId: input.employeeId, authorEmployeeId: author.employeeId, category: input.category.trim(), rating: input.rating, comments: input.comments.trim(), private: input.isPrivate ?? true } });
  await recordAudit(prisma, { actorUserId: author.id, entityType: "EmployeeFeedbackEntry", entityId: feedback.id, action: "CREATE", after: { employeeId: input.employeeId, category: input.category, private: feedback.private } });
  return feedback;
}

export async function createFullAndFinalSettlementAction(input: { employeeId: string; separationDate: string; finalBasicPay: string; leaveEncashment: string; thirteenthMonthPay: string; otherEarnings: string; loanOutstanding: string; otherDeductions: string }) {
  const actor = await requirePermission("full_and_final", "create");
  const employee = await prisma.employee.findUniqueOrThrow({ where: { id: input.employeeId } });
  if (!employee.dateSeparated) throw new Error("Record the employee separation before preparing final settlement.");
  const separationDate = new Date(`${input.separationDate}T00:00:00.000Z`);
  const money = (value: string) => new Prisma.Decimal(value);
  const grossSettlement = money(input.finalBasicPay).plus(money(input.leaveEncashment)).plus(money(input.thirteenthMonthPay)).plus(money(input.otherEarnings));
  const netSettlement = grossSettlement.minus(money(input.loanOutstanding)).minus(money(input.otherDeductions));
  if (netSettlement.lessThan(0)) throw new Error("Settlement deductions cannot exceed the gross settlement without a reviewed recovery plan.");
  const settlement = await prisma.fullAndFinalSettlement.create({ data: { employeeId: employee.id, separationDate, finalBasicPay: money(input.finalBasicPay), leaveEncashment: money(input.leaveEncashment), thirteenthMonthPay: money(input.thirteenthMonthPay), otherEarnings: money(input.otherEarnings), loanOutstanding: money(input.loanOutstanding), otherDeductions: money(input.otherDeductions), grossSettlement, netSettlement, status: "PENDING" } });
  await prisma.approvalRequest.create({ data: { requestType: "FULL_AND_FINAL", documentId: settlement.id, submittedById: actor.id } });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "FullAndFinalSettlement", entityId: settlement.id, action: "SUBMIT", after: { grossSettlement: grossSettlement.toFixed(2), netSettlement: netSettlement.toFixed(2) } });
  return settlement;
}

export async function approveFullAndFinalSettlementAction(settlementId: string) {
  const actor = await requirePermission("full_and_final", "approve");
  const settlement = await prisma.fullAndFinalSettlement.updateMany({ where: { id: settlementId, status: "PENDING" }, data: { status: "APPROVED", reviewedBy: actor.id } });
  if (settlement.count !== 1) throw new Error("Only pending final settlements can be approved.");
  await prisma.approvalRequest.updateMany({ where: { requestType: "FULL_AND_FINAL", documentId: settlementId, status: "PENDING" }, data: { status: "APPROVED", completedAt: new Date() } });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "FullAndFinalSettlement", entityId: settlementId, action: "APPROVE", after: { status: "APPROVED" } });
  return settlement;
}

export async function markFullAndFinalSettlementPaidAction(settlementId: string) {
  const actor = await requirePermission("full_and_final", "pay");
  const settlement = await prisma.fullAndFinalSettlement.updateMany({ where: { id: settlementId, status: "APPROVED", paidAt: null }, data: { paidAt: new Date() } });
  if (settlement.count !== 1) throw new Error("Only approved final settlements can be paid.");
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "FullAndFinalSettlement", entityId: settlementId, action: "PAY", after: { paidAt: new Date().toISOString() } });
  return settlement;
}

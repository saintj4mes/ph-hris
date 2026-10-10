"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission, requireUser } from "@/shared/platform/auth";

export async function listEmployeesAction(companyId?: string) {
  await requirePermission("employee", "read");
  return prisma.employee.findMany({
    where: { ...(companyId ? { companyId } : {}), status: { not: "SEPARATED" } },
    include: { department: true, designation: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function createEmployeeAction(input: {
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email?: string;
  dateHired: string;
  employmentType: "REGULAR" | "PROBATIONARY" | "FIXED_TERM" | "CASUAL" | "PART_TIME";
  workerClass: "RANK_AND_FILE" | "MANAGERIAL" | "SUPERVISORY";
  isMinimumWageEarner?: boolean;
  companyId: string;
  departmentId?: string;
  designationId?: string;
  tin?: string;
  sssNumber?: string;
  philHealthNumber?: string;
  pagIbigNumber?: string;
}) {
  const actor = await requirePermission("employee", "create");
  const employeeNumber = input.employeeNumber.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const hiredDate = new Date(`${input.dateHired}T00:00:00.000Z`);
  if (!employeeNumber || !firstName || !lastName || Number.isNaN(hiredDate.valueOf())) throw new Error("Employee number, name, and valid hire date are required.");

  return prisma.$transaction(async (tx) => {
    const employee = await tx.employee.create({
      data: {
        employeeNumber,
        firstName,
        middleName: input.middleName?.trim() || null,
        lastName,
        suffix: input.suffix?.trim() || null,
        email: input.email?.trim().toLowerCase() || null,
        dateHired: hiredDate,
        employmentType: input.employmentType,
        workerClass: input.workerClass,
        isMinimumWageEarner: input.isMinimumWageEarner ?? false,
        companyId: input.companyId,
        departmentId: input.departmentId || null,
        designationId: input.designationId || null,
        tin: input.tin?.trim() || null,
        sssNumber: input.sssNumber?.trim() || null,
        philHealthNumber: input.philHealthNumber?.trim() || null,
        pagIbigNumber: input.pagIbigNumber?.trim() || null,
      },
    });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "Employee", entityId: employee.id, action: "CREATE", after: input as unknown as Prisma.InputJsonValue });
    return employee;
  });
}

export async function updateEmployeeProfileAction(input: {
  employeeId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email?: string;
  mobilePhone?: string;
  workLocation?: string;
  departmentId?: string;
  designationId?: string;
  reportsToId?: string;
  dateOfBirth?: string;
  gender?: string;
  civilStatus?: string;
}) {
  const actor = await requirePermission("employee", "update");
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (firstName.length < 1 || lastName.length < 1) throw new Error("First and last name are required.");
  const employee = await prisma.employee.findUniqueOrThrow({ where: { id: input.employeeId } });
  const [department, designation, manager] = await Promise.all([
    input.departmentId ? prisma.department.findFirst({ where: { id: input.departmentId, companyId: employee.companyId } }) : null,
    input.designationId ? prisma.designation.findFirst({ where: { id: input.designationId, companyId: employee.companyId } }) : null,
    input.reportsToId ? prisma.employee.findFirst({ where: { id: { equals: input.reportsToId, not: employee.id }, companyId: employee.companyId, status: { not: "SEPARATED" } } }) : null,
  ]);
  if (input.departmentId && !department) throw new Error("Choose a department in the employee's company.");
  if (input.designationId && !designation) throw new Error("Choose a designation in the employee's company.");
  if (input.reportsToId && !manager) throw new Error("Choose a different active manager in the employee's company.");
  const dateOfBirth = input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00.000Z`) : null;
  if (dateOfBirth && Number.isNaN(dateOfBirth.valueOf())) throw new Error("Enter a valid date of birth.");
  const updated = await prisma.employee.update({
    where: { id: employee.id },
    data: {
      firstName,
      middleName: input.middleName?.trim() || null,
      lastName,
      suffix: input.suffix?.trim() || null,
      email: input.email?.trim().toLowerCase() || null,
      mobilePhone: input.mobilePhone?.trim() || null,
      workLocation: input.workLocation?.trim() || null,
      departmentId: department?.id ?? null,
      designationId: designation?.id ?? null,
      reportsToId: manager?.id ?? null,
      dateOfBirth,
      gender: input.gender?.trim() || null,
      civilStatus: input.civilStatus?.trim() || null,
    },
  });
  await recordAudit(prisma, {
    actorUserId: actor.id,
    entityType: "Employee",
    entityId: employee.id,
    action: "UPDATE_PROFILE",
    before: { firstName: employee.firstName, middleName: employee.middleName, lastName: employee.lastName, email: employee.email, departmentId: employee.departmentId, designationId: employee.designationId, reportsToId: employee.reportsToId },
    after: { firstName: updated.firstName, middleName: updated.middleName, lastName: updated.lastName, email: updated.email, departmentId: updated.departmentId, designationId: updated.designationId, reportsToId: updated.reportsToId },
  });
  return updated;
}

export async function recordEmploymentEventAction(input: {
  employeeId: string;
  eventType: "TRANSFER" | "PROMOTION" | "STATUS_CHANGE" | "SEPARATION" | "REHIRE";
  effectiveDate: string;
  reason: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}) {
  const actor = await requirePermission("employee", "update");
  const effectiveDate = new Date(`${input.effectiveDate}T00:00:00.000Z`);
  if (Number.isNaN(effectiveDate.valueOf()) || input.reason.trim().length < 3) throw new Error("A valid effective date and reason are required.");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (effectiveDate > today) throw new Error("Future-dated employment changes are not supported yet.");
  return prisma.$transaction(async (tx) => {
    const employee = await tx.employee.findUniqueOrThrow({ where: { id: input.employeeId } });
    const before = { status: employee.status, departmentId: employee.departmentId, designationId: employee.designationId, dateSeparated: employee.dateSeparated?.toISOString().slice(0, 10) ?? null };
    const after = { ...before };
    if (input.eventType === "SEPARATION") {
      after.status = "SEPARATED";
      after.dateSeparated = effectiveDate.toISOString().slice(0, 10);
    } else if (input.eventType === "REHIRE") {
      after.status = "ACTIVE";
      after.dateSeparated = null;
    } else if (input.eventType === "STATUS_CHANGE") {
      const status = String(input.newValue?.status ?? "");
      if (status === "ACTIVE" || status === "INACTIVE" || status === "ON_LEAVE" || status === "SEPARATED") {
        after.status = status;
        if (status === "SEPARATED") after.dateSeparated = effectiveDate.toISOString().slice(0, 10);
        if (status === "ACTIVE") after.dateSeparated = null;
      } else throw new Error("Choose a valid employee status.");
    } else {
      const departmentId = String(input.newValue?.departmentId ?? "");
      const designationId = String(input.newValue?.designationId ?? "");
      if (departmentId) {
        const department = await tx.department.findFirst({ where: { id: departmentId, companyId: employee.companyId } });
        if (!department) throw new Error("Choose a department from the employee's company.");
        after.departmentId = department.id;
      }
      if (designationId) {
        const designation = await tx.designation.findFirst({ where: { id: designationId, companyId: employee.companyId } });
        if (!designation) throw new Error("Choose a designation from the employee's company.");
        after.designationId = designation.id;
      }
      if (input.eventType === "PROMOTION" && !designationId) throw new Error("A promotion needs a new designation.");
      if (input.eventType === "TRANSFER" && !departmentId) throw new Error("A transfer needs a destination department.");
    }
    const event = await tx.employmentEvent.create({ data: { employeeId: employee.id, eventType: input.eventType, status: "PENDING", effectiveDate, reason: input.reason.trim(), previousValue: before, newValue: after, createdBy: actor.id } });
    await tx.approvalRequest.create({ data: { requestType: "EMPLOYMENT_EVENT", documentId: event.id, submittedById: actor.id } });
    await recordAudit(tx, {
      actorUserId: actor.id,
      entityType: "Employee",
      entityId: employee.id,
      action: "SUBMIT_EMPLOYMENT_EVENT",
      before,
      after,
    });
    return event;
  });
}

export async function reviewEmploymentEventAction(input: { eventId: string; approve: boolean; comment?: string }) {
  const actor = await requirePermission("employee", "approve");
  return prisma.$transaction(async (tx) => {
    const event = await tx.employmentEvent.findFirst({ where: { id: input.eventId, status: "PENDING" }, include: { employee: { include: { authUser: true } } } });
    if (!event) throw new Error("Only pending employment events can be reviewed.");
    const before = (event.previousValue ?? {}) as Record<string, unknown>;
    const after = (event.newValue ?? {}) as Record<string, unknown>;
    if (input.approve) {
      if (event.employee.status !== before.status || event.employee.departmentId !== before.departmentId || event.employee.designationId !== before.designationId) {
        throw new Error("The employee record changed after this request was submitted. Re-submit against the latest values.");
      }
      const nextStatus = String(after.status);
      if (!["ACTIVE", "INACTIVE", "ON_LEAVE", "SEPARATED"].includes(nextStatus)) throw new Error("This request contains an invalid employee status.");
      const changes: Prisma.EmployeeUncheckedUpdateInput = {
        status: nextStatus as "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "SEPARATED",
        departmentId: after.departmentId ? String(after.departmentId) : null,
        designationId: after.designationId ? String(after.designationId) : null,
        dateSeparated: after.dateSeparated ? new Date(`${String(after.dateSeparated)}T00:00:00.000Z`) : null,
      };
      if (changes.departmentId) {
        const department = await tx.department.findFirst({ where: { id: String(changes.departmentId), companyId: event.employee.companyId } });
        if (!department) throw new Error("Requested department is no longer available in this company.");
      }
      if (changes.designationId) {
        const designation = await tx.designation.findFirst({ where: { id: String(changes.designationId), companyId: event.employee.companyId } });
        if (!designation) throw new Error("Requested designation is no longer available in this company.");
      }
      await tx.employee.update({ where: { id: event.employeeId }, data: changes });
    }
    const status = input.approve ? "APPROVED" : "REJECTED";
    const saved = await tx.employmentEvent.update({ where: { id: event.id }, data: { status, approvedBy: input.approve ? actor.id : null } });
    await tx.approvalRequest.updateMany({ where: { requestType: "EMPLOYMENT_EVENT", documentId: event.id, status: "PENDING" }, data: { status, completedAt: new Date() } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "EmploymentEvent", entityId: event.id, action: input.approve ? "APPROVE" : "REJECT", before: { status: "PENDING" }, after: { status, comment: input.comment?.trim() || null } });
    if (event.employee.authUser) await tx.notification.create({ data: { recipientId: event.employee.authUser.id, category: "EMPLOYMENT", title: `Employment update ${status.toLowerCase()}`, body: input.comment?.trim() || `Your ${event.eventType.toLowerCase().replaceAll("_", " ")} request was ${status.toLowerCase()}.`, actionUrl: "/portal/profile" } });
    return { event: saved, employeeId: event.employeeId };
  }, { isolationLevel: "Serializable" });
}

export async function getMyEmployeeProfileAction() {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee record.");
  return prisma.employee.findUniqueOrThrow({
    where: { id: user.employeeId },
    include: { company: true, department: true, designation: true, addresses: { where: { isPrimary: true } }, emergencyContacts: { where: { isPrimary: true } } },
  });
}

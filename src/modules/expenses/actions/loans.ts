"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/platform/audit";
import { requirePermission, requireUser } from "@/shared/platform/auth";

export async function createLoanProductAction(input: { companyId: string; code: string; name: string; flatInterestPercent: string; maximumAmount?: string }) {
  const actor = await requirePermission("loan", "configure");
  const code = input.code.trim().toUpperCase();
  const flatInterestPercent = new Prisma.Decimal(input.flatInterestPercent);
  const interestRate = flatInterestPercent.div(100);
  const maximumAmount = input.maximumAmount ? new Prisma.Decimal(input.maximumAmount) : null;
  if (!code || input.name.trim().length < 2 || flatInterestPercent.lessThan(0) || flatInterestPercent.greaterThan(100) || (maximumAmount && maximumAmount.lte(0))) throw new Error("Enter a valid product name, flat interest rate from 0–100%, and positive maximum amount.");
  const product = await prisma.loanProduct.create({ data: { companyId: input.companyId, code, name: input.name.trim(), interestRate, maximumAmount } });
  await recordAudit(prisma, { actorUserId: actor.id, entityType: "LoanProduct", entityId: product.id, action: "CREATE", after: { code, name: product.name, interestRate: interestRate.toString(), maximumAmount: maximumAmount?.toString() ?? null } });
  return product;
}

export async function requestEmployeeAdvanceAction(input: { requestedAmount: string; purpose: string }) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const requestedAmount = new Prisma.Decimal(input.requestedAmount);
  if (requestedAmount.lte(0) || input.purpose.trim().length < 3) throw new Error("Enter a positive amount and a short purpose.");
  const advance = await prisma.$transaction(async (tx) => {
    const row = await tx.employeeAdvance.create({ data: { employeeId: user.employeeId!, requestedAmount, purpose: input.purpose.trim(), status: "PENDING" } });
    await tx.approvalRequest.create({ data: { requestType: "EMPLOYEE_ADVANCE", documentId: row.id, submittedById: user.id } });
    await recordAudit(tx, { actorUserId: user.id, entityType: "EmployeeAdvance", entityId: row.id, action: "REQUEST", after: { requestedAmount: requestedAmount.toFixed(2), purpose: row.purpose } });
    return row;
  });
  return advance;
}

export async function reviewEmployeeAdvanceAction(input: { advanceId: string; approve: boolean; approvedAmount?: string }) {
  const actor = await requirePermission("advance", "approve");
  return prisma.$transaction(async (tx) => {
    const advance = await tx.employeeAdvance.findFirst({ where: { id: input.advanceId, status: "PENDING" }, include: { employee: { include: { authUser: true } } } });
    if (!advance) throw new Error("Only a pending employee advance can be reviewed.");
    const approvedAmount = input.approvedAmount ? new Prisma.Decimal(input.approvedAmount) : advance.requestedAmount;
    if (input.approve && (approvedAmount.lte(0) || approvedAmount.gt(advance.requestedAmount))) throw new Error("Approved amount must be positive and no greater than the request.");
    const updated = await tx.employeeAdvance.update({ where: { id: advance.id }, data: { status: input.approve ? "APPROVED" : "REJECTED", approvedAmount: input.approve ? approvedAmount : null } });
    await tx.approvalRequest.updateMany({ where: { requestType: "EMPLOYEE_ADVANCE", documentId: advance.id, status: "PENDING" }, data: { status: input.approve ? "APPROVED" : "REJECTED", completedAt: new Date() } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "EmployeeAdvance", entityId: advance.id, action: input.approve ? "APPROVE" : "REJECT", before: { status: advance.status }, after: { status: updated.status, approvedAmount: updated.approvedAmount?.toFixed(2) ?? null } });
    if (advance.employee.authUser) await tx.notification.create({ data: { recipientId: advance.employee.authUser.id, category: "ADVANCE", title: `Salary advance ${updated.status.toLowerCase()}`, body: input.approve ? `Your request for ₱${approvedAmount.toFixed(2)} was approved and awaits release.` : "Your salary advance request was rejected.", actionUrl: "/portal/advances" } });
    return updated;
  });
}

export async function releaseEmployeeAdvanceAction(advanceId: string) {
  const actor = await requirePermission("advance", "release");
  return prisma.$transaction(async (tx) => {
    const advance = await tx.employeeAdvance.findFirst({ where: { id: advanceId, status: "APPROVED" }, include: { employee: { include: { authUser: true } } } });
    if (!advance?.approvedAmount) throw new Error("Only an approved salary advance can be released.");
    const released = await tx.employeeAdvance.update({ where: { id: advance.id }, data: { status: "RELEASED", releasedAt: new Date() } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "EmployeeAdvance", entityId: advance.id, action: "RELEASE", after: { approvedAmount: advance.approvedAmount.toFixed(2) } });
    if (advance.employee.authUser) await tx.notification.create({ data: { recipientId: advance.employee.authUser.id, category: "ADVANCE", title: "Salary advance released", body: `₱${advance.approvedAmount.toFixed(2)} was released. Repayment will be deducted through payroll.`, actionUrl: "/portal/advances" } });
    return released;
  });
}

export async function requestEmployeeLoanAction(input: { loanProductId: string; requestedAmount: string; installments: number }) {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const requestedAmount = new Prisma.Decimal(input.requestedAmount);
  if (requestedAmount.lessThanOrEqualTo(0) || !Number.isInteger(input.installments) || input.installments < 1) throw new Error("Enter a positive loan amount and installment count.");
  const product = await prisma.loanProduct.findUniqueOrThrow({ where: { id: input.loanProductId } });
  if (!product.active || (product.maximumAmount && requestedAmount.greaterThan(product.maximumAmount))) throw new Error("This loan product is inactive or the requested amount is above its limit.");
  const loan = await prisma.$transaction(async (tx) => {
    const created = await tx.employeeLoan.create({ data: { employeeId: user.employeeId!, loanProductId: product.id, requestedAmount, interestRate: product.interestRate, installments: input.installments, status: "PENDING" } });
    await tx.approvalRequest.create({ data: { requestType: "EMPLOYEE_LOAN", documentId: created.id, submittedById: user.id } });
    return created;
  });
  await recordAudit(prisma, { actorUserId: user.id, entityType: "EmployeeLoan", entityId: loan.id, action: "REQUEST", after: { requestedAmount: requestedAmount.toFixed(2), installments: input.installments } });
  return loan;
}

export async function reviewEmployeeLoanAction(input: { loanId: string; approve: boolean; approvedAmount?: string }) {
  const actor = await requirePermission("loan", "approve");
  return prisma.$transaction(async (tx) => {
    const loan = await tx.employeeLoan.findFirst({ where: { id: input.loanId, status: "PENDING" }, include: { loanProduct: true, employee: { include: { authUser: true } } } });
    if (!loan) throw new Error("Only a pending employee loan can be reviewed.");
    const amount = input.approvedAmount ? new Prisma.Decimal(input.approvedAmount) : loan.requestedAmount;
    if (input.approve && (amount.lessThanOrEqualTo(0) || amount.greaterThan(loan.requestedAmount) || (loan.loanProduct.maximumAmount && amount.greaterThan(loan.loanProduct.maximumAmount)))) throw new Error("Approved loan amount is outside the allowed range.");
    const updated = await tx.employeeLoan.update({ where: { id: loan.id }, data: { status: input.approve ? "APPROVED" : "REJECTED", approvedAmount: input.approve ? amount : null, outstanding: input.approve ? amount : new Prisma.Decimal(0) } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "EmployeeLoan", entityId: loan.id, action: input.approve ? "APPROVE" : "REJECT", before: { status: loan.status }, after: { status: updated.status, amount: input.approve ? amount.toFixed(2) : null } });
    if (loan.employee.authUser) await tx.notification.create({ data: { recipientId: loan.employee.authUser.id, category: "LOAN", title: `Employee loan ${updated.status.toLowerCase()}`, body: input.approve ? `Your request for ₱${amount.toFixed(2)} was approved and awaits release.` : "Your employee loan request was rejected.", actionUrl: "/portal/advances" } });
    return updated;
  });
}

export async function releaseEmployeeLoanAction(loanId: string) {
  const actor = await requirePermission("loan", "release");
  return prisma.$transaction(async (tx) => {
    const loan = await tx.employeeLoan.findFirst({ where: { id: loanId, status: "APPROVED" }, include: { employee: { include: { authUser: true } } } });
    if (!loan?.approvedAmount) throw new Error("Only approved loans can be released.");
    const outstanding = loan.approvedAmount.mul(new Prisma.Decimal(1).plus(loan.interestRate));
    const installment = outstanding.div(loan.installments).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    let remaining = outstanding;
    const repayments = Array.from({ length: loan.installments }, (_, index) => {
      const amount = index === loan.installments - 1 ? remaining : installment;
      remaining = remaining.minus(amount);
      const issued = new Date();
      const dueMonth = new Date(Date.UTC(issued.getUTCFullYear(), issued.getUTCMonth() + index + 1, 1));
      const lastDay = new Date(Date.UTC(dueMonth.getUTCFullYear(), dueMonth.getUTCMonth() + 1, 0)).getUTCDate();
      const dueDate = new Date(Date.UTC(dueMonth.getUTCFullYear(), dueMonth.getUTCMonth(), Math.min(issued.getUTCDate(), lastDay)));
      return { loanId: loan.id, dueDate, amount };
    });
    await tx.loanRepayment.createMany({ data: repayments });
    const released = await tx.employeeLoan.update({ where: { id: loan.id }, data: { status: "RELEASED", releasedAt: new Date(), outstanding } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "EmployeeLoan", entityId: loan.id, action: "RELEASE", after: { outstanding: outstanding.toFixed(2), installments: loan.installments } });
    if (loan.employee.authUser) await tx.notification.create({ data: { recipientId: loan.employee.authUser.id, category: "LOAN", title: "Employee loan released", body: `Your loan was released. Repayments total ₱${outstanding.toFixed(2)}.`, actionUrl: "/portal/advances" } });
    return released;
  });
}

export async function recordLoanRepaymentAction(input: { repaymentId: string; amount?: string }) {
  const actor = await requirePermission("loan", "repay");
  return prisma.$transaction(async (tx) => {
    const repayment = await tx.loanRepayment.findUniqueOrThrow({ where: { id: input.repaymentId }, include: { loan: true } });
    if (repayment.paidAt) throw new Error("This loan repayment is already recorded.");
    if (repayment.salarySlipId) throw new Error("This repayment is assigned to payroll; record it through the linked payroll run.");
    const remainingInstallment = repayment.amount.minus(repayment.paidAmount);
    const amount = input.amount ? new Prisma.Decimal(input.amount) : remainingInstallment;
    if (amount.lessThanOrEqualTo(0) || amount.greaterThan(repayment.loan.outstanding)) throw new Error("Repayment amount is outside the outstanding balance.");
    if (amount.greaterThan(remainingInstallment)) throw new Error("Repayment cannot exceed the remaining scheduled installment.");
    const paidAmount = repayment.paidAmount.plus(amount);
    const updated = await tx.loanRepayment.update({ where: { id: repayment.id }, data: { paidAmount, paidAt: paidAmount.greaterThanOrEqualTo(repayment.amount) ? new Date() : null } });
    const remaining = repayment.loan.outstanding.minus(amount);
    await tx.employeeLoan.update({ where: { id: repayment.loanId }, data: { outstanding: remaining, status: remaining.isZero() ? "CLOSED" : "RELEASED" } });
    await recordAudit(tx, { actorUserId: actor.id, entityType: "LoanRepayment", entityId: repayment.id, action: "REPAY", after: { amount: amount.toFixed(2) } });
    return updated;
  });
}

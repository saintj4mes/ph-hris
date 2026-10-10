"use server";

import { prisma } from "@/shared/db/prisma";
import { requireUser } from "@/shared/platform/auth";

export async function getMyExpenseDataAction() {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const employee = await prisma.employee.findUniqueOrThrow({ where: { id: user.employeeId }, select: { companyId: true } });
  const [claims, types] = await Promise.all([
    prisma.expenseClaim.findMany({ where: { employeeId: user.employeeId }, include: { details: { include: { expenseType: true } } }, orderBy: { claimDate: "desc" }, take: 30 }),
    prisma.expenseType.findMany({ where: { companyId: employee.companyId, active: true }, orderBy: { name: "asc" } }),
  ]);
  return { claims, types };
}

export async function getMyLoanDataAction() {
  const user = await requireUser();
  if (!user.employeeId) throw new Error("This account is not linked to an employee.");
  const [loans, products, advances] = await Promise.all([
    prisma.employeeLoan.findMany({ where: { employeeId: user.employeeId }, include: { loanProduct: true, repayments: { orderBy: { dueDate: "asc" } } }, orderBy: { releasedAt: "desc" } }),
    prisma.loanProduct.findMany({ where: { company: { employees: { some: { id: user.employeeId } } }, active: true }, orderBy: { name: "asc" } }),
    prisma.employeeAdvance.findMany({ where: { employeeId: user.employeeId }, orderBy: { requestedOn: "desc" }, take: 30 }),
  ]);
  return { loans, products, advances };
}

import { ScrollText } from "lucide-react";
import { FinalSettlementPanel } from "@/components/admin/final-settlement-panel";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function FinalSettlementsPage() {
  await requirePermission("full_and_final", "create");
  const [employees, rows] = await Promise.all([
    prisma.employee.findMany({ where: { status: "SEPARATED", fullAndFinal: null }, select: { id: true, employeeNumber: true, firstName: true, lastName: true, dateSeparated: true }, orderBy: { dateSeparated: "desc" } }),
    prisma.fullAndFinalSettlement.findMany({ include: { employee: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return <div className="space-y-6"><header className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-teal-50 text-teal-700"><ScrollText className="size-6" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Employee lifecycle</p><h1 className="mt-1 text-2xl font-semibold">Final settlements</h1><p className="mt-1 text-sm text-slate-500">Prepare separation amounts, route them for approval, and record payment.</p></div></header><FinalSettlementPanel employees={employees.filter((item) => item.dateSeparated).map((employee) => ({ id: employee.id, label: `${employee.employeeNumber} · ${employee.firstName} ${employee.lastName}`, separationDate: employee.dateSeparated!.toISOString().slice(0, 10) }))} settlements={rows.map((item) => ({ id: item.id, employee: `${item.employee.employeeNumber} · ${item.employee.firstName} ${item.employee.lastName}`, separationDate: item.separationDate.toISOString().slice(0, 10), grossSettlement: item.grossSettlement.toString(), netSettlement: item.netSettlement.toString(), status: item.status, paidAt: item.paidAt?.toISOString().slice(0, 10) ?? null }))} /></div>;
}

import { Boxes } from "lucide-react";
import { AssetAssignmentForm } from "@/components/admin/asset-assignment-form";
import { AssetInventoryForm } from "@/components/admin/asset-inventory-form";
import { AssetInventoryStatus } from "@/components/admin/asset-inventory-status";
import { AssetReturnButton } from "@/components/admin/asset-return-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  await requirePermission("employee_asset", "read");
  const [employees, companies, inventory, assignments] = await Promise.all([
    prisma.employee.findMany({ where: { status: "ACTIVE" }, select: { id: true, employeeNumber: true, firstName: true, lastName: true }, orderBy: { lastName: "asc" } }),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.assetInventory.findMany({ include: { company: true }, orderBy: [{ status: "asc" }, { assetTag: "asc" }] }),
    prisma.employeeAssetAssignment.findMany({ include: { employee: true }, orderBy: { assignedAt: "desc" }, take: 100 }),
  ]);
  return <div className="space-y-7"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-teal-50 text-teal-700"><Boxes className="size-6" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Employee services</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[30px]">Company assets</h1><p className="mt-1 text-sm text-slate-500">Inventory, maintenance status, employee custody, and return history.</p></div></div>
    <AssetInventoryForm companies={companies} />
    <AssetAssignmentForm employees={employees.map((employee) => ({ id: employee.id, label: `${employee.employeeNumber} · ${employee.firstName} ${employee.lastName}` }))} inventoryAssets={inventory.filter((item) => item.status === "AVAILABLE").map((item) => ({ id: item.id, label: `${item.company.name} · ${item.assetTag} · ${item.name}` }))} />
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-sm font-semibold">Asset inventory</h2><p className="mt-1 text-xs text-slate-500">Lifecycle status prevents issuing items already assigned, retired, or in maintenance.</p></div><div className="divide-y divide-slate-100">{inventory.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="text-sm font-semibold">{item.name} <span className="font-normal text-slate-500">· {item.assetTag}</span></p><p className="mt-1 text-xs text-slate-500">{item.company.name} · {item.assetType}{item.serialNumber ? ` · S/N ${item.serialNumber}` : ""}{item.purchaseCost ? ` · ₱${item.purchaseCost.toFixed(2)}` : ""}{item.condition ? ` · ${item.condition}` : ""}</p></div><div className="flex items-center gap-3"><StatusBadge tone={item.status === "AVAILABLE" ? "success" : item.status === "ASSIGNED" ? "info" : "neutral"}>{item.status}</StatusBadge><AssetInventoryStatus id={item.id} status={item.status} condition={item.condition} /></div></article>)}{inventory.length === 0 && <p className="p-6 text-sm text-slate-500">No inventory items have been registered.</p>}</div></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-sm font-semibold">Custody history</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Asset</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{assignments.map((asset) => <tr key={asset.id}><td className="px-5 py-4"><p className="font-semibold">{asset.description}</p><p className="text-xs text-slate-500">{asset.assetTag} · {asset.assetType}</p></td><td className="px-4 py-4">{asset.employee.firstName} {asset.employee.lastName}</td><td className="px-4 py-4 text-xs text-slate-500">{asset.assignedAt.toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })}</td><td className="px-4 py-4"><StatusBadge tone={asset.returnedAt ? "neutral" : "success"}>{asset.returnedAt ? "Returned" : "Assigned"}</StatusBadge></td><td className="px-5 py-4">{!asset.returnedAt && <AssetReturnButton id={asset.id} />}</td></tr>)}</tbody></table>{assignments.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No company assets assigned.</p>}</div></section>
  </div>;
}

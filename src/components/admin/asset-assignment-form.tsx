"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignEmployeeAssetAction } from "@/modules/core-hr/actions/employee-services";
import { Button } from "@/components/ui/button";

export function AssetAssignmentForm({ employees, inventoryAssets }: { employees: Array<{ id: string; label: string }>; inventoryAssets: Array<{ id: string; label: string }> }) {
  const router = useRouter(); const [message, setMessage] = useState("");
  return <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><summary className="cursor-pointer text-sm font-semibold">Assign company property</summary><form className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await assignEmployeeAssetAction({ employeeId: String(form.get("employeeId")), inventoryAssetId: String(form.get("inventoryAssetId")), conditionOut: String(form.get("conditionOut") || "") }); setMessage("Asset assigned."); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not assign asset."); } }}><select required name="employeeId" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Select employee</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.label}</option>)}</select><select required name="inventoryAssetId" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Select available inventory asset</option>{inventoryAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.label}</option>)}</select><input name="conditionOut" placeholder="Condition on issue (optional)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><div className="flex items-center gap-3"><Button disabled={!employees.length || !inventoryAssets.length}>Assign asset</Button>{message && <span role="status" className="text-xs text-slate-500">{message}</span>}</div></form></details>;
}

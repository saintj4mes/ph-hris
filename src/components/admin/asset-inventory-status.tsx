"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateAssetInventoryStatusAction } from "@/modules/core-hr/actions/employee-services";

export function AssetInventoryStatus({ id, status, condition }: { id: string; status: "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "RETIRED"; condition: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return <div className="flex flex-wrap items-center gap-2"><select aria-label="Asset lifecycle status" defaultValue={status === "ASSIGNED" ? "ASSIGNED" : status} disabled={pending || status === "ASSIGNED"} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs" onChange={(event) => {
    const nextStatus = event.target.value as "AVAILABLE" | "MAINTENANCE" | "RETIRED";
    startTransition(async () => { try { await updateAssetInventoryStatusAction({ assetId: id, status: nextStatus, condition: condition ?? undefined }); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update asset."); } });
  }}><option value="AVAILABLE">Available</option><option value="ASSIGNED">Assigned</option><option value="MAINTENANCE">Maintenance</option><option value="RETIRED">Retired</option></select>{error && <span role="alert" className="text-xs text-rose-700">{error}</span>}</div>;
}

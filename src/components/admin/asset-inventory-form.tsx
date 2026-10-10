"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAssetInventoryAction } from "@/modules/core-hr/actions/employee-services";

export function AssetInventoryForm({ companies }: { companies: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 xl:grid-cols-4" onSubmit={(event) => {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); setMessage("");
    startTransition(async () => {
      try { await createAssetInventoryAction({ companyId: String(form.get("companyId")), assetTag: String(form.get("assetTag")), assetType: String(form.get("assetType")), name: String(form.get("name")), description: String(form.get("description")), serialNumber: String(form.get("serialNumber")), condition: String(form.get("condition")), acquiredAt: String(form.get("acquiredAt")) || undefined, purchaseCost: String(form.get("purchaseCost")) || undefined }); setMessage("Inventory asset added."); formElement.reset(); router.refresh(); }
      catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not add inventory asset."); }
    });
  }}>
    <select required name="companyId" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Select company</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>
    <input required name="assetTag" placeholder="Asset tag" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
    <input required name="assetType" placeholder="Category (laptop, phone…)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
    <input required name="name" placeholder="Asset name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
    <input name="serialNumber" placeholder="Serial number" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
    <input name="condition" placeholder="Condition" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
    <input name="acquiredAt" type="date" aria-label="Date acquired" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
    <input name="purchaseCost" type="number" min="0" step="0.01" placeholder="Purchase cost (PHP)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
    <input name="description" placeholder="Description (optional)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm sm:col-span-2" />
    <div className="flex items-center gap-3"><button disabled={pending || !companies.length} className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50">Add inventory item</button>{message && <span role="status" className="text-xs text-slate-500">{message}</span>}</div>
  </form>;
}

"use client";

import { useRouter } from "next/navigation";
import { returnEmployeeAssetAction } from "@/modules/core-hr/actions/employee-services";

export function AssetReturnButton({ id }: { id: string }) {
  const router = useRouter();
  return <button onClick={async () => { await returnEmployeeAssetAction({ assignmentId: id }); router.refresh(); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Mark returned</button>;
}

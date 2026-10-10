"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markMyNotificationReadAction } from "@/modules/platform/actions/notifications";

export function NotificationReadButton({ id }: { id: string }) {
  const router = useRouter(); const [busy, startTransition] = useTransition();
  return <button disabled={busy} onClick={() => startTransition(async () => { await markMyNotificationReadAction(id); router.refresh(); })} className="text-xs font-semibold text-teal-700 disabled:opacity-50">{busy ? "Saving…" : "Mark read"}</button>;
}

"use client";

import { useRouter } from "next/navigation";

export function SignOutButton({ className = "text-xs font-semibold text-slate-500 hover:text-teal-700" }: { className?: string }) {
  const router = useRouter();
  return <button type="button" onClick={async () => { await fetch("/api/auth/sign-out", { method: "POST" }); router.replace("/sign-in"); router.refresh(); }} className={className}>Sign out</button>;
}

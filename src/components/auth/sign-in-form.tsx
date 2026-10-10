"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signInAction } from "@/shared/platform/session-actions";
import { Button } from "@/components/ui/button";

type SignInResult = { ok: true; redirectTo: string } | { ok: false; message: string };

export function SignInForm({ demoAccounts = [] }: { demoAccounts?: Array<{ label: string; email: string; password: string }> }) {
  const router = useRouter();
  const emailInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(formData: FormData) {
    setPending(true);
    setMessage("");
    try {
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");
      const response = demoAccounts.length > 0
        ? await fetch("/api/auth/demo-sign-in", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })
        : null;
      const result: SignInResult = response
        ? await response.json() as SignInResult
        : await signInAction(email, password);
      if (!result.ok) { setMessage(result.message); return; }
      router.replace(result.redirectTo);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign in could not be completed.");
    } finally {
      setPending(false);
    }
  }
  return <form action={submit} className="space-y-4">
    {demoAccounts.length > 0 && <aside className="space-y-2 rounded-lg bg-teal-50 p-3"><p className="text-xs font-semibold text-teal-900">Local demo access</p>{demoAccounts.map((account) => <button key={account.email} type="button" onClick={() => { if (emailInput.current) emailInput.current.value = account.email; if (passwordInput.current) passwordInput.current.value = account.password; }} className="block w-full rounded-md bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-teal-100">Use {account.label} · {account.email}</button>)}</aside>}
    <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Work email</span><input ref={emailInput} name="email" type="email" autoComplete="username" required className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15" /></label>
    <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Password</span><input ref={passwordInput} name="password" type="password" autoComplete="current-password" required className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15" /></label>
    {message && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{message}</p>}
    <Button type="submit" disabled={pending} className="h-11 w-full bg-teal-700 hover:bg-teal-800">{pending ? "Signing in…" : "Sign in"}</Button>
  </form>;
}

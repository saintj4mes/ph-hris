import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  const demoAccountsEnabled = process.env.NODE_ENV !== "production" && (process.env.APP_MODE ?? "DEV").toUpperCase() === "DEV" && process.env.DEMO_ACCOUNTS_ENABLED === "true";
  const demoAccounts = demoAccountsEnabled ? [
    { label: "HR admin", email: process.env.DEMO_HR_ADMIN_EMAIL ?? "", password: process.env.DEMO_HR_ADMIN_PASSWORD ?? "" },
    { label: "Employee", email: process.env.DEMO_EMPLOYEE_EMAIL ?? "", password: process.env.DEMO_EMPLOYEE_PASSWORD ?? "" },
  ].filter((account) => account.email && account.password) : [];
  return <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.1fr_0.9fr]">
    <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between"><Link href="/sign-in" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-400 font-black text-slate-950">ph</span><span className="font-semibold">PeopleFlow HR</span></Link><div className="max-w-lg"><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Philippine HRIS & Payroll</p><h1 className="mt-4 text-4xl font-semibold leading-tight">People operations in one clear workspace.</h1><p className="mt-4 text-sm leading-6 text-slate-400">Employee records, timekeeping, leave, and payroll in a standalone system you control.</p></div><p className="text-xs text-slate-500">Private access for employees and HR administrators</p></section>
    <section className="flex items-center justify-center p-5 sm:p-10"><div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><div className="mb-7 lg:hidden"><span className="grid size-10 place-items-center rounded-xl bg-teal-700 text-xs font-black text-white">ph</span></div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Welcome back</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Sign in to PeopleFlow</h2><p className="mt-1 mb-6 text-sm text-slate-500">Use your work account to continue.</p><SignInForm demoAccounts={demoAccounts} /><p className="mt-5 text-center text-[11px] text-slate-400">Need initial setup? Visit <Link href="/setup" className="font-semibold text-teal-700">first-run setup</Link>.</p></div></section>
  </main>;
}

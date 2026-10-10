"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Banknote,
  Bell,
  BriefcaseBusiness,
  CalendarCheck2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  GraduationCap,
  LineChart,
  ReceiptText,
  Boxes,
  ChartNoAxesCombined,
  UserCog,
  UsersRound,
  Settings2,
  ShieldAlert,
  ScrollText,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { PortalSwitcher } from "@/components/portal-switcher";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Employees", href: "/employees", icon: UsersRound },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck2 },
  { label: "Leaves", href: "/leaves", icon: BriefcaseBusiness },
  { label: "Payroll", href: "/payroll", icon: Banknote },
  { label: "Recruitment", href: "/recruitment", icon: UserCog },
  { label: "Performance", href: "/performance", icon: LineChart },
  { label: "Training", href: "/training", icon: GraduationCap },
  { label: "Expenses", href: "/expenses", icon: ReceiptText },
  { label: "Loans", href: "/loans", icon: Banknote },
  { label: "Assets", href: "/assets", icon: Boxes },
  { label: "Confidential reports", href: "/grievances", icon: ShieldAlert },
  { label: "Final settlements", href: "/settlements", icon: ScrollText },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
  { label: "Approvals", href: "/requests", icon: CalendarCheck2 },
  { label: "Company setup", href: "/settings/company", icon: Settings2 },
  { label: "Users & roles", href: "/settings/users", icon: UserCog },
  { label: "Accounting setup", href: "/settings/accounting", icon: ChartNoAxesCombined },
  { label: "Leave setup", href: "/settings/leave", icon: CalendarCheck2 },
];

const breadcrumbs: Record<string, string> = {
  dashboard: "Dashboard",
  employees: "Employees",
  attendance: "Attendance",
  leaves: "Leaves",
  payroll: "Payroll",
  recruitment: "Recruitment",
  performance: "Performance",
  training: "Training",
  expenses: "Expenses",
  loans: "Loans & repayments",
  assets: "Assets",
  grievances: "Confidential reports",
  settlements: "Final settlements",
  reports: "Reports",
  requests: "Approval queue",
  settings: "Company setup",
  runs: "Payroll runs",
  slips: "Salary slips",
};

export function AdminShell({ children, userName }: { children: ReactNode; userName: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathSegments = pathname.split("/").filter(Boolean);
  const currentSection = pathSegments[0] ?? "dashboard";
  const crumbLabel = breadcrumbs[pathSegments.at(-1) ?? ""] ?? "Details";

  const sidebar = (
    <aside className={cn("flex h-full flex-col bg-slate-950 text-slate-300", collapsed ? "w-[76px]" : "w-[252px]")}>
      <div className={cn("flex h-[72px] items-center border-b border-white/10 px-5", collapsed && "justify-center px-2")}>
        <Link href="/dashboard" className="flex items-center gap-3 text-white" aria-label="PH HRIS home">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-400 text-sm font-black text-slate-950">ph</span>
          {!collapsed && <span className="text-[15px] font-semibold tracking-tight">People<span className="text-teal-300">Flow</span></span>}
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-7">
        {!collapsed && <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p>}
        <nav className="space-y-1" aria-label="Admin navigation">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = currentSection === href.split("/")[1];
            return (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className={cn("size-[18px] shrink-0", active && "text-teal-300")} strokeWidth={1.8} />
                {!collapsed && <span>{label}</span>}
                {label === "Payroll" && !collapsed && <span className="ml-auto size-1.5 rounded-full bg-teal-300" />}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-3">
        {!collapsed && (
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs font-semibold text-white">September payroll</p>
            <p className="mt-1 text-[11px] text-slate-500">First cutoff · Posted</p>
            <Link href="/payroll/runs/PAYRUN-2026-09-1" className="mt-3 inline-flex text-xs font-semibold text-teal-300 hover:text-teal-200">
              View payroll <ChevronRight className="ml-1 size-3.5" />
            </Link>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="hidden h-10 w-full items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <><ChevronLeft className="size-4" /><span className="ml-2 text-xs">Collapse sidebar</span></>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <div className="hidden shrink-0 lg:block print:hidden">{sidebar}</div>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <button className="absolute inset-0 bg-slate-950/55" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
            <div className="relative z-10">{sidebar}</div>
            <button className="relative z-10 m-4 self-start rounded-lg bg-white p-2 text-slate-700" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X className="size-5" /></button>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7 print:hidden">
            <div className="flex items-center gap-3">
              <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="size-5" /></button>
              <div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
                <span>Workspace</span><span>/</span><span className="font-semibold text-slate-700">{crumbLabel}</span>
              </div>
              <span className="text-sm font-semibold text-slate-800 sm:hidden">{crumbLabel}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <PortalSwitcher />
              <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
                <Bell className="size-[18px]" />
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
              <div className="h-7 w-px bg-slate-200" />
              <div className="relative">
                <button onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50" aria-expanded={profileOpen} aria-label="Open profile menu">
          <span className="grid size-8 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">{userName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                  <span className="hidden text-left sm:block"><span className="block text-xs font-semibold text-slate-800">{userName}</span><span className="block text-[10px] text-slate-500">HR administrator</span></span>
                  <ChevronDown className="hidden size-4 text-slate-400 sm:block" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    <div className="border-b border-slate-100 px-3 py-2"><p className="text-xs font-semibold">{userName}</p><p className="text-[11px] text-slate-500">HR administrator</p></div>
                    <Link href="/employees/EMP-0001" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">My profile</Link>
                    <SignOutButton className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50" />
                  </div>
                )}
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 print:max-w-none print:p-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

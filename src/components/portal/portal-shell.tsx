"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Bell, CalendarDays, ChartNoAxesCombined, FileText, GraduationCap, Home, ReceiptText, ShieldAlert, UserRound } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { PortalSwitcher } from "@/components/portal-switcher";
import { SignOutButton } from "@/components/auth/sign-out-button";

const links = [
  { label: "Home", href: "/", icon: Home },
  { label: "Attendance", href: "/portal/attendance", icon: CalendarDays },
  { label: "Leaves", href: "/portal/leaves", icon: CalendarDays },
  { label: "Expenses", href: "/portal/expenses", icon: ReceiptText },
  { label: "Employee relations", href: "/portal/grievances", icon: ShieldAlert },
  { label: "Training", href: "/portal/training", icon: GraduationCap },
  { label: "Performance", href: "/portal/performance", icon: ChartNoAxesCombined },
  { label: "Salary", href: "/portal/payslips", icon: FileText },
];

export function PortalShell({ children, userName, departmentName }: { children: ReactNode; userName: string; departmentName: string }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[#f6f8f8] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-teal-700 text-[11px] font-black text-white">pf</span><span><span className="block text-sm font-bold tracking-tight">PeopleFlow</span><span className="hidden text-[10px] text-slate-500 sm:block">Employee self-service</span></span></Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Employee navigation">{links.map(({ label, href }) => <Link key={label} href={href} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition-colors", pathname === href || (href !== "/" && pathname.startsWith(href)) ? "bg-teal-50 text-teal-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}>{label}</Link>)}</nav>
          <div className="flex items-center gap-1 sm:gap-2"><PortalSwitcher /><Link href="/portal/notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell className="size-[18px]" /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-rose-500 ring-2 ring-white" /></Link><div className="hidden h-7 w-px bg-slate-200 sm:block" /><Link href="/portal/profile" className="flex items-center gap-2 rounded-full p-1.5 hover:bg-slate-50" aria-label="Employee profile"><span className="grid size-8 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">{userName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><span className="hidden text-left sm:block"><span className="block text-xs font-semibold">{userName}</span><span className="block text-[10px] text-slate-500">{departmentName}</span></span><UserRound className="hidden size-4 text-slate-400 sm:block" /></Link><SignOutButton className="ml-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800" /></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[24rem] px-4 pb-28 pt-7 sm:px-4 sm:pb-12 sm:pt-9 lg:max-w-7xl lg:px-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-6px_20px_-14px_rgba(15,23,42,0.3)] backdrop-blur lg:hidden" aria-label="Mobile employee navigation">{links.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return <Link key={label} href={href} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold", active ? "text-teal-800" : "text-slate-400")}><Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.8} /><span>{label}</span></Link>;
      })}</nav>
    </div>
  );
}

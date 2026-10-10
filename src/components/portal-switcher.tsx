"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Check, ChevronDown, LayoutDashboard, Smartphone } from "lucide-react";

export function PortalSwitcher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const inAdmin = pathname === "/dashboard" || pathname.startsWith("/employees") || pathname.startsWith("/attendance") || pathname.startsWith("/leaves") || pathname.startsWith("/payroll");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/40 sm:px-3"
      >
        <ArrowLeftRight className="size-3.5 text-teal-700" />
        <span>Switch portal</span>
        <ChevronDown className="hidden size-3.5 text-slate-400 sm:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-[60] w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Switch workspace</p>
          <Link href="/dashboard" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
            <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-700"><LayoutDashboard className="size-4" /></span>
            <span className="flex-1"><span className="block text-xs font-semibold text-slate-800">Admin portal</span><span className="block text-[10px] text-slate-500">HR workspace</span></span>
            {inAdmin && <Check className="size-4 text-teal-700" />}
          </Link>
          <Link href="/" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
            <span className="grid size-8 place-items-center rounded-lg bg-teal-50 text-teal-800"><Smartphone className="size-4" /></span>
            <span className="flex-1"><span className="block text-xs font-semibold text-slate-800">Client portal</span><span className="block text-[10px] text-slate-500">Employee self-service</span></span>
            {!inAdmin && <Check className="size-4 text-teal-700" />}
          </Link>
        </div>
      )}
    </div>
  );
}

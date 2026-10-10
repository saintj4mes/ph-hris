import Link from "next/link";
import { ArrowRight, Banknote, CalendarCheck2, ChevronRight, FileText, Plane, ReceiptText, RefreshCw } from "lucide-react";

const items = [
  { title: "Request Attendance", caption: "Report a missed time entry", href: "/portal/attendance#request-attendance", icon: CalendarCheck2 },
  { title: "Request a Shift", caption: "Ask for a shift change", href: "/portal/attendance#shift-request-form", icon: RefreshCw },
  { title: "Request Leave", caption: "Plan time away from work", href: "/portal/leaves#request-leave", icon: Plane },
  { title: "Claim an Expense", caption: "Submit a business expense", href: "/portal/expenses", icon: ReceiptText },
  { title: "Request an Advance", caption: "View or request an advance", href: "/portal/advances", icon: Banknote },
  { title: "View Salary Slips", caption: "Browse published payslips", href: "/portal/payslips", icon: FileText },
];

export function QuickLinks() {
  return (
    <section className="w-full" aria-labelledby="quick-links-heading">
      <div className="mb-3 flex items-center justify-between"><h2 id="quick-links-heading" className="text-lg font-semibold text-slate-900">Quick links</h2><span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">All services <ArrowRight className="size-3.5" /></span></div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {items.map(({ title, caption, href, icon: Icon }, index) => <Link key={title} href={href} className={`flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-slate-50 ${index < items.length - 1 ? "border-b border-slate-100" : ""}`}><span className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-600"><Icon className="size-[18px]" /></span><span className="min-w-0"><span className="block text-sm font-medium text-slate-800">{title}</span><span className="mt-0.5 block truncate text-[11px] text-slate-500">{caption}</span></span></span><ChevronRight className="size-4 shrink-0 text-slate-400" /></Link>)}
      </div>
    </section>
  );
}

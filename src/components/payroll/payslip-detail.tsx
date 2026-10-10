import Link from "next/link";
import { ArrowLeft, CircleCheck, Download, Wallet } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { PayslipTabs } from "@/components/payroll/payslip-tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SalarySlipRecord } from "@/modules/payroll/types/payslip";

export function PayslipDetail({ slip, backHref = "/payroll" }: { slip: SalarySlipRecord; backHref?: string }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 print:max-w-none print:space-y-4 lg:max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft className="size-4" />Back</Link>
        <PrintButton />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-7 print:px-0 print:py-4">
          <div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-700 print:hidden"><Wallet className="size-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Salary statement</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{slip.employeeName}</h1><p className="mt-1 text-sm text-slate-500">{slip.employeeId} · {slip.department}</p></div></div>
          <div className="text-left sm:text-right"><StatusBadge tone={slip.status === "Posted" ? "success" : "warning"}><CircleCheck className="mr-1 size-3.5" />{slip.status}</StatusBadge><p className="mt-2 text-xs text-slate-500">Payslip {slip.id}</p></div>
        </header>

        <PayslipTabs slip={slip} />
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-4 text-[11px] text-slate-500 sm:px-7 print:px-0">
          <span>Prepared for {slip.employeeName} · All amounts in Philippine pesos</span>
          <span className="inline-flex items-center gap-1"><Download className="size-3.5" />Generated from payroll records</span>
        </footer>
      </section>
    </div>
  );
}

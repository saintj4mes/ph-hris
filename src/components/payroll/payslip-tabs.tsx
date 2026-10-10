"use client";

import { useState } from "react";
import { Building2, CalendarDays, Clock3, Landmark, Wallet } from "lucide-react";
import type { SalarySlipRecord } from "@/modules/payroll/types/payslip";
import { Decimal } from "@/shared/lib/decimal";

const tabs = ["Details", "Earnings & Deductions", "Net Pay Info", "Income Tax Breakup", "Bank Details"] as const;
type Tab = (typeof tabs)[number];
const formatDate = (value: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(new Date(`${value}T00:00:00+08:00`));

export function PayslipTabs({ slip }: { slip: SalarySlipRecord }) {
  const [activeTab, setActiveTab] = useState<Tab>("Earnings & Deductions");
  const totalDeductions = new Decimal(slip.gross.replaceAll(",", "")).minus(slip.netPay.replaceAll(",", "")).toFixed(2);

  return (
    <div>
      <div role="tablist" aria-label="Payslip details" className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 pt-2 sm:px-6 print:hidden">{tabs.map((tab) => <button key={tab} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold transition-colors ${activeTab === tab ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{tab}</button>)}</div>
      <div className="p-4 sm:p-6 print:px-0 print:py-4">
        {activeTab === "Details" && <div className="grid gap-3 sm:grid-cols-2"><Field icon={<Building2 />} label="Employee" value={`${slip.employeeName} · ${slip.employeeId}`} /><Field icon={<Building2 />} label="Department" value={slip.department} /><Field icon={<CalendarDays />} label="Pay period" value={`${formatDate(slip.periodStart)} – ${formatDate(slip.periodEnd)}`} /><Field icon={<Clock3 />} label="Payroll frequency" value="Semi-monthly" /><Field icon={<Clock3 />} label="Total working days" value={slip.workingDays ?? "See attendance records"} /><Field icon={<Clock3 />} label="Payment days" value={slip.paidDays ?? "See attendance records"} /><Field icon={<Clock3 />} label="Leave without pay" value="Included in calculation snapshot" /><Field icon={<Wallet />} label="Salary structure" value="Stored in payroll input snapshot" /></div>}
        {activeTab === "Earnings & Deductions" && <><div className="grid gap-4 sm:grid-cols-2"><Breakdown title="Earnings" subtitle="Income for this payroll period" lines={slip.earnings} totalLabel="Gross Pay" total={slip.gross} tone="teal" /><Breakdown title="Deductions" subtitle="Employee contributions and adjustments" lines={slip.deductions} totalLabel="Total Deduction" total={totalDeductions} tone="rose" /></div>{slip.employerContributions?.length ? <div className="mt-4"><Breakdown title="Employer contributions" subtitle="Company-paid statutory lines" lines={slip.employerContributions} totalLabel="Employer total" total={slip.totalEmployerContributions ?? "0.00"} tone="teal" /></div> : null}<div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950 px-5 py-4 text-white"><div><p className="text-xs font-medium text-slate-300">Net take-home pay</p><p className="mt-0.5 text-[11px] text-slate-400">Amount payable for this cutoff</p></div><p className="text-2xl font-semibold tracking-tight">₱{slip.netPay}</p></div></>}
        {activeTab === "Net Pay Info" && <div className="grid gap-3 sm:grid-cols-2"><AmountCard label="Gross pay" value={slip.gross} /><AmountCard label="Total deductions" value={totalDeductions} /><AmountCard label="Net pay" value={slip.netPay} strong /><AmountCard label="Year to date" value={slip.yearToDate} /><AmountCard label="Month to date" value={slip.monthToDate ?? slip.yearToDate} /></div>}
        {activeTab === "Income Tax Breakup" && <div className="rounded-xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-4 py-3"><h3 className="text-sm font-semibold">Compensation tax summary</h3><p className="mt-1 text-xs text-slate-500">Values captured in the submitted payroll snapshot</p></div><div className="space-y-3 p-4"><Line label="Taxable compensation this cutoff" amount={slip.taxableIncome} /><Line label="Non-taxable earnings" amount={slip.nonTaxableEarnings ?? "0.00"} /><Line label="Withholding tax deducted" amount={slip.withholdingTax} /><Line label="Year-to-date taxable compensation" amount={slip.yearToDate} /></div><p className="border-t border-slate-100 px-4 py-3 text-[10px] leading-4 text-slate-500">The payslip retains the effective statutory rules and payroll inputs used for this calculation.</p></div>}
        {activeTab === "Bank Details" && <div className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-600"><Landmark className="size-5" /></span><div><h3 className="text-sm font-semibold">Payment account</h3><p className="mt-1 text-xs text-slate-500">Sensitive account details are not included in this payslip view.</p></div></div><div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2"><Field label="Payment method" value="See payroll payment record" /><Field label="Account number" value="Hidden" /><Field label="Payment date" value={slip.paymentDate ? formatDate(slip.paymentDate) : "Not recorded"} /><Field label="Status" value={slip.status} /></div></div>}
      </div>
    </div>
  );
}

function Breakdown({ title, subtitle, lines, totalLabel, total, tone }: { title: string; subtitle: string; lines: SalarySlipRecord["earnings"]; totalLabel: string; total: string; tone: "teal" | "rose" }) {
  return <section className="rounded-xl border border-slate-200 p-4 sm:p-5"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div><span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${tone === "teal" ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-700"}`}>{tone === "teal" ? "Credit" : "Debit"}</span></div><div className="mt-5 space-y-3">{lines.map((line) => <Line key={line.code} label={line.label} amount={line.amount} />)}</div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-sm font-semibold"><span>{totalLabel}</span><span className="tabular-nums">₱{total}</span></div></section>;
}

function Line({ label, amount }: { label: string; amount: string }) {
  return <div className="flex items-center justify-between gap-2 text-sm"><span className="text-slate-600">{label}</span><span className="font-medium tabular-nums text-slate-800">₱{amount}</span></div>;
}

function Field({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-3.5"><span className="mt-0.5 text-slate-400 [&>svg]:size-4">{icon ?? <Wallet />}</span><span><span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span><span className="mt-1 block text-sm font-medium text-slate-800">{value}</span></span></div>;
}

function AmountCard({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={`rounded-xl border p-4 ${strong ? "border-slate-900 bg-slate-950 text-white" : "border-slate-200 bg-white"}`}><p className={`text-xs ${strong ? "text-slate-300" : "text-slate-500"}`}>{label}</p><p className="mt-2 text-xl font-semibold tabular-nums">₱{value}</p></div>;
}

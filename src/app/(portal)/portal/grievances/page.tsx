import { MessageSquareWarning } from "lucide-react";
import { GrievanceForm } from "@/components/portal/grievance-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/shared/db/prisma";
import { requireUser } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function PortalGrievancesPage() {
  const user = await requireUser();
  if (!user.employeeId) return <p className="text-sm text-slate-500">Link your account to an employee record to use this service.</p>;
  const reports = await prisma.employeeGrievance.findMany({ where: { employeeId: user.employeeId }, orderBy: { filedAt: "desc" }, take: 30 });
  return <div className="space-y-6"><header className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-700"><MessageSquareWarning className="size-6" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Employee relations</p><h1 className="mt-1 text-2xl font-semibold">Confidential support</h1><p className="mt-1 text-sm text-slate-500">File a concern privately and follow its review status.</p></div></header><div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] items-start"><GrievanceForm /><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">My reports</h2><div className="mt-3 divide-y divide-slate-100">{reports.map((report) => <article key={report.id} className="py-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{report.title}</p><StatusBadge tone={report.status === "RESOLVED" ? "success" : "warning"}>{report.status}</StatusBadge></div><p className="mt-1 text-xs text-slate-500">{report.grievanceType.replaceAll("_", " ")} · {report.filedAt.toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })}</p>{report.resolution && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{report.resolution}</p>}</article>)}{reports.length === 0 && <p className="py-4 text-sm text-slate-500">No reports filed.</p>}</div></section></div></div>;
}

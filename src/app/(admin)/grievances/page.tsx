import { ShieldAlert } from "lucide-react";
import { GrievanceResolution } from "@/components/admin/grievance-resolution";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function GrievancesPage() {
  await requirePermission("employee_grievance", "read");
  const reports = await prisma.employeeGrievance.findMany({ include: { employee: { include: { department: true } } }, orderBy: { filedAt: "desc" }, take: 100 });
  return <div className="space-y-6"><header className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-700"><ShieldAlert className="size-6" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Employee relations</p><h1 className="mt-1 text-2xl font-semibold">Confidential reports</h1><p className="mt-1 text-sm text-slate-500">Restricted to authorized reviewers. Keep comments factual and private.</p></div></header><section className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{reports.map((report) => <article key={report.id} className="space-y-3 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold">{report.title}</p><p className="mt-1 text-xs text-slate-500">{report.employee.employeeNumber} · {report.employee.firstName} {report.employee.lastName} · {report.employee.department?.name ?? "No department"}</p><p className="mt-1 text-xs text-slate-500">{report.grievanceType.replaceAll("_", " ")} · filed {report.filedAt.toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })}</p></div><StatusBadge tone={report.status === "RESOLVED" ? "success" : "warning"}>{report.status}</StatusBadge></div><p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{report.description}</p>{report.status === "OPEN" ? <GrievanceResolution grievanceId={report.id} /> : <p className="text-xs text-slate-500">Resolution: {report.resolution ?? "—"}</p>}</article>)}{reports.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No confidential reports.</p>}</section></div>;
}

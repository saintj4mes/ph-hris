import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { PublicApplicationForm } from "@/components/recruitment/public-application-form";
import { prisma } from "@/shared/db/prisma";

export const dynamic = "force-dynamic";

export default async function CareersPage() {
  const now = new Date();
  const openings = await prisma.jobOpening.findMany({
    where: { status: "OPEN", opensOn: { lte: now }, OR: [{ closesOn: null }, { closesOn: { gte: now } }] },
    include: { company: true },
    orderBy: [{ opensOn: "desc" }, { title: "asc" }],
  });
  return <main className="min-h-screen bg-slate-50 px-4 py-12"><div className="mx-auto max-w-4xl"><Link href="/sign-in" className="text-xs font-semibold text-teal-700">Employee sign in</Link><header className="mt-6 flex items-center gap-4"><span className="grid size-14 place-items-center rounded-2xl bg-teal-50 text-teal-700"><BriefcaseBusiness className="size-7" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Careers</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Open positions</h1><p className="mt-2 text-sm text-slate-500">Explore current roles and submit an application.</p></div></header><section className="mt-8 space-y-4">{openings.map((opening) => <article key={opening.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{opening.title}</h2><p className="mt-1 text-xs text-slate-500">{opening.company.name} · {opening.location ?? "Location not specified"} · {opening.employmentType.replaceAll("_", " ")}</p></div><span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">Accepting applications</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{opening.description}</p><details className="mt-4 border-t border-slate-100 pt-4"><summary className="cursor-pointer text-sm font-semibold text-teal-700">Apply for this position</summary><PublicApplicationForm jobOpeningId={opening.id} /></details></article>)}{openings.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">There are no open positions at this time.</p>}</section></div></main>;
}

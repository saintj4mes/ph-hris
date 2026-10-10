import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftRight, CircleUserRound, ShieldCheck } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getDemoSection, adminNavigation, employeeNavigation } from "@/shared/demo/data";
import { getCurrentUser } from "@/shared/platform/auth";

export const dynamic = "force-dynamic";

export default async function InCodeDemoPage({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { path: requestedPath = "/" } = await searchParams;
  const isAdmin = user.roles.some(({ role }) => role.grants.some(({ permission }) => permission.resource === "*"));
  const isPortalView = requestedPath.startsWith("/portal/") || (!isAdmin && requestedPath === "/");
  if (!isAdmin && !isPortalView) redirect("/");
  const pathname = requestedPath === "/" && isAdmin ? "/dashboard" : requestedPath;
  const section = getDemoSection(pathname, isAdmin);
  const navigation = isPortalView ? employeeNavigation : adminNavigation;

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <Link href={isPortalView ? "/" : "/dashboard"} className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <span className="grid size-9 place-items-center rounded-xl bg-teal-700 text-xs font-black text-white">ph</span>
          <span><span className="block text-sm font-semibold">PeopleFlow HR</span><span className="block text-[10px] uppercase tracking-wider text-slate-400">{isPortalView ? "Employee portal" : "Admin workspace"}</span></span>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map(([href, label]) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
            return <Link key={href} href={href} className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${active ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50"}`}>{label}</Link>;
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          {isAdmin && <Link href={isPortalView ? "/dashboard" : "/portal/profile"} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><ArrowLeftRight className="size-4" />{isPortalView ? "Open admin preview" : "Open employee portal"}</Link>}
          <p className="mt-3 text-[10px] leading-4 text-slate-400">Local walkthrough · sample records are in code</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700">{isPortalView ? "Employee self-service" : "People operations"}</p><p className="mt-0.5 text-xs text-slate-500">{isPortalView ? "My workspace" : "Admin portal"} / {section.title}</p></div>
          <div className="flex items-center gap-3"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">Demo · no database</span><span className="hidden items-center gap-2 text-sm font-medium sm:flex"><CircleUserRound className="size-5 text-teal-700" />{user.displayName}</span><SignOutButton /></div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {navigation.map(([href, label]) => <Link key={href} href={href} className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-teal-50">{label}</Link>)}
        </nav>
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 pb-10 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">{isPortalView ? "My PeopleFlow" : "Demo company"}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{section.title}</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">{section.description}</p></div><div className="inline-flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-900"><ShieldCheck className="size-4" />Sample data · read-only</div></div>
          {section.stats.length > 0 && <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{section.stats.map((item) => <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{item.label}</p><p className="mt-2 text-xl font-semibold tabular-nums">{item.value}</p></article>)}</section>}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-semibold">{isPortalView ? "My records" : "Walkthrough records"}</h2><p className="mt-1 text-xs text-slate-500">Static demo fixtures let you explore the screen without setting up a database.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>{section.table.columns.map((column) => <th key={column} className="px-5 py-3 font-semibold">{column}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{section.table.rows.map((row, rowIndex) => <tr key={`${row[0]}-${rowIndex}`} className="align-top hover:bg-slate-50/70">{row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`} className="px-5 py-4 text-slate-700">{cell}</td>)}</tr>)}</tbody></table></div></section>
          <p className="text-xs text-slate-400">Demo mode is for exploring routes and sample workflows. Changes are not saved. Set <code className="rounded bg-slate-200 px-1">APP_MODE=LIVE</code> to use PostgreSQL and persistent records.</p>
        </main>
      </div>
    </div>
  </div>;
}

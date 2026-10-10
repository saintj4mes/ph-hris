import { redirect } from "next/navigation";
import { prisma } from "@/shared/db/prisma";
import { bootstrapFirstAdministratorAction } from "@/modules/core-hr/actions/access";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (await prisma.authUser.count()) redirect("/sign-in");
  async function setup() {
    "use server";
    await bootstrapFirstAdministratorAction();
    redirect("/sign-in");
  }
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-5"><section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">First-run setup</p><h1 className="mt-2 text-2xl font-semibold">Create the initial administrator</h1><p className="mt-3 text-sm leading-6 text-slate-600">The first administrator account is read from the server environment. Configure <code>SESSION_SECRET</code>, <code>BOOTSTRAP_ADMIN_EMAIL</code>, and <code>BOOTSTRAP_ADMIN_PASSWORD</code>, then create the account below.</p><form action={setup} className="mt-6"><button className="h-11 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">Create administrator account</button></form></section></main>;
}

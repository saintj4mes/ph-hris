import { UserRoundCog } from "lucide-react";
import { prisma } from "@/shared/db/prisma";
import { requirePermission } from "@/shared/platform/auth";
import { UserInviteForm } from "@/components/admin/user-invite-form";

export const dynamic = "force-dynamic";
export default async function UsersSettingsPage() {
  await requirePermission("user", "read");
  const [users, roles, employees] = await Promise.all([
    prisma.authUser.findMany({ include: { employee: true, roles: { include: { role: true } } }, orderBy: { email: "asc" } }),
    prisma.role.findMany({ select: { id: true, label: true }, orderBy: { label: "asc" } }),
    prisma.employee.findMany({ where: { authUser: null, status: { not: "SEPARATED" } }, select: { id: true, employeeNumber: true, firstName: true, lastName: true }, orderBy: { lastName: "asc" } }),
  ]);
  return <div className="space-y-6"><div className="flex items-center gap-3"><UserRoundCog className="size-6 text-teal-700" /><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Access control</p><h1 className="mt-1 text-2xl font-semibold">Users & roles</h1></div></div><UserInviteForm roles={roles} employees={employees} /><section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="divide-y divide-slate-100">{users.map((user) => <article key={user.id} className="flex flex-wrap items-center justify-between gap-4 p-4"><div><p className="text-sm font-semibold">{user.displayName}</p><p className="mt-1 text-xs text-slate-500">{user.email}{user.employee ? ` · ${user.employee.employeeNumber}` : " · No employee linked"}</p></div><div className="flex gap-2">{user.roles.map(({ role }) => <span key={role.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{role.label}</span>)}</div></article>)}</div></section></div>;
}

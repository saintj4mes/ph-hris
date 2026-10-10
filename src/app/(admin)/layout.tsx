import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentUser } from "@/shared/platform/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const canUseAdmin = user.roles.some(({ role }) => role.grants.some(({ permission }) => permission.resource === "*" || permission.resource === "employee" || permission.resource === "payroll" || permission.resource === "leave" || permission.resource === "attendance" || permission.resource === "company" || permission.resource === "loan" || permission.resource === "advance" || permission.resource === "employee_grievance" || permission.resource === "full_and_final"));
  if (!canUseAdmin) redirect("/");
  return <AdminShell userName={user.displayName}>{children}</AdminShell>;
}

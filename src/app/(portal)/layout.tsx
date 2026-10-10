import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import { getCurrentUser } from "@/shared/platform/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.employeeId) redirect("/dashboard");
  return <PortalShell userName={user.displayName} departmentName={user.employee?.department?.name ?? "Employee"}>{children}</PortalShell>;
}

export type DemoAccountKind = "admin" | "employee";

export function authenticateDemoAccount(email: string, password: string): DemoAccountKind | null {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail && normalizedEmail === process.env.DEMO_HR_ADMIN_EMAIL?.trim().toLowerCase() && password === process.env.DEMO_HR_ADMIN_PASSWORD) return "admin";
  if (normalizedEmail && normalizedEmail === process.env.DEMO_EMPLOYEE_EMAIL?.trim().toLowerCase() && password === process.env.DEMO_EMPLOYEE_PASSWORD) return "employee";
  return null;
}

import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Mail, MapPin } from "lucide-react";
import { getMyEmployeeProfileAction } from "@/modules/core-hr/actions/employees";

export default async function EmployeeProfilePage() {
  const employee = await getMyEmployeeProfileAction();
  const fullName = [employee.firstName, employee.middleName, employee.lastName, employee.suffix].filter(Boolean).join(" ");
  const fields = [
    { label: "Work email", value: employee.email ?? "Not provided", icon: <Mail /> },
    { label: "Department", value: employee.department?.name ?? "Not assigned", icon: <BriefcaseBusiness /> },
    { label: "Location", value: employee.workLocation ?? employee.addresses[0]?.city ?? "Not provided", icon: <MapPin /> },
    { label: "Hire date", value: employee.dateHired.toISOString().slice(0, 10), icon: <CalendarDays /> },
  ];
  return <div className="mx-auto max-w-xl space-y-5 lg:mx-0 lg:max-w-none"><Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><ArrowLeft className="size-4" />Home</Link><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:max-w-4xl lg:p-7"><div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-full bg-amber-100 text-sm font-bold text-amber-900">{employee.firstName[0]}{employee.lastName[0]}</span><div><h1 className="text-xl font-semibold">{fullName}</h1><p className="mt-1 text-xs text-slate-500">{employee.employeeNumber} · Employee profile</p></div></div><div className="mt-6 grid gap-x-8 divide-slate-100 sm:grid-cols-2 sm:divide-x">{fields.map((field) => <div key={field.label} className="flex items-center gap-3 border-b border-slate-100 py-4 sm:px-4"><span className="text-slate-400 [&>svg]:size-4">{field.icon}</span><span><span className="block text-[11px] text-slate-500">{field.label}</span><span className="mt-0.5 block text-sm font-medium">{field.value}</span></span></div>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-2">{[{ label: "Mobile", value: employee.mobilePhone }, { label: "Personal email", value: employee.personalEmail }, { label: "Designation", value: employee.designation?.title }, { label: "Employment status", value: employee.status }].map((item) => <div key={item.label} className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] text-slate-500">{item.label}</p><p className="mt-1 text-sm font-medium">{item.value ?? "Not provided"}</p></div>)}</div></section></div>;
}

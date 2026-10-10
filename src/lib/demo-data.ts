export type EmployeeStatus = "Active" | "On Leave" | "Inactive";

export type EmployeeRecord = {
  id: string;
  code: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  status: EmployeeStatus;
  location: string;
  employmentType: string;
  hireDate: string;
  monthlyRate: string;
};

export const employees: EmployeeRecord[] = [
  {
    id: "EMP-0001",
    code: "EMP-0001",
    fullName: "Maria Santos",
    email: "maria.santos@example.com",
    department: "Finance",
    designation: "Payroll Specialist",
    status: "Active",
    location: "Makati City",
    employmentType: "Regular · Full time",
    hireDate: "2022-06-13",
    monthlyRate: "30,000.00",
  },
  {
    id: "EMP-0002",
    code: "EMP-0002",
    fullName: "Carlo Reyes",
    email: "carlo.reyes@example.com",
    department: "Operations",
    designation: "Operations Lead",
    status: "Active",
    location: "Quezon City",
    employmentType: "Regular · Full time",
    hireDate: "2021-02-08",
    monthlyRate: "48,000.00",
  },
  {
    id: "EMP-0003",
    code: "EMP-0003",
    fullName: "Angela Dela Cruz",
    email: "angela.delacruz@example.com",
    department: "People",
    designation: "People Partner",
    status: "On Leave",
    location: "Makati City",
    employmentType: "Regular · Full time",
    hireDate: "2023-09-18",
    monthlyRate: "38,000.00",
  },
  {
    id: "EMP-0004",
    code: "EMP-0004",
    fullName: "Paolo Garcia",
    email: "paolo.garcia@example.com",
    department: "Technology",
    designation: "Software Engineer",
    status: "Active",
    location: "Pasig City",
    employmentType: "Regular · Full time",
    hireDate: "2024-01-15",
    monthlyRate: "55,000.00",
  },
  {
    id: "EMP-0005",
    code: "EMP-0005",
    fullName: "Liza Mendoza",
    email: "liza.mendoza@example.com",
    department: "Customer Success",
    designation: "Client Support Associate",
    status: "Inactive",
    location: "Cebu City",
    employmentType: "Project based",
    hireDate: "2023-04-03",
    monthlyRate: "27,000.00",
  },
];

import type { SalarySlipRecord } from "@/modules/payroll/types/payslip";
export type { SalarySlipRecord, PayslipLine } from "@/modules/payroll/types/payslip";
export const salarySlips: SalarySlipRecord[] = [
  {
    id: "SLIP-2026-09-EMP-0001",
    employeeId: "EMP-0001",
    employeeName: "Maria Santos",
    department: "Finance",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-15",
    workingDays: "11",
    paidDays: "11",
    gross: "15,209.14",
    withholdingTax: "309.13",
    sss: "1,500.00",
    philHealth: "750.00",
    pagIbig: "200.00",
    netPay: "12,377.89",
    yearToDate: "270,000.00",
    taxableIncome: "12,477.88",
    status: "Posted",
    earnings: [
      { code: "BASIC", label: "Basic pay", amount: "15,000.00" },
      { code: "OVERTIME", label: "Overtime pay", amount: "180.29" },
      { code: "NIGHT_DIFF", label: "Night shift differential", amount: "28.85" },
      { code: "DE_MINIMIS", label: "De minimis benefits", amount: "0.00" },
    ],
    deductions: [
      { code: "SSS_EE", label: "SSS employee share", amount: "1,500.00" },
      { code: "PHILHEALTH_EE", label: "PhilHealth employee share", amount: "750.00" },
      { code: "PAGIBIG_EE", label: "Pag-IBIG employee share", amount: "200.00" },
      { code: "WITHHOLDING_TAX", label: "Withholding tax", amount: "309.13" },
      { code: "LATE", label: "Late / undertime", amount: "72.12" },
    ],
  },
  {
    id: "SLIP-2026-09-EMP-0002",
    employeeId: "EMP-0002",
    employeeName: "Carlo Reyes",
    department: "Operations",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-15",
    workingDays: "11",
    paidDays: "11",
    gross: "25,000.00",
    withholdingTax: "1,500.00",
    sss: "1,500.00",
    philHealth: "750.00",
    pagIbig: "200.00",
    netPay: "21,050.00",
    yearToDate: "450,000.00",
    taxableIncome: "22,550.00",
    status: "Posted",
    earnings: [
      { code: "BASIC", label: "Basic pay", amount: "25,000.00" },
      { code: "OVERTIME", label: "Overtime pay", amount: "0.00" },
      { code: "NIGHT_DIFF", label: "Night shift differential", amount: "0.00" },
      { code: "DE_MINIMIS", label: "De minimis benefits", amount: "0.00" },
    ],
    deductions: [
      { code: "SSS_EE", label: "SSS employee share", amount: "1,500.00" },
      { code: "PHILHEALTH_EE", label: "PhilHealth employee share", amount: "750.00" },
      { code: "PAGIBIG_EE", label: "Pag-IBIG employee share", amount: "200.00" },
      { code: "WITHHOLDING_TAX", label: "Withholding tax", amount: "1,500.00" },
      { code: "LATE", label: "Late / undertime", amount: "0.00" },
    ],
  },
  {
    id: "SLIP-2026-09-EMP-0003",
    employeeId: "EMP-0003",
    employeeName: "Angela Dela Cruz",
    department: "People",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-15",
    workingDays: "11",
    paidDays: "10",
    gross: "19,200.00",
    withholdingTax: "700.00",
    sss: "1,000.00",
    philHealth: "480.00",
    pagIbig: "200.00",
    netPay: "16,820.00",
    yearToDate: "345,000.00",
    taxableIncome: "17,520.00",
    status: "Posted",
    earnings: [
      { code: "BASIC", label: "Basic pay", amount: "19,200.00" },
      { code: "OVERTIME", label: "Overtime pay", amount: "0.00" },
      { code: "NIGHT_DIFF", label: "Night shift differential", amount: "0.00" },
      { code: "DE_MINIMIS", label: "De minimis benefits", amount: "0.00" },
    ],
    deductions: [
      { code: "SSS_EE", label: "SSS employee share", amount: "1,000.00" },
      { code: "PHILHEALTH_EE", label: "PhilHealth employee share", amount: "480.00" },
      { code: "PAGIBIG_EE", label: "Pag-IBIG employee share", amount: "200.00" },
      { code: "WITHHOLDING_TAX", label: "Withholding tax", amount: "700.00" },
      { code: "LATE", label: "Late / undertime", amount: "0.00" },
    ],
  },
];

export const payrollRun = {
  id: "PAYRUN-2026-09-1",
  label: "September 2026 · First cutoff",
  periodStart: "2026-09-01",
  periodEnd: "2026-09-15",
  paymentDate: "2026-09-20",
  status: "Posted" as const,
  gross: "59,409.14",
  withholdingTax: "2,509.13",
  sss: "4,000.00",
  philHealth: "1,980.00",
  pagIbig: "600.00",
  netPay: "50,247.89",
};

export type EmployeeRequest = {
  id: string;
  kind: "Leave Application" | "Expense Claim" | "Shift Request" | "Attendance Request";
  title: string;
  dateLabel: string;
  detail: string;
  status: "Open" | "Approved" | "Rejected";
  employee?: string;
};

export const myRequests: EmployeeRequest[] = [
  { id: "LEAVE-2026-014", kind: "Leave Application", title: "Vacation leave", dateLabel: "Oct 23–24 · 2 days", detail: "Family occasion", status: "Open" },
  { id: "ATT-2026-008", kind: "Attendance Request", title: "Attendance correction", dateLabel: "Oct 7 · 1 day", detail: "Forgot to clock out", status: "Approved" },
  { id: "SHIFT-2026-004", kind: "Shift Request", title: "Shift swap", dateLabel: "Oct 16 · Day shift", detail: "Requested swap with Carlo Reyes", status: "Open" },
  { id: "EXP-2026-022", kind: "Expense Claim", title: "Client transportation", dateLabel: "Oct 2 · ₱680.00", detail: "Taxi fare · client meeting", status: "Approved" },
];

export const teamRequests: EmployeeRequest[] = [
  { id: "LEAVE-2026-018", kind: "Leave Application", title: "Sick leave", dateLabel: "Oct 14 · 1 day", detail: "Medical appointment", status: "Open", employee: "Carlo Reyes" },
  { id: "ATT-2026-011", kind: "Attendance Request", title: "Attendance correction", dateLabel: "Oct 8 · 1 day", detail: "Biometric reader did not record check-in", status: "Open", employee: "Paolo Garcia" },
  { id: "EXP-2026-025", kind: "Expense Claim", title: "Team supplies", dateLabel: "Oct 6 · ₱2,450.00", detail: "Office supplies receipt", status: "Open", employee: "Angela Dela Cruz" },
];

export const upcomingShifts = [
  { id: "SHIFT-ASG-101", title: "Day shift", date: "Mon, Oct 12", time: "8:00 AM – 5:00 PM", location: "Makati Office" },
  { id: "SHIFT-ASG-102", title: "Day shift", date: "Tue, Oct 13", time: "8:00 AM – 5:00 PM", location: "Makati Office" },
  { id: "SHIFT-ASG-103", title: "Flexible shift", date: "Wed, Oct 14", time: "9:00 AM – 6:00 PM", location: "Makati Office" },
];

export const holidays = [
  { title: "All Saints’ Day", date: "2026-11-01", type: "Regular holiday" },
  { title: "Bonifacio Day", date: "2026-11-30", type: "Regular holiday" },
  { title: "Feast of the Immaculate Conception", date: "2026-12-08", type: "Special non-working day" },
  { title: "Christmas Day", date: "2026-12-25", type: "Regular holiday" },
];

export const attendanceCalendarEvents: Record<string, "Present" | "Half Day" | "Absent" | "On Leave" | "Holiday"> = {
  "2026-10-01": "Present",
  "2026-10-02": "Present",
  "2026-10-05": "Present",
  "2026-10-06": "Present",
  "2026-10-07": "Half Day",
  "2026-10-08": "Present",
  "2026-10-09": "Present",
  "2026-10-10": "Present",
  "2026-10-12": "Present",
  "2026-10-13": "Present",
  "2026-10-14": "On Leave",
  "2026-10-15": "Present",
  "2026-10-16": "Present",
  "2026-10-19": "Present",
  "2026-10-20": "Absent",
  "2026-10-21": "Present",
};

export const recentLeaveRequests = [
  { id: "LEAVE-2026-014", type: "Vacation leave", dates: "Oct 23–24, 2026", days: "2 days", status: "Open" },
  { id: "LEAVE-2026-009", type: "Sick leave", dates: "Sep 18, 2026", days: "1 day", status: "Approved" },
];

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Manila",
    ...options,
  }).format(new Date(`${date}T12:00:00+08:00`));
}

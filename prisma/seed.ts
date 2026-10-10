import { SchedulePublicationStatus, StatutoryAgency, StatutoryRuleKind, SalaryComponentKind, SalarySlipDetailKind } from "@prisma/client";
import Decimal from "decimal.js";
import { PHILIPPINE_STATUTORY_SOURCES } from "../src/modules/statutory/philippine-rules";
import { hashPassword } from "../src/shared/platform/password";
import { prisma } from "../src/shared/db/prisma";

type Agency = StatutoryAgency;
type RuleKind = StatutoryRuleKind;

async function upsertSchedule(args: {
  agency: Agency;
  ruleKind: RuleKind;
  name: string;
  version: string;
  effectiveFrom: string;
  status: SchedulePublicationStatus;
  sourceUrl?: string;
  sourceReference?: string;
  notes?: string;
}) {
  return prisma.statutorySchedule.upsert({
    where: { agency_ruleKind_version: { agency: args.agency, ruleKind: args.ruleKind, version: args.version } },
    update: {
      name: args.name,
      effectiveFrom: new Date(`${args.effectiveFrom}T00:00:00.000Z`),
      publicationStatus: args.status,
      sourceUrl: args.sourceUrl,
      sourceReference: args.sourceReference,
      notes: args.notes,
    },
    create: {
      agency: args.agency,
      ruleKind: args.ruleKind,
      name: args.name,
      version: args.version,
      effectiveFrom: new Date(`${args.effectiveFrom}T00:00:00.000Z`),
      publicationStatus: args.status,
      sourceUrl: args.sourceUrl,
      sourceReference: args.sourceReference,
      notes: args.notes,
    },
  });
}

async function upsertSlab(
  scheduleId: string,
  code: string,
  payrollPeriod: string,
  fields: {
    contributionProgram?: string;
    compensationMin?: string;
    compensationMax?: string;
    contributionBaseFloor?: string;
    contributionBaseCeiling?: string;
    employeeRate?: string;
    employerRate?: string;
    employeeFixedAmount?: string;
    employerFixedAmount?: string;
    taxBaseAmount?: string;
    marginalRate?: string;
    marginalOver?: string;
    metadata?: object;
  },
) {
  const where = { scheduleId_code_payrollPeriod: { scheduleId, code, payrollPeriod } };
  await prisma.statutorySlab.upsert({
    where,
    update: fields,
    create: { scheduleId, code, payrollPeriod, ...fields },
  });
}

async function seedSss() {
  const schedule = await upsertSchedule({
    agency: "SSS",
    ruleKind: "CONTRIBUTION",
    name: "SSS Business Employers and Employees Contribution Schedule",
    version: "2025-01",
    effectiveFrom: "2025-01-01",
    status: "PUBLISHED",
    sourceUrl: PHILIPPINE_STATUTORY_SOURCES.sss,
    sourceReference: "SSS Circular 2024-006",
  });

  for (let index = 0; index <= 60; index += 1) {
    const min = index === 0 ? 0 : 5250 + (index - 1) * 500;
    const msc = index === 0 ? 5000 : 5500 + (index - 1) * 500;
    const max = index === 60 ? undefined : new Decimal(min).plus("499.99").toFixed(2);
    const regularBase = Decimal.min(msc, 20000);
    const mpfBase = Decimal.max(new Decimal(msc).minus(20000), 0);
    const prefix = `MSC-${String(msc).padStart(5, "0")}`;
    const bracket = {
      compensationMin: min.toFixed(2),
      compensationMax: max,
      contributionBaseFloor: msc.toFixed(2),
      contributionBaseCeiling: msc.toFixed(2),
    };

    await upsertSlab(schedule.id, `${prefix}-SS`, "MONTHLY", {
      ...bracket,
      contributionProgram: "SS",
      employeeRate: "0.05",
      employerRate: "0.10",
      employeeFixedAmount: regularBase.mul("0.05").toFixed(2),
      employerFixedAmount: regularBase.mul("0.10").toFixed(2),
      metadata: { monthlySalaryCredit: msc, maximumRegularMsc: 20000 },
    });
    await upsertSlab(schedule.id, `${prefix}-MPF`, "MONTHLY", {
      ...bracket,
      contributionProgram: "MPF_WISP",
      employeeRate: "0.05",
      employerRate: "0.10",
      employeeFixedAmount: mpfBase.mul("0.05").toFixed(2),
      employerFixedAmount: mpfBase.mul("0.10").toFixed(2),
      metadata: { monthlySalaryCredit: msc, appliesAboveMsc: 20000, programName: "Mandatory Provident Fund / WISP" },
    });
    await upsertSlab(schedule.id, `${prefix}-EC`, "MONTHLY", {
      ...bracket,
      contributionProgram: "EC",
      employeeFixedAmount: "0.00",
      employerFixedAmount: msc <= 14500 ? "10.00" : "30.00",
      metadata: { monthlySalaryCredit: msc, employerOnly: true },
    });
  }
}

async function seedPhilHealth() {
  const schedule = await upsertSchedule({
    agency: "PHILHEALTH",
    ruleKind: "CONTRIBUTION",
    name: "PhilHealth Direct Contributor Premium Schedule",
    version: "2025-01",
    effectiveFrom: "2025-01-01",
    status: "PUBLISHED",
    sourceUrl: PHILIPPINE_STATUTORY_SOURCES.philHealth,
    sourceReference: "PhilHealth Advisory 2025-0002",
  });
  await upsertSlab(schedule.id, "EMPLOYED-DIRECT-CONTRIBUTOR", "MONTHLY", {
    contributionProgram: "PHILHEALTH",
    compensationMin: "0.00",
    contributionBaseFloor: "10000.00",
    contributionBaseCeiling: "100000.00",
    employeeRate: "0.025",
    employerRate: "0.025",
    metadata: {
      totalPremiumRate: "0.05",
      calculationBase: "MONTHLY_BASIC_SALARY",
      excludes: ["overtime", "allowances", "13th-month-pay", "bonuses", "gratuities", "late-undertime-lwp-deductions"],
    },
  });
}

async function seedPagIbig() {
  const schedule = await upsertSchedule({
    agency: "PAGIBIG",
    ruleKind: "CONTRIBUTION",
    name: "Pag-IBIG Fund Membership Contribution Schedule",
    version: "2024-02",
    effectiveFrom: "2024-02-01",
    status: "PUBLISHED",
    sourceUrl: "https://www.pagibigfund.gov.ph/document/pdf/circulars/provident/HDMF%20Circular%20No.%20274%20-%20Revised%20Guidelines%20on%20Pag-IBIG%20Fund%20Membership.pdf",
    sourceReference: "HDMF Circular 274",
  });
  await upsertSlab(schedule.id, "FUND-SALARY-1500-AND-BELOW", "MONTHLY", {
    contributionProgram: "PAGIBIG",
    compensationMin: "0.00",
    compensationMax: "1500.00",
    contributionBaseCeiling: "10000.00",
    employeeRate: "0.01",
    employerRate: "0.02",
    metadata: { maximumFundSalary: "10000.00" },
  });
  await upsertSlab(schedule.id, "FUND-SALARY-OVER-1500", "MONTHLY", {
    contributionProgram: "PAGIBIG",
    compensationMin: "1500.01",
    contributionBaseCeiling: "10000.00",
    employeeRate: "0.02",
    employerRate: "0.02",
    metadata: { maximumFundSalary: "10000.00" },
  });
}

async function seedBir() {
  const schedule = await upsertSchedule({
    agency: "BIR",
    ruleKind: "WITHHOLDING_TAX",
    name: "TRAIN Compensation Withholding Tax Tables",
    version: "2023-01",
    effectiveFrom: "2023-01-01",
    status: "PUBLISHED",
    sourceUrl: PHILIPPINE_STATUTORY_SOURCES.bir,
    sourceReference: "RR 11-2018 Annex E; effective 2023 onward",
  });

  const semiMonthly: Array<[string, string, string | undefined, string, string, string]> = [
    ["SM-1", "0", "10416.99", "0", "0", "0"],
    ["SM-2", "10417", "16666.99", "0", "0.15", "10417"],
    ["SM-3", "16667", "33332.99", "937.50", "0.20", "16667"],
    ["SM-4", "33333", "83332.99", "4270.70", "0.25", "33333"],
    ["SM-5", "83333", "333332.99", "16770.70", "0.30", "83333"],
    ["SM-6", "333333", undefined, "91770.70", "0.35", "333333"],
  ];
  for (const [code, minimum, maximum, baseTax, marginalRate, marginalOver] of semiMonthly) {
    await upsertSlab(schedule.id, code, "SEMI_MONTHLY", {
      compensationMin: minimum,
      compensationMax: maximum,
      taxBaseAmount: baseTax,
      marginalRate,
      marginalOver,
    });
  }

  const annual: Array<[string, string, string | undefined, string, string, string]> = [
    ["ANNUAL-1", "0", "250000", "0", "0", "0"],
    ["ANNUAL-2", "250000.01", "400000", "0", "0.15", "250000"],
    ["ANNUAL-3", "400000.01", "800000", "22500", "0.20", "400000"],
    ["ANNUAL-4", "800000.01", "2000000", "102500", "0.25", "800000"],
    ["ANNUAL-5", "2000000.01", "8000000", "402500", "0.30", "2000000"],
    ["ANNUAL-6", "8000000.01", undefined, "2202500", "0.35", "8000000"],
  ];
  for (const [code, minimum, maximum, baseTax, marginalRate, marginalOver] of annual) {
    await upsertSlab(schedule.id, code, "ANNUAL", {
      compensationMin: minimum,
      compensationMax: maximum,
      taxBaseAmount: baseTax,
      marginalRate,
      marginalOver,
    });
  }

  const fbt = await upsertSchedule({
    agency: "BIR",
    ruleKind: "FRINGE_BENEFIT_TAX",
    name: "Fringe Benefits Tax for Employees Other Than Rank and File",
    version: "2018-01",
    effectiveFrom: "2018-01-01",
    status: "PUBLISHED",
    sourceUrl: "https://bir-cdn.bir.gov.ph/local/pdf/RR%20No.%208-2018.pdf",
    sourceReference: "RR 8-2018, effective January 1, 2018",
  });
  await upsertSlab(fbt.id, "FBT-CITIZEN-RESIDENT-ALIEN", "QUARTERLY", {
    contributionProgram: "FRINGE_BENEFIT_TAX",
    employeeRate: "0.35",
    marginalRate: "0.35",
    marginalOver: "0.65",
    metadata: { grossUpDivisor: "0.65", recipientClass: "OTHER_THAN_RANK_AND_FILE" },
  });
}

async function seedPending2026() {
  const schedules: Array<{ agency: Agency; ruleKind: RuleKind; name: string }> = [
    { agency: "SSS", ruleKind: "CONTRIBUTION", name: "SSS 2026 schedule awaiting official confirmation" },
    { agency: "PHILHEALTH", ruleKind: "CONTRIBUTION", name: "PhilHealth 2026 schedule awaiting official confirmation" },
    { agency: "PAGIBIG", ruleKind: "CONTRIBUTION", name: "Pag-IBIG 2026 schedule awaiting official confirmation" },
    { agency: "BIR", ruleKind: "WITHHOLDING_TAX", name: "BIR 2026 withholding schedule awaiting confirmation" },
    { agency: "BIR", ruleKind: "FRINGE_BENEFIT_TAX", name: "BIR 2026 fringe benefit tax schedule awaiting confirmation" },
  ];
  for (const item of schedules) {
    await upsertSchedule({
      ...item,
      version: "2026-PENDING",
      effectiveFrom: "2026-01-01",
      status: "PENDING_CONFIRMATION",
      notes: "No superseding official 2026 schedule was found during scaffold research. Do not treat this placeholder as a confirmed legal rate table.",
    });
  }
}

function requiredDemoValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Set ${name} to enable demo account seeding.`);
  return value;
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function seedDemoAccounts() {
  if (process.env.DEMO_ACCOUNTS_ENABLED !== "true") return;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo accounts cannot be seeded when NODE_ENV=production.");
  }

  const adminEmail = requiredDemoValue("DEMO_HR_ADMIN_EMAIL").toLowerCase();
  const adminPassword = requiredDemoValue("DEMO_HR_ADMIN_PASSWORD");
  const employeeEmail = requiredDemoValue("DEMO_EMPLOYEE_EMAIL").toLowerCase();
  const employeePassword = requiredDemoValue("DEMO_EMPLOYEE_PASSWORD");
  if (adminEmail === employeeEmail) throw new Error("Demo HR admin and employee emails must be different.");

  const company = await prisma.company.upsert({
    where: { id: "demo-ph-hris-company" },
    update: { name: "Demo Philippine Company", legalName: "Demo Philippine Company, Inc." },
    create: { id: "demo-ph-hris-company", name: "Demo Philippine Company", legalName: "Demo Philippine Company, Inc." },
  });
  await prisma.payrollPolicy.upsert({
    where: { companyId: company.id },
    update: { monthlyToDailyDivisor: new Decimal(26), scheduledHoursPerDay: new Decimal(8) },
    create: { companyId: company.id, monthlyToDailyDivisor: new Decimal(26), scheduledHoursPerDay: new Decimal(8) },
  });
  const department = await prisma.department.upsert({
    where: { companyId_name: { companyId: company.id, name: "People Operations" } },
    update: {},
    create: { companyId: company.id, name: "People Operations" },
  });
  const designation = await prisma.designation.upsert({
    where: { companyId_title: { companyId: company.id, title: "HR Administrator" } },
    update: {},
    create: { companyId: company.id, title: "HR Administrator" },
  });
  const employeeDesignation = await prisma.designation.upsert({
    where: { companyId_title: { companyId: company.id, title: "People Operations Associate" } },
    update: {},
    create: { companyId: company.id, title: "People Operations Associate" },
  });

  const adminEmployee = await prisma.employee.upsert({
    where: { companyId_employeeNumber: { companyId: company.id, employeeNumber: "DEMO-HR-001" } },
    update: { firstName: "Alex", lastName: "HR Admin", email: adminEmail, departmentId: department.id, designationId: designation.id },
    create: {
      employeeNumber: "DEMO-HR-001", firstName: "Alex", lastName: "HR Admin", email: adminEmail,
      status: "ACTIVE", employmentType: "REGULAR", workerClass: "MANAGERIAL", dateHired: dateOnly("2024-01-08"),
      companyId: company.id, departmentId: department.id, designationId: designation.id,
    },
  });
  const employee = await prisma.employee.upsert({
    where: { companyId_employeeNumber: { companyId: company.id, employeeNumber: "DEMO-EMP-001" } },
    update: { firstName: "Maria", lastName: "Santos", email: employeeEmail, departmentId: department.id, designationId: employeeDesignation.id },
    create: {
      employeeNumber: "DEMO-EMP-001", firstName: "Maria", lastName: "Santos", email: employeeEmail,
      status: "ACTIVE", employmentType: "REGULAR", workerClass: "RANK_AND_FILE", dateHired: dateOnly("2024-03-04"),
      companyId: company.id, departmentId: department.id, designationId: employeeDesignation.id,
      tin: "000-000-000-000", sssNumber: "00-0000000-0", philHealthNumber: "00-000000000-0", pagIbigNumber: "0000-0000-0000",
    },
  });

  const hrRole = await prisma.role.upsert({
    where: { code: "DEMO_HR_ADMIN" },
    update: { label: "Demo HR Administrator" },
    create: { code: "DEMO_HR_ADMIN", label: "Demo HR Administrator", description: "Local demo access to HR administration.", system: true },
  });
  const employeeRole = await prisma.role.upsert({
    where: { code: "EMPLOYEE" },
    update: {},
    create: { code: "EMPLOYEE", label: "Employee self-service", description: "Employee portal access without administrative permissions.", system: true },
  });
  const allPermission = await prisma.permission.upsert({
    where: { resource_action: { resource: "*", action: "*" } },
    update: {},
    create: { resource: "*", action: "*", description: "Local demo administrator access." },
  });
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: hrRole.id, permissionId: allPermission.id } },
    update: {},
    create: { roleId: hrRole.id, permissionId: allPermission.id },
  });

  const admin = await prisma.authUser.upsert({
    where: { email: adminEmail },
    update: { displayName: "Alex HR Admin", employeeId: adminEmployee.id, passwordHash: await hashPassword(adminPassword), active: true },
    create: { email: adminEmail, displayName: "Alex HR Admin", employeeId: adminEmployee.id, passwordHash: await hashPassword(adminPassword) },
  });
  const staffUser = await prisma.authUser.upsert({
    where: { email: employeeEmail },
    update: { displayName: "Maria Santos", employeeId: employee.id, passwordHash: await hashPassword(employeePassword), active: true },
    create: { email: employeeEmail, displayName: "Maria Santos", employeeId: employee.id, passwordHash: await hashPassword(employeePassword) },
  });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: admin.id, roleId: hrRole.id } }, update: {}, create: { userId: admin.id, roleId: hrRole.id } });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: staffUser.id, roleId: employeeRole.id } }, update: {}, create: { userId: staffUser.id, roleId: employeeRole.id } });

  const eligibilityRules: Array<{ agency: StatutoryAgency; ruleCode: string }> = [
    { agency: StatutoryAgency.SSS, ruleCode: "SSS" },
    { agency: StatutoryAgency.PHILHEALTH, ruleCode: "PHILHEALTH" },
    { agency: StatutoryAgency.PAGIBIG, ruleCode: "PAGIBIG" },
    { agency: StatutoryAgency.BIR, ruleCode: "BIR_COMPENSATION_TAX" },
    { agency: StatutoryAgency.BIR, ruleCode: "FRINGE_BENEFIT_TAX" },
    { agency: StatutoryAgency.LABOR, ruleCode: "OVERTIME" },
    { agency: StatutoryAgency.LABOR, ruleCode: "NIGHT_DIFFERENTIAL" },
  ];
  for (const { agency, ruleCode } of eligibilityRules) {
    await prisma.statutoryEligibility.upsert({
      where: { id: `demo-elig-${employee.id}-${ruleCode}` },
      update: { eligible: true, reason: "Demo fixture; HR should verify eligibility before production payroll." },
      create: {
        id: `demo-elig-${employee.id}-${ruleCode}`, employeeId: employee.id, agency, ruleCode,
        eligible: true, effectiveFrom: dateOnly("2026-01-01"), reason: "Demo fixture; HR should verify eligibility before production payroll.", createdBy: admin.id,
      },
    });
  }

  const basicComponent = await prisma.salaryComponent.upsert({
    where: { companyId_code: { companyId: company.id, code: "BASIC" } },
    update: { name: "Basic Salary", kind: SalaryComponentKind.EARNING, taxable: true, active: true },
    create: { companyId: company.id, code: "BASIC", name: "Basic Salary", kind: SalaryComponentKind.EARNING, taxable: true },
  });
  const salaryStructure = await prisma.salaryStructure.upsert({
    where: { companyId_code: { companyId: company.id, code: "DEMO-MONTHLY" } },
    update: { name: "Demo Monthly Structure", payFrequency: "SEMI_MONTHLY", active: true },
    create: { companyId: company.id, code: "DEMO-MONTHLY", name: "Demo Monthly Structure", payFrequency: "SEMI_MONTHLY" },
  });
  await prisma.salaryStructureComponent.upsert({
    where: { salaryStructureId_salaryComponentId: { salaryStructureId: salaryStructure.id, salaryComponentId: basicComponent.id } },
    update: { amount: new Decimal(30000), formulaOverride: null, displayOrder: 1 },
    create: { salaryStructureId: salaryStructure.id, salaryComponentId: basicComponent.id, amount: new Decimal(30000), displayOrder: 1 },
  });
  await prisma.salaryAssignment.upsert({
    where: { employeeId_effectiveFrom: { employeeId: employee.id, effectiveFrom: dateOnly("2026-01-01") } },
    update: { payType: "MONTHLY", monthlyRate: new Decimal(30000), companyId: company.id, salaryStructureId: salaryStructure.id },
    create: { employeeId: employee.id, companyId: company.id, payType: "MONTHLY", monthlyRate: new Decimal(30000), effectiveFrom: dateOnly("2026-01-01"), createdBy: admin.id, salaryStructureId: salaryStructure.id },
  });
  const structureAssignment = await prisma.salaryStructureAssignment.findFirst({ where: { employeeId: employee.id, salaryStructureId: salaryStructure.id, effectiveFrom: dateOnly("2026-01-01") } });
  if (structureAssignment) {
    await prisma.salaryStructureAssignment.update({ where: { id: structureAssignment.id }, data: { baseAmount: new Decimal(30000), status: "ACTIVE", createdBy: admin.id } });
  } else {
    await prisma.salaryStructureAssignment.create({ data: { employeeId: employee.id, salaryStructureId: salaryStructure.id, effectiveFrom: dateOnly("2026-01-01"), baseAmount: new Decimal(30000), createdBy: admin.id } });
  }

  const vacation = await prisma.leaveType.upsert({
    where: { companyId_code: { companyId: company.id, code: "VL" } }, update: { name: "Vacation Leave", paid: true, active: true },
    create: { companyId: company.id, code: "VL", name: "Vacation Leave", paid: true },
  });
  const sick = await prisma.leaveType.upsert({
    where: { companyId_code: { companyId: company.id, code: "SL" } }, update: { name: "Sick Leave", paid: true, active: true },
    create: { companyId: company.id, code: "SL", name: "Sick Leave", paid: true },
  });
  const leavePeriod = await prisma.leavePeriod.upsert({
    where: { companyId_name: { companyId: company.id, name: "2026 Calendar Year" } },
    update: { startsOn: dateOnly("2026-01-01"), endsOn: dateOnly("2026-12-31"), active: true },
    create: { companyId: company.id, name: "2026 Calendar Year", startsOn: dateOnly("2026-01-01"), endsOn: dateOnly("2026-12-31"), active: true },
  });
  const leavePolicy = await prisma.leavePolicy.upsert({
    where: { companyId_name_effectiveFrom: { companyId: company.id, name: "Demo Standard Leave Policy", effectiveFrom: dateOnly("2026-01-01") } },
    update: { effectiveTo: null, active: true },
    create: { companyId: company.id, name: "Demo Standard Leave Policy", effectiveFrom: dateOnly("2026-01-01") },
  });
  for (const [leaveType, days] of [[vacation, "15"], [sick, "10"]] as const) {
    await prisma.leavePolicyDetail.upsert({
      where: { leavePolicyId_leaveTypeId: { leavePolicyId: leavePolicy.id, leaveTypeId: leaveType.id } },
      update: { annualEntitlement: new Decimal(days), accrualFrequency: "ANNUAL" },
      create: { leavePolicyId: leavePolicy.id, leaveTypeId: leaveType.id, annualEntitlement: new Decimal(days), accrualFrequency: "ANNUAL" },
    });
  }
  const employeePolicyAssignment = await prisma.employeeLeavePolicyAssignment.upsert({
    where: { employeeId_leavePolicyId_effectiveFrom: { employeeId: employee.id, leavePolicyId: leavePolicy.id, effectiveFrom: dateOnly("2026-01-01") } },
    update: { status: "ACTIVE", effectiveTo: null, createdBy: admin.id },
    create: { employeeId: employee.id, leavePolicyId: leavePolicy.id, effectiveFrom: dateOnly("2026-01-01"), createdBy: admin.id },
  });
  for (const [leaveType, days] of [[vacation, "15"], [sick, "10"]] as const) {
    const allocation = await prisma.leaveAllocation.upsert({
      where: { employeeId_leaveTypeId_leavePeriodId: { employeeId: employee.id, leaveTypeId: leaveType.id, leavePeriodId: leavePeriod.id } },
      update: { allocatedDays: new Decimal(days) },
      create: { employeeId: employee.id, leaveTypeId: leaveType.id, leavePeriodId: leavePeriod.id, allocatedDays: new Decimal(days) },
    });
    const accrualKey = `policy-accrual:${employeePolicyAssignment.id}:${leaveType.id}:${leavePeriod.id}`;
    await prisma.leaveLedgerEntry.upsert({
      where: { id: `demo-leave-ledger-${leaveType.code}` },
      update: { days: new Decimal(days), balanceAfter: new Decimal(days), allocationId: allocation.id, entryType: "ACCRUAL", sourceKey: accrualKey, description: "2026 demo policy accrual" },
      create: {
        id: `demo-leave-ledger-${leaveType.code}`, employeeId: employee.id, leaveTypeId: leaveType.id,
        allocationId: allocation.id, entryType: "ACCRUAL", postingDate: dateOnly("2026-12-31"),
        days: new Decimal(days), balanceAfter: new Decimal(days), description: "2026 demo policy accrual", createdBy: admin.id, sourceKey: accrualKey,
      },
    });
  }
  const leaveApplication = await prisma.leaveApplication.upsert({
    where: { id: "demo-leave-application-vacation" },
    update: { employeeId: employee.id, leaveTypeId: vacation.id, fromDate: dateOnly("2026-11-12"), toDate: dateOnly("2026-11-13"), totalDays: new Decimal(2), reason: "Demo: family commitment", status: "OPEN" },
    create: {
      id: "demo-leave-application-vacation", employeeId: employee.id, leaveTypeId: vacation.id,
      fromDate: dateOnly("2026-11-12"), toDate: dateOnly("2026-11-13"), totalDays: new Decimal(2),
      reason: "Demo: family commitment", status: "OPEN", submittedAt: dateOnly("2026-10-01"),
    },
  });
  void leaveApplication;

  const attendanceDate = dateOnly("2026-10-09");
  const firstIn = new Date("2026-10-09T08:05:00+08:00");
  const lastOut = new Date("2026-10-09T17:00:00+08:00");
  await prisma.dailyAttendance.upsert({
    where: { employeeId_workDate: { employeeId: employee.id, workDate: attendanceDate } },
    update: { status: "PRESENT", firstIn, lastOut, scheduledMinutes: 480, workedMinutes: 475, lateMinutes: 5 },
    create: { employeeId: employee.id, workDate: attendanceDate, status: "PRESENT", firstIn, lastOut, scheduledMinutes: 480, workedMinutes: 475, lateMinutes: 5 },
  });
  const shift = await prisma.shiftSchedule.upsert({
    where: { companyId_name: { companyId: company.id, name: "Demo Day Shift" } },
    update: { startTime: "08:00", endTime: "17:00", scheduledHours: new Decimal(8), breakMinutes: 60, graceMinutes: 5 },
    create: { companyId: company.id, name: "Demo Day Shift", startTime: "08:00", endTime: "17:00", scheduledHours: new Decimal(8), breakMinutes: 60, graceMinutes: 5 },
  });
  await prisma.shiftAssignment.upsert({
    where: { id: "demo-shift-assignment-employee" },
    update: { employeeId: employee.id, shiftScheduleId: shift.id, startsOn: dateOnly("2026-01-01"), endsOn: null, status: "APPROVED", assignedBy: admin.id },
    create: { id: "demo-shift-assignment-employee", employeeId: employee.id, shiftScheduleId: shift.id, startsOn: dateOnly("2026-01-01"), status: "APPROVED", assignedBy: admin.id },
  });
  const expenseType = await prisma.expenseType.upsert({
    where: { companyId_code: { companyId: company.id, code: "TRAVEL" } },
    update: { name: "Local Travel", active: true },
    create: { companyId: company.id, code: "TRAVEL", name: "Local Travel" },
  });
  void expenseType;
  await prisma.loanProduct.upsert({
    where: { companyId_code: { companyId: company.id, code: "SALARY-ADVANCE" } },
    update: { name: "Salary Advance", interestRate: new Decimal(0), maximumAmount: new Decimal(30000), active: true },
    create: { companyId: company.id, code: "SALARY-ADVANCE", name: "Salary Advance", interestRate: new Decimal(0), maximumAmount: new Decimal(30000) },
  });

  const travelClaim = await prisma.expenseClaim.upsert({
    where: { id: "demo-expense-claim-travel" },
    update: { employeeId: employee.id, claimDate: dateOnly("2026-10-02"), purpose: "Client site transportation", totalAmount: new Decimal(680), approvedAmount: new Decimal(680), status: "APPROVED", reviewedAt: dateOnly("2026-10-05") },
    create: { id: "demo-expense-claim-travel", employeeId: employee.id, claimDate: dateOnly("2026-10-02"), purpose: "Client site transportation", totalAmount: new Decimal(680), approvedAmount: new Decimal(680), status: "APPROVED", submittedAt: dateOnly("2026-10-03"), reviewedAt: dateOnly("2026-10-05") },
  });
  await prisma.expenseClaimDetail.upsert({
    where: { id: "demo-expense-detail-travel" },
    update: { expenseClaimId: travelClaim.id, expenseTypeId: expenseType.id, expenseDate: dateOnly("2026-10-02"), description: "Round-trip local transportation", amount: new Decimal(680) },
    create: { id: "demo-expense-detail-travel", expenseClaimId: travelClaim.id, expenseTypeId: expenseType.id, expenseDate: dateOnly("2026-10-02"), description: "Round-trip local transportation", amount: new Decimal(680) },
  });
  await prisma.employeeAdvance.upsert({
    where: { id: "demo-employee-advance" },
    update: { employeeId: employee.id, requestedAmount: new Decimal(5000), purpose: "Emergency medical expense", status: "PENDING" },
    create: { id: "demo-employee-advance", employeeId: employee.id, requestedAmount: new Decimal(5000), purpose: "Emergency medical expense", status: "PENDING" },
  });
  const salaryAdvanceProduct = await prisma.loanProduct.findUniqueOrThrow({ where: { companyId_code: { companyId: company.id, code: "SALARY-ADVANCE" } } });
  await prisma.employeeLoan.upsert({
    where: { id: "demo-employee-loan" },
    update: { employeeId: employee.id, loanProductId: salaryAdvanceProduct.id, requestedAmount: new Decimal(12000), approvedAmount: new Decimal(12000), interestRate: new Decimal(0), installments: 6, status: "RELEASED", outstanding: new Decimal(8000), releasedAt: dateOnly("2026-08-15") },
    create: { id: "demo-employee-loan", employeeId: employee.id, loanProductId: salaryAdvanceProduct.id, requestedAmount: new Decimal(12000), approvedAmount: new Decimal(12000), interestRate: new Decimal(0), installments: 6, status: "RELEASED", outstanding: new Decimal(8000), releasedAt: dateOnly("2026-08-15") },
  });
  const asset = await prisma.assetInventory.upsert({
    where: { companyId_assetTag: { companyId: company.id, assetTag: "DEMO-LAPTOP-001" } },
    update: { assetType: "Laptop", name: "People Operations Laptop", description: "Demo assigned workstation", serialNumber: "DEMO-SN-001", condition: "Good", status: "ASSIGNED", acquiredAt: dateOnly("2025-06-01"), purchaseCost: new Decimal(48500) },
    create: { companyId: company.id, assetTag: "DEMO-LAPTOP-001", assetType: "Laptop", name: "People Operations Laptop", description: "Demo assigned workstation", serialNumber: "DEMO-SN-001", condition: "Good", status: "ASSIGNED", acquiredAt: dateOnly("2025-06-01"), purchaseCost: new Decimal(48500) },
  });
  await prisma.employeeAssetAssignment.upsert({
    where: { id: "demo-asset-assignment" },
    update: { employeeId: employee.id, inventoryAssetId: asset.id, assetTag: asset.assetTag, assetType: asset.assetType, description: asset.name, conditionOut: "Good", returnedAt: null },
    create: { id: "demo-asset-assignment", employeeId: employee.id, inventoryAssetId: asset.id, assetTag: asset.assetTag, assetType: asset.assetType, description: asset.name, conditionOut: "Good" },
  });
  await prisma.employeeGrievance.upsert({
    where: { id: "demo-employee-grievance" },
    update: { employeeId: employee.id, grievanceType: "WORKPLACE_SUPPORT", title: "Request for ergonomic workstation review", description: "Demo confidential employee concern for reviewing the case workflow.", status: "IN_REVIEW", assignedTo: admin.id, confidential: true },
    create: { id: "demo-employee-grievance", employeeId: employee.id, grievanceType: "WORKPLACE_SUPPORT", title: "Request for ergonomic workstation review", description: "Demo confidential employee concern for reviewing the case workflow.", status: "IN_REVIEW", assignedTo: admin.id, confidential: true },
  });

  const requisition = await prisma.jobRequisition.upsert({
    where: { id: "demo-job-requisition" },
    update: { companyId: company.id, title: "People Operations Associate", departmentId: department.id, designationId: employeeDesignation.id, headcount: 1, reason: "Demo hiring pipeline", requestedBy: admin.id, status: "OPEN", approvedAt: dateOnly("2026-09-20") },
    create: { id: "demo-job-requisition", companyId: company.id, title: "People Operations Associate", departmentId: department.id, designationId: employeeDesignation.id, headcount: 1, reason: "Demo hiring pipeline", requestedBy: admin.id, status: "OPEN", approvedAt: dateOnly("2026-09-20") },
  });
  const opening = await prisma.jobOpening.upsert({
    where: { id: "demo-job-opening" },
    update: { requisitionId: requisition.id, companyId: company.id, title: requisition.title, description: "Support employee services, onboarding, and timekeeping operations.", location: "Makati City", employmentType: "REGULAR", salaryRangeMin: new Decimal(28000), salaryRangeMax: new Decimal(36000), opensOn: dateOnly("2026-09-21"), closesOn: dateOnly("2026-11-30"), status: "OPEN" },
    create: { id: "demo-job-opening", requisitionId: requisition.id, companyId: company.id, title: requisition.title, description: "Support employee services, onboarding, and timekeeping operations.", location: "Makati City", employmentType: "REGULAR", salaryRangeMin: new Decimal(28000), salaryRangeMax: new Decimal(36000), opensOn: dateOnly("2026-09-21"), closesOn: dateOnly("2026-11-30"), status: "OPEN" },
  });
  const application = await prisma.jobApplication.upsert({
    where: { id: "demo-job-application" },
    update: { jobOpeningId: opening.id, fullName: "Jamie Reyes", email: "jamie.reyes@example.test", phone: "+63 917 555 0101", source: "Company careers page", status: "INTERVIEW" },
    create: { id: "demo-job-application", jobOpeningId: opening.id, fullName: "Jamie Reyes", email: "jamie.reyes@example.test", phone: "+63 917 555 0101", source: "Company careers page", status: "INTERVIEW" },
  });
  await prisma.interview.upsert({
    where: { id: "demo-job-interview" },
    update: { applicationId: application.id, scheduledAt: new Date("2026-10-15T06:00:00.000Z"), interviewType: "PANEL", locationOrLink: "Demo meeting room", status: "SCHEDULED" },
    create: { id: "demo-job-interview", applicationId: application.id, scheduledAt: new Date("2026-10-15T06:00:00.000Z"), interviewType: "PANEL", locationOrLink: "Demo meeting room", status: "SCHEDULED" },
  });

  const appraisalCycle = await prisma.appraisalCycle.upsert({
    where: { companyId_name: { companyId: company.id, name: "2026 Midyear Review" } },
    update: { startsOn: dateOnly("2026-06-01"), endsOn: dateOnly("2026-06-30"), status: "OPEN" },
    create: { companyId: company.id, name: "2026 Midyear Review", startsOn: dateOnly("2026-06-01"), endsOn: dateOnly("2026-06-30"), status: "OPEN" },
  });
  await prisma.performanceGoal.upsert({
    where: { id: "demo-performance-goal" },
    update: { employeeId: employee.id, cycleId: appraisalCycle.id, title: "Improve employee request turnaround", description: "Resolve routine employee requests within the service target.", measure: "90% within two business days", targetValue: new Decimal(90), actualValue: new Decimal(84), dueDate: dateOnly("2026-12-15"), status: "IN_PROGRESS" },
    create: { id: "demo-performance-goal", employeeId: employee.id, cycleId: appraisalCycle.id, title: "Improve employee request turnaround", description: "Resolve routine employee requests within the service target.", measure: "90% within two business days", targetValue: new Decimal(90), actualValue: new Decimal(84), dueDate: dateOnly("2026-12-15"), status: "IN_PROGRESS" },
  });
  await prisma.performanceAppraisal.upsert({
    where: { cycleId_employeeId: { cycleId: appraisalCycle.id, employeeId: employee.id } },
    update: { selfRating: new Decimal(4), employeeNotes: "I improved request tracking and employee follow-up.", status: "SUBMITTED", submittedAt: dateOnly("2026-06-29") },
    create: { cycleId: appraisalCycle.id, employeeId: employee.id, selfRating: new Decimal(4), employeeNotes: "I improved request tracking and employee follow-up.", status: "SUBMITTED", submittedAt: dateOnly("2026-06-29") },
  });
  const training = await prisma.trainingProgram.upsert({
    where: { companyId_code: { companyId: company.id, code: "DATA-PRIVACY-101" } },
    update: { name: "Data Privacy Fundamentals", description: "Annual privacy and personal data handling refresher.", active: true },
    create: { companyId: company.id, code: "DATA-PRIVACY-101", name: "Data Privacy Fundamentals", description: "Annual privacy and personal data handling refresher." },
  });
  const trainingEvent = await prisma.trainingEvent.upsert({
    where: { id: "demo-training-event" },
    update: { programId: training.id, startsAt: new Date("2026-11-05T01:00:00.000Z"), endsAt: new Date("2026-11-05T04:00:00.000Z"), venueOrLink: "Makati office · Training room A", instructor: "People Operations", capacity: 20, status: "PLANNED" },
    create: { id: "demo-training-event", programId: training.id, startsAt: new Date("2026-11-05T01:00:00.000Z"), endsAt: new Date("2026-11-05T04:00:00.000Z"), venueOrLink: "Makati office · Training room A", instructor: "People Operations", capacity: 20, status: "PLANNED" },
  });
  await prisma.trainingEnrollment.upsert({
    where: { eventId_employeeId: { eventId: trainingEvent.id, employeeId: employee.id } },
    update: { status: "ENROLLED" },
    create: { eventId: trainingEvent.id, employeeId: employee.id, status: "ENROLLED" },
  });

  await prisma.employeeAddress.upsert({
    where: { id: "demo-employee-address" },
    update: { employeeId: employee.id, label: "HOME", line1: "100 Demo Street", barangay: "Poblacion", city: "Makati", province: "Metro Manila", postalCode: "1210", country: "PH", isPrimary: true, effectiveFrom: dateOnly("2024-03-04") },
    create: { id: "demo-employee-address", employeeId: employee.id, label: "HOME", line1: "100 Demo Street", barangay: "Poblacion", city: "Makati", province: "Metro Manila", postalCode: "1210", country: "PH", isPrimary: true, effectiveFrom: dateOnly("2024-03-04") },
  });
  await prisma.emergencyContact.upsert({
    where: { id: "demo-emergency-contact" },
    update: { employeeId: employee.id, name: "Rosa Santos", relationship: "Parent", phone: "+63 917 555 0199", isPrimary: true },
    create: { id: "demo-emergency-contact", employeeId: employee.id, name: "Rosa Santos", relationship: "Parent", phone: "+63 917 555 0199", isPrimary: true },
  });
  await prisma.employeeOnboarding.upsert({
    where: { id: "demo-onboarding-task" },
    update: { employeeId: employee.id, title: "Complete annual employee data review", dueDate: dateOnly("2026-12-15"), status: "OPEN", ownerUserId: staffUser.id, notes: "Demo employee self-service task." },
    create: { id: "demo-onboarding-task", employeeId: employee.id, title: "Complete annual employee data review", dueDate: dateOnly("2026-12-15"), status: "OPEN", ownerUserId: staffUser.id, notes: "Demo employee self-service task." },
  });
  await prisma.notification.upsert({
    where: { id: "demo-employee-notification" },
    update: { recipientId: staffUser.id, category: "PAYROLL", title: "Your September payslip is ready", body: "The first-cutoff payslip is available in your portal.", actionUrl: "/portal/payslips" },
    create: { id: "demo-employee-notification", recipientId: staffUser.id, category: "PAYROLL", title: "Your September payslip is ready", body: "The first-cutoff payslip is available in your portal.", actionUrl: "/portal/payslips" },
  });

  const separatedEmployee = await prisma.employee.upsert({
    where: { companyId_employeeNumber: { companyId: company.id, employeeNumber: "DEMO-EMP-002" } },
    update: { firstName: "Paolo", lastName: "Garcia", status: "SEPARATED", dateHired: dateOnly("2022-04-11"), dateSeparated: dateOnly("2026-08-31"), companyId: company.id, departmentId: department.id, designationId: employeeDesignation.id },
    create: { employeeNumber: "DEMO-EMP-002", firstName: "Paolo", lastName: "Garcia", status: "SEPARATED", employmentType: "REGULAR", workerClass: "RANK_AND_FILE", dateHired: dateOnly("2022-04-11"), dateSeparated: dateOnly("2026-08-31"), companyId: company.id, departmentId: department.id, designationId: employeeDesignation.id },
  });
  await prisma.fullAndFinalSettlement.upsert({
    where: { employeeId: separatedEmployee.id },
    update: { separationDate: dateOnly("2026-08-31"), finalBasicPay: new Decimal(15000), leaveEncashment: new Decimal(4500), thirteenthMonthPay: new Decimal(10000), otherEarnings: new Decimal(0), loanOutstanding: new Decimal(2500), otherDeductions: new Decimal(0), grossSettlement: new Decimal(29500), netSettlement: new Decimal(27000), status: "PENDING", assetsChecklist: { laptop: "Returned", idCard: "Returned" } },
    create: { employeeId: separatedEmployee.id, separationDate: dateOnly("2026-08-31"), finalBasicPay: new Decimal(15000), leaveEncashment: new Decimal(4500), thirteenthMonthPay: new Decimal(10000), otherEarnings: new Decimal(0), loanOutstanding: new Decimal(2500), otherDeductions: new Decimal(0), grossSettlement: new Decimal(29500), netSettlement: new Decimal(27000), status: "PENDING", assetsChecklist: { laptop: "Returned", idCard: "Returned" } },
  });

  const run = await prisma.payrollRun.upsert({
    where: { companyId_name: { companyId: company.id, name: "Demo September 2026 · First Cutoff" } },
    update: { status: "PAID", cutoffNumber: 1, periodStart: dateOnly("2026-09-01"), periodEnd: dateOnly("2026-09-15"), payDate: dateOnly("2026-09-20"), createdBy: admin.id },
    create: {
      companyId: company.id, name: "Demo September 2026 · First Cutoff", cutoffNumber: 1,
      periodStart: dateOnly("2026-09-01"), periodEnd: dateOnly("2026-09-15"), payDate: dateOnly("2026-09-20"),
      status: "PAID", createdBy: admin.id, approvedBy: admin.id, submittedAt: dateOnly("2026-09-18"),
    },
  });
  const slip = await prisma.salarySlip.upsert({
    where: { payrollRunId_employeeId_revision: { payrollRunId: run.id, employeeId: employee.id, revision: 1 } },
    update: {
      status: "PAID", isFrozen: true, baseCompensation: new Decimal(15000), overtimePay: new Decimal(180.29), nightDifferential: new Decimal(28.85),
      grossPay: new Decimal(15209.14), taxableIncome: new Decimal(12477.88), taxWithheld: new Decimal(309.13),
      totalEmployeeDeductions: new Decimal(2831.25), netPay: new Decimal(12377.89), calculationVersion: "demo-fixture-v1", inputSnapshot: { demo: true },
      submittedAt: dateOnly("2026-09-18"),
    },
    create: {
      payrollRunId: run.id, employeeId: employee.id, status: "PAID", isFrozen: true, revision: 1,
      baseCompensation: new Decimal(15000), overtimePay: new Decimal(180.29), nightDifferential: new Decimal(28.85),
      grossPay: new Decimal(15209.14), taxableIncome: new Decimal(12477.88), taxWithheld: new Decimal(309.13),
      totalEmployeeDeductions: new Decimal(2831.25), netPay: new Decimal(12377.89), calculationVersion: "demo-fixture-v1",
      inputSnapshot: { demo: true, note: "Display fixture only; recalculate before using payroll data." }, submittedAt: dateOnly("2026-09-18"),
    },
  });
  const detailItems: Array<{ kind: SalarySlipDetailKind; code: string; label: string; amount: string; taxable: boolean }> = [
    { kind: SalarySlipDetailKind.EARNING, code: "BASIC", label: "Basic pay", amount: "15000.00", taxable: true },
    { kind: SalarySlipDetailKind.EARNING, code: "OVERTIME", label: "Overtime pay", amount: "180.29", taxable: true },
    { kind: SalarySlipDetailKind.EARNING, code: "NIGHT_DIFF", label: "Night shift differential", amount: "28.85", taxable: true },
    { kind: SalarySlipDetailKind.DEDUCTION, code: "SSS_EE", label: "SSS employee share", amount: "1500.00", taxable: false },
    { kind: SalarySlipDetailKind.DEDUCTION, code: "PHILHEALTH_EE", label: "PhilHealth employee share", amount: "750.00", taxable: false },
    { kind: SalarySlipDetailKind.DEDUCTION, code: "PAGIBIG_EE", label: "Pag-IBIG employee share", amount: "200.00", taxable: false },
    { kind: SalarySlipDetailKind.DEDUCTION, code: "WITHHOLDING_TAX", label: "Withholding tax", amount: "309.13", taxable: false },
    { kind: SalarySlipDetailKind.DEDUCTION, code: "LATE", label: "Late / undertime", amount: "72.12", taxable: false },
  ];
  for (const item of detailItems) {
    await prisma.salarySlipDetail.upsert({
      where: { id: `demo-slip-${item.code}` },
      update: { salarySlipId: slip.id, ...item, amount: new Decimal(item.amount) },
      create: { id: `demo-slip-${item.code}`, salarySlipId: slip.id, ...item, amount: new Decimal(item.amount) },
    });
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required before seeding.");
  const databaseName = decodeURIComponent(new URL(databaseUrl).pathname.split("/").filter(Boolean)[0] ?? "");
  if (databaseName !== "ph_hris") throw new Error(`Refusing to seed database '${databaseName || "(empty)"}'; the local development seed is limited to ph_hris.`);
  await seedSss();
  await seedPhilHealth();
  await seedPagIbig();
  await seedBir();
  await seedPending2026();
  await seedDemoAccounts();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SEPARATED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('REGULAR', 'PROBATIONARY', 'FIXED_TERM', 'CASUAL', 'PART_TIME');

-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('MONTHLY', 'DAILY', 'HOURLY');

-- CreateEnum
CREATE TYPE "WorkerClassification" AS ENUM ('RANK_AND_FILE', 'MANAGERIAL', 'SUPERVISORY');

-- CreateEnum
CREATE TYPE "AssetInventoryStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "ExpenseClaimStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmployeeAdvanceStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'RELEASED', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaveApplicationStatus" AS ENUM ('DRAFT', 'OPEN', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaveLedgerEntryType" AS ENUM ('ALLOCATION', 'ACCRUAL', 'APPLICATION', 'ADJUSTMENT', 'ENCASHMENT', 'EXPIRY');

-- CreateEnum
CREATE TYPE "SalaryComponentKind" AS ENUM ('EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PayrollPostingBehavior" AS ENUM ('DEBIT', 'CREDIT', 'BOTH');

-- CreateEnum
CREATE TYPE "EmployeeLoanStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'RELEASED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'CALCULATING', 'CALCULATED', 'APPROVED', 'SUBMITTED', 'PAID', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "SalarySlipStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PAID', 'CANCELLED', 'AMENDED');

-- CreateEnum
CREATE TYPE "SalarySlipDetailKind" AS ENUM ('EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION', 'EMPLOYER_TAX');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "StatutoryAgency" AS ENUM ('SSS', 'PHILHEALTH', 'PAGIBIG', 'BIR', 'LABOR');

-- CreateEnum
CREATE TYPE "StatutoryRuleKind" AS ENUM ('CONTRIBUTION', 'WITHHOLDING_TAX', 'FRINGE_BENEFIT_TAX');

-- CreateEnum
CREATE TYPE "SchedulePublicationStatus" AS ENUM ('PUBLISHED', 'PENDING_CONFIRMATION', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ContributionAllocationMode" AS ENUM ('FIRST_CUTOFF', 'SECOND_CUTOFF', 'EVEN_SPLIT', 'EXACT_FIRST_CUTOFF_AMOUNT');

-- CreateEnum
CREATE TYPE "RecruitingStatus" AS ENUM ('DRAFT', 'OPEN', 'ON_HOLD', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicantStatus" AS ENUM ('NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CheckinLogType" AS ENUM ('IN', 'OUT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'REST_DAY', 'HOLIDAY');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "tin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Designation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "email" TEXT,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'REGULAR',
    "workerClass" "WorkerClassification" NOT NULL DEFAULT 'RANK_AND_FILE',
    "isMinimumWageEarner" BOOLEAN NOT NULL DEFAULT false,
    "dateHired" DATE NOT NULL,
    "dateSeparated" DATE,
    "dateOfBirth" DATE,
    "gender" TEXT,
    "civilStatus" TEXT,
    "mobilePhone" TEXT,
    "personalEmail" TEXT,
    "bloodGroup" TEXT,
    "bankName" TEXT,
    "bankAccountEncrypted" TEXT,
    "workLocation" TEXT,
    "reportsToId" TEXT,
    "tin" TEXT,
    "sssNumber" TEXT,
    "philHealthNumber" TEXT,
    "pagIbigNumber" TEXT,
    "companyId" TEXT NOT NULL,
    "departmentId" TEXT,
    "designationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryAssignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "payType" "PayType" NOT NULL,
    "monthlyRate" DECIMAL(18,4),
    "dailyRate" DECIMAL(18,4),
    "hourlyRate" DECIMAL(18,4),
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PHP',
    "salaryStructureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "SalaryAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAddress" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'HOME',
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "barangay" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'PH',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,

    CONSTRAINT "EmployeeAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeIdentityDocument" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumberEncrypted" TEXT NOT NULL,
    "issuingAuthority" TEXT,
    "issuedOn" DATE,
    "expiresOn" DATE,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "fileUrl" TEXT,

    CONSTRAINT "EmployeeIdentityDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentEvent" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "effectiveDate" DATE NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT NOT NULL,
    "documentUrl" TEXT,
    "approvedBy" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmploymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAssetAssignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "inventoryAssetId" TEXT,
    "assetTag" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "conditionOut" TEXT,
    "conditionIn" TEXT,

    CONSTRAINT "EmployeeAssetAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetInventory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serialNumber" TEXT,
    "condition" TEXT,
    "status" "AssetInventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
    "acquiredAt" DATE,
    "purchaseCost" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeOnboarding" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" DATE,
    "completedAt" TIMESTAMP(3),
    "ownerUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,

    CONSTRAINT "EmployeeOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ExpenseType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseClaim" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "claimDate" DATE NOT NULL,
    "purpose" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PHP',
    "totalAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "approvedAmount" DECIMAL(18,2),
    "status" "ExpenseClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseClaimDetail" (
    "id" TEXT NOT NULL,
    "expenseClaimId" TEXT NOT NULL,
    "expenseTypeId" TEXT NOT NULL,
    "expenseDate" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "receiptUrl" TEXT,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "ExpenseClaimDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAdvance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "requestedAmount" DECIMAL(18,2) NOT NULL,
    "approvedAmount" DECIMAL(18,2),
    "purpose" TEXT NOT NULL,
    "requestedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EmployeeAdvanceStatus" NOT NULL DEFAULT 'DRAFT',
    "settledAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "releasedAt" TIMESTAMP(3),
    "salarySlipId" TEXT,

    CONSTRAINT "EmployeeAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departAt" TIMESTAMP(3) NOT NULL,
    "returnAt" TIMESTAMP(3) NOT NULL,
    "estimatedCost" DECIMAL(18,2),
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedCost" DECIMAL(18,2),

    CONSTRAINT "TravelRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleLog" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT,
    "vehiclePlate" TEXT NOT NULL,
    "logDate" DATE NOT NULL,
    "purpose" TEXT NOT NULL,
    "odometerStart" DECIMAL(12,2),
    "odometerEnd" DECIMAL(12,2),
    "fuelCost" DECIMAL(18,2),
    "maintenanceCost" DECIMAL(18,2),

    CONSTRAINT "VehicleLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT true,
    "encashable" BOOLEAN NOT NULL DEFAULT false,
    "compensatory" BOOLEAN NOT NULL DEFAULT false,
    "includeHolidays" BOOLEAN NOT NULL DEFAULT false,
    "allowNegativeBalance" BOOLEAN NOT NULL DEFAULT false,
    "requiresDocument" BOOLEAN NOT NULL DEFAULT false,
    "maximumConsecutiveDays" DECIMAL(8,2),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePeriod" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LeavePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePolicy" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLeavePolicyAssignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leavePolicyId" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeLeavePolicyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePolicyDetail" (
    "id" TEXT NOT NULL,
    "leavePolicyId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "annualEntitlement" DECIMAL(8,2) NOT NULL,
    "accrualFrequency" TEXT NOT NULL DEFAULT 'ANNUAL',
    "carryForwardLimit" DECIMAL(8,2),
    "expiresAfterMonths" INTEGER,

    CONSTRAINT "LeavePolicyDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveAllocation" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "leavePeriodId" TEXT NOT NULL,
    "allocatedDays" DECIMAL(8,2) NOT NULL,
    "carryForwardDays" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveApplication" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "fromDate" DATE NOT NULL,
    "toDate" DATE NOT NULL,
    "totalDays" DECIMAL(8,2) NOT NULL,
    "halfDay" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "status" "LeaveApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveLedgerEntry" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "allocationId" TEXT,
    "applicationId" TEXT,
    "entryType" "LeaveLedgerEntryType" NOT NULL,
    "postingDate" DATE NOT NULL,
    "days" DECIMAL(8,2) NOT NULL,
    "balanceAfter" DECIMAL(8,2) NOT NULL,
    "description" TEXT NOT NULL,
    "sourceKey" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveAdjustment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "postingDate" DATE NOT NULL,
    "days" DECIMAL(8,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveEncashment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "days" DECIMAL(8,2) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "LeaveEncashment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompensatoryLeaveRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "hoursWorked" DECIMAL(8,2) NOT NULL,
    "leaveDaysEarned" DECIMAL(8,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "expiresOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompensatoryLeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryComponent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SalaryComponentKind" NOT NULL,
    "formula" TEXT,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "is13thMonthOrDeMinimisBenefit" BOOLEAN NOT NULL DEFAULT false,
    "recurring" BOOLEAN NOT NULL DEFAULT true,
    "compensationClass" TEXT NOT NULL DEFAULT 'REGULAR',
    "statutoryAgency" "StatutoryAgency",
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payFrequency" TEXT NOT NULL DEFAULT 'SEMI_MONTHLY',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructureComponent" (
    "id" TEXT NOT NULL,
    "salaryStructureId" TEXT NOT NULL,
    "salaryComponentId" TEXT NOT NULL,
    "amount" DECIMAL(18,4),
    "formulaOverride" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SalaryStructureComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructureAssignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "salaryStructureId" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryStructureAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollCorrection" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "originalSlipId" TEXT NOT NULL,
    "replacementSlipId" TEXT,
    "reason" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "PayrollCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollTaxYearInput" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'CURRENT_EMPLOYER',
    "taxableCompensationToDate" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxWithheldToDate" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "nonTaxableBenefitAmountToDate" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "importedAt" TIMESTAMP(3),
    "importedBy" TEXT,
    "sourceDocumentUrl" TEXT,

    CONSTRAINT "PayrollTaxYearInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalAccount" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "JournalAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "postingDate" DATE NOT NULL,
    "reference" TEXT NOT NULL,
    "memo" TEXT,
    "status" "JournalStatus" NOT NULL DEFAULT 'DRAFT',
    "totalDebit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalCredit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "debit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "employeeId" TEXT,
    "costCenter" TEXT,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPostingRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "lineCode" TEXT NOT NULL,
    "behavior" "PayrollPostingBehavior" NOT NULL,
    "debitAccountId" TEXT,
    "creditAccountId" TEXT,

    CONSTRAINT "PayrollPostingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanProduct" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "interestRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "maximumAmount" DECIMAL(18,2),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LoanProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLoan" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "loanProductId" TEXT NOT NULL,
    "requestedAmount" DECIMAL(18,2) NOT NULL,
    "approvedAmount" DECIMAL(18,2),
    "interestRate" DECIMAL(9,6) NOT NULL,
    "installments" INTEGER NOT NULL,
    "status" "EmployeeLoanStatus" NOT NULL DEFAULT 'DRAFT',
    "outstanding" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "EmployeeLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanRepayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "salarySlipId" TEXT,
    "dueDate" DATE NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "paidAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "LoanRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeBenefit" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "benefitType" TEXT NOT NULL,
    "provider" TEXT,
    "coverage" TEXT,
    "amount" DECIMAL(18,2),
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,

    CONSTRAINT "EmployeeBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cutoffNumber" INTEGER NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "payDate" DATE NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalarySlip" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "SalarySlipStatus" NOT NULL DEFAULT 'DRAFT',
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "amendedFromId" TEXT,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PHP',
    "baseCompensation" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "overtimePay" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "nightDifferential" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherEarnings" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "grossPay" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxableIncome" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxWithheld" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalEmployeeDeductions" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalEmployerContributions" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "employerFringeBenefitTax" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "calculationVersion" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalarySlip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalarySlipDetail" (
    "id" TEXT NOT NULL,
    "salarySlipId" TEXT NOT NULL,
    "kind" "SalarySlipDetailKind" NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" DECIMAL(18,6),
    "rate" DECIMAL(18,6),
    "multiplier" DECIMAL(9,6),
    "amount" DECIMAL(18,2) NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "agency" "StatutoryAgency",
    "sourceReference" TEXT,
    "metadata" JSONB,

    CONSTRAINT "SalarySlipDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSkillRecord" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "proficiency" TEXT,
    "assessedAt" DATE,
    "expiresAt" DATE,
    "notes" TEXT,

    CONSTRAINT "EmployeeSkillRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeGrievance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "grievanceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "filedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "confidential" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EmployeeGrievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeFeedbackEntry" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "authorEmployeeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rating" INTEGER,
    "comments" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeFeedbackEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FullAndFinalSettlement" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "separationDate" DATE NOT NULL,
    "finalBasicPay" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "leaveEncashment" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "thirteenthMonthPay" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherEarnings" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "loanOutstanding" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "grossSettlement" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netSettlement" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedBy" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assetsChecklist" JSONB,

    CONSTRAINT "FullAndFinalSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "system" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalAction" (
    "id" TEXT NOT NULL,
    "approvalRequestId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "secretRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationEvent" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT,
    "eventType" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPolicy" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "monthlyToDailyDivisor" DECIMAL(8,4) NOT NULL DEFAULT 26,
    "scheduledHoursPerDay" DECIMAL(6,2) NOT NULL DEFAULT 8,
    "firstCutoffStartDay" INTEGER NOT NULL DEFAULT 1,
    "firstCutoffEndDay" INTEGER NOT NULL DEFAULT 15,
    "secondCutoffStartDay" INTEGER NOT NULL DEFAULT 16,
    "secondCutoffEndDay" INTEGER,
    "dailyProrationBasis" TEXT NOT NULL DEFAULT 'WORKING_DAYS',

    CONSTRAINT "PayrollPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatutorySchedule" (
    "id" TEXT NOT NULL,
    "agency" "StatutoryAgency" NOT NULL,
    "ruleKind" "StatutoryRuleKind" NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "publicationStatus" "SchedulePublicationStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "sourceUrl" TEXT,
    "sourceReference" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatutorySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatutorySlab" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "payrollPeriod" TEXT,
    "contributionProgram" TEXT,
    "compensationMin" DECIMAL(18,4),
    "compensationMax" DECIMAL(18,4),
    "contributionBaseFloor" DECIMAL(18,4),
    "contributionBaseCeiling" DECIMAL(18,4),
    "employeeRate" DECIMAL(9,6),
    "employerRate" DECIMAL(9,6),
    "employeeFixedAmount" DECIMAL(18,4),
    "employerFixedAmount" DECIMAL(18,4),
    "taxBaseAmount" DECIMAL(18,4),
    "marginalRate" DECIMAL(9,6),
    "marginalOver" DECIMAL(18,4),
    "condition" TEXT,
    "metadata" JSONB,

    CONSTRAINT "StatutorySlab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatutoryEligibility" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "agency" "StatutoryAgency" NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "eligible" BOOLEAN NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "reason" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatutoryEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionAllocationPolicy" (
    "id" TEXT NOT NULL,
    "payrollPolicyId" TEXT NOT NULL,
    "agency" "StatutoryAgency" NOT NULL,
    "contributionProgram" TEXT NOT NULL,
    "mode" "ContributionAllocationMode" NOT NULL,
    "exactFirstCutoffAmount" DECIMAL(18,2),
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,

    CONSTRAINT "ContributionAllocationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeContributionAllocationOverride" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "agency" "StatutoryAgency" NOT NULL,
    "contributionProgram" TEXT NOT NULL,
    "mode" "ContributionAllocationMode" NOT NULL,
    "exactFirstCutoffAmount" DECIMAL(18,2),
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "reason" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeContributionAllocationOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRequisition" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "departmentId" TEXT,
    "designationId" TEXT,
    "headcount" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "status" "RecruitingStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOpening" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "employmentType" "EmploymentType" NOT NULL,
    "salaryRangeMin" DECIMAL(18,2),
    "salaryRangeMax" DECIMAL(18,2),
    "opensOn" DATE NOT NULL,
    "closesOn" DATE,
    "status" "RecruitingStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "JobOpening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "jobOpeningId" TEXT NOT NULL,
    "employeeId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "resumeUrl" TEXT,
    "source" TEXT,
    "status" "ApplicantStatus" NOT NULL DEFAULT 'NEW',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "interviewType" TEXT NOT NULL,
    "locationOrLink" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewFeedback" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "rating" INTEGER,
    "recommendation" TEXT,
    "comments" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOffer" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "proposedTitle" TEXT NOT NULL,
    "proposedSalary" DECIMAL(18,2) NOT NULL,
    "targetStartDate" DATE NOT NULL,
    "terms" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "JobOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppraisalCycle" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "AppraisalCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceGoal" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "cycleId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "measure" TEXT,
    "targetValue" DECIMAL(18,4),
    "actualValue" DECIMAL(18,4),
    "weight" DECIMAL(8,4) NOT NULL DEFAULT 1,
    "dueDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "PerformanceGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceAppraisal" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "managerId" TEXT,
    "selfRating" DECIMAL(5,2),
    "managerRating" DECIMAL(5,2),
    "overallRating" DECIMAL(5,2),
    "employeeNotes" TEXT,
    "managerNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),

    CONSTRAINT "PerformanceAppraisal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgram" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TrainingProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingEvent" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "venueOrLink" TEXT,
    "instructor" TEXT,
    "capacity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',

    CONSTRAINT "TrainingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingEnrollment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "result" TEXT,
    "score" DECIMAL(8,2),
    "feedback" TEXT,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TrainingEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeCheckin" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "eventAt" TIMESTAMP(3) NOT NULL,
    "logType" "CheckinLogType" NOT NULL DEFAULT 'UNKNOWN',
    "deviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'BIOMETRIC',
    "externalId" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "rawPayload" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftSchedule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "scheduledHours" DECIMAL(6,2) NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 60,
    "graceMinutes" INTEGER NOT NULL DEFAULT 0,
    "nightWindowStart" VARCHAR(5) NOT NULL DEFAULT '22:00',
    "nightWindowEnd" VARCHAR(5) NOT NULL DEFAULT '06:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftAssignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftScheduleId" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "assignedBy" TEXT,

    CONSTRAINT "ShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "currentShiftId" TEXT,
    "requestedShiftId" TEXT,
    "effectiveDate" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ShiftRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceCorrectionRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "requestedFirstIn" TIMESTAMP(3),
    "requestedLastOut" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,

    CONSTRAINT "AttendanceCorrectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OvertimeRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "dayType" TEXT NOT NULL DEFAULT 'ORDINARY',
    "requestedHours" DECIMAL(8,2) NOT NULL,
    "approvedHours" DECIMAL(8,2),
    "reason" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "OvertimeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HolidayCalendar" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HolidayCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HolidayDate" (
    "id" TEXT NOT NULL,
    "holidayCalendarId" TEXT NOT NULL,
    "holidayDate" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "dayType" TEXT NOT NULL,

    CONSTRAINT "HolidayDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAttendance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "firstIn" TIMESTAMP(3),
    "lastOut" TIMESTAMP(3),
    "scheduledMinutes" INTEGER NOT NULL DEFAULT 0,
    "workedMinutes" INTEGER NOT NULL DEFAULT 0,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "undertimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "nightShiftMinutes" INTEGER NOT NULL DEFAULT 0,
    "unpaidLeaveDays" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "restDay" BOOLEAN NOT NULL DEFAULT false,
    "holidayType" TEXT,
    "aggregationVersion" TEXT NOT NULL DEFAULT 'v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_companyId_name_key" ON "Department"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Designation_companyId_title_key" ON "Designation"("companyId", "title");

-- CreateIndex
CREATE INDEX "Employee_companyId_status_idx" ON "Employee"("companyId", "status");

-- CreateIndex
CREATE INDEX "Employee_lastName_firstName_idx" ON "Employee"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_companyId_employeeNumber_key" ON "Employee"("companyId", "employeeNumber");

-- CreateIndex
CREATE INDEX "SalaryAssignment_employeeId_effectiveFrom_effectiveTo_idx" ON "SalaryAssignment"("employeeId", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryAssignment_employeeId_effectiveFrom_key" ON "SalaryAssignment"("employeeId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "EmployeeAddress_employeeId_isPrimary_idx" ON "EmployeeAddress"("employeeId", "isPrimary");

-- CreateIndex
CREATE INDEX "EmergencyContact_employeeId_isPrimary_idx" ON "EmergencyContact"("employeeId", "isPrimary");

-- CreateIndex
CREATE INDEX "EmployeeIdentityDocument_employeeId_documentType_idx" ON "EmployeeIdentityDocument"("employeeId", "documentType");

-- CreateIndex
CREATE INDEX "EmploymentEvent_employeeId_effectiveDate_idx" ON "EmploymentEvent"("employeeId", "effectiveDate");

-- CreateIndex
CREATE INDEX "EmploymentEvent_eventType_effectiveDate_idx" ON "EmploymentEvent"("eventType", "effectiveDate");

-- CreateIndex
CREATE INDEX "EmployeeAssetAssignment_employeeId_returnedAt_idx" ON "EmployeeAssetAssignment"("employeeId", "returnedAt");

-- CreateIndex
CREATE INDEX "EmployeeAssetAssignment_assetTag_idx" ON "EmployeeAssetAssignment"("assetTag");

-- CreateIndex
CREATE INDEX "AssetInventory_companyId_status_assetType_idx" ON "AssetInventory"("companyId", "status", "assetType");

-- CreateIndex
CREATE UNIQUE INDEX "AssetInventory_companyId_assetTag_key" ON "AssetInventory"("companyId", "assetTag");

-- CreateIndex
CREATE INDEX "EmployeeOnboarding_employeeId_status_dueDate_idx" ON "EmployeeOnboarding"("employeeId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseType_companyId_code_key" ON "ExpenseType"("companyId", "code");

-- CreateIndex
CREATE INDEX "ExpenseClaim_employeeId_claimDate_status_idx" ON "ExpenseClaim"("employeeId", "claimDate", "status");

-- CreateIndex
CREATE INDEX "ExpenseClaim_status_submittedAt_idx" ON "ExpenseClaim"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "ExpenseClaimDetail_expenseClaimId_expenseDate_idx" ON "ExpenseClaimDetail"("expenseClaimId", "expenseDate");

-- CreateIndex
CREATE INDEX "EmployeeAdvance_employeeId_status_requestedOn_idx" ON "EmployeeAdvance"("employeeId", "status", "requestedOn");

-- CreateIndex
CREATE INDEX "TravelRequest_employeeId_departAt_status_idx" ON "TravelRequest"("employeeId", "departAt", "status");

-- CreateIndex
CREATE INDEX "VehicleLog_vehiclePlate_logDate_idx" ON "VehicleLog"("vehiclePlate", "logDate");

-- CreateIndex
CREATE INDEX "LeaveType_companyId_active_idx" ON "LeaveType"("companyId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveType_companyId_code_key" ON "LeaveType"("companyId", "code");

-- CreateIndex
CREATE INDEX "LeavePeriod_companyId_startsOn_endsOn_idx" ON "LeavePeriod"("companyId", "startsOn", "endsOn");

-- CreateIndex
CREATE UNIQUE INDEX "LeavePeriod_companyId_name_key" ON "LeavePeriod"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "LeavePolicy_companyId_name_effectiveFrom_key" ON "LeavePolicy"("companyId", "name", "effectiveFrom");

-- CreateIndex
CREATE INDEX "EmployeeLeavePolicyAssignment_employeeId_effectiveFrom_effe_idx" ON "EmployeeLeavePolicyAssignment"("employeeId", "effectiveFrom", "effectiveTo", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeLeavePolicyAssignment_employeeId_leavePolicyId_effe_key" ON "EmployeeLeavePolicyAssignment"("employeeId", "leavePolicyId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "LeavePolicyDetail_leavePolicyId_leaveTypeId_key" ON "LeavePolicyDetail"("leavePolicyId", "leaveTypeId");

-- CreateIndex
CREATE INDEX "LeaveAllocation_employeeId_leavePeriodId_idx" ON "LeaveAllocation"("employeeId", "leavePeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveAllocation_employeeId_leaveTypeId_leavePeriodId_key" ON "LeaveAllocation"("employeeId", "leaveTypeId", "leavePeriodId");

-- CreateIndex
CREATE INDEX "LeaveApplication_employeeId_fromDate_toDate_idx" ON "LeaveApplication"("employeeId", "fromDate", "toDate");

-- CreateIndex
CREATE INDEX "LeaveApplication_status_submittedAt_idx" ON "LeaveApplication"("status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveLedgerEntry_sourceKey_key" ON "LeaveLedgerEntry"("sourceKey");

-- CreateIndex
CREATE INDEX "LeaveLedgerEntry_employeeId_leaveTypeId_postingDate_idx" ON "LeaveLedgerEntry"("employeeId", "leaveTypeId", "postingDate");

-- CreateIndex
CREATE INDEX "CompensatoryLeaveRequest_employeeId_workDate_status_idx" ON "CompensatoryLeaveRequest"("employeeId", "workDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryComponent_companyId_code_key" ON "SalaryComponent"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructure_companyId_code_key" ON "SalaryStructure"("companyId", "code");

-- CreateIndex
CREATE INDEX "SalaryStructureComponent_salaryStructureId_displayOrder_idx" ON "SalaryStructureComponent"("salaryStructureId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructureComponent_salaryStructureId_salaryComponentI_key" ON "SalaryStructureComponent"("salaryStructureId", "salaryComponentId");

-- CreateIndex
CREATE INDEX "SalaryStructureAssignment_employeeId_effectiveFrom_effectiv_idx" ON "SalaryStructureAssignment"("employeeId", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "PayrollCorrection_payrollRunId_employeeId_idx" ON "PayrollCorrection"("payrollRunId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollTaxYearInput_employeeId_taxYear_source_key" ON "PayrollTaxYearInput"("employeeId", "taxYear", "source");

-- CreateIndex
CREATE UNIQUE INDEX "JournalAccount_companyId_code_key" ON "JournalAccount"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_payrollRunId_key" ON "JournalEntry"("payrollRunId");

-- CreateIndex
CREATE INDEX "JournalEntry_companyId_postingDate_status_idx" ON "JournalEntry"("companyId", "postingDate", "status");

-- CreateIndex
CREATE INDEX "JournalLine_journalEntryId_idx" ON "JournalLine"("journalEntryId");

-- CreateIndex
CREATE INDEX "JournalLine_accountId_employeeId_idx" ON "JournalLine"("accountId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollPostingRule_companyId_lineCode_key" ON "PayrollPostingRule"("companyId", "lineCode");

-- CreateIndex
CREATE UNIQUE INDEX "LoanProduct_companyId_code_key" ON "LoanProduct"("companyId", "code");

-- CreateIndex
CREATE INDEX "EmployeeLoan_employeeId_status_idx" ON "EmployeeLoan"("employeeId", "status");

-- CreateIndex
CREATE INDEX "LoanRepayment_loanId_dueDate_idx" ON "LoanRepayment"("loanId", "dueDate");

-- CreateIndex
CREATE INDEX "EmployeeBenefit_employeeId_effectiveFrom_effectiveTo_idx" ON "EmployeeBenefit"("employeeId", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "PayrollRun_companyId_periodStart_periodEnd_status_idx" ON "PayrollRun"("companyId", "periodStart", "periodEnd", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_companyId_name_key" ON "PayrollRun"("companyId", "name");

-- CreateIndex
CREATE INDEX "SalarySlip_employeeId_createdAt_idx" ON "SalarySlip"("employeeId", "createdAt");

-- CreateIndex
CREATE INDEX "SalarySlip_payrollRunId_status_isFrozen_idx" ON "SalarySlip"("payrollRunId", "status", "isFrozen");

-- CreateIndex
CREATE UNIQUE INDEX "SalarySlip_payrollRunId_employeeId_revision_key" ON "SalarySlip"("payrollRunId", "employeeId", "revision");

-- CreateIndex
CREATE INDEX "SalarySlipDetail_salarySlipId_kind_idx" ON "SalarySlipDetail"("salarySlipId", "kind");

-- CreateIndex
CREATE INDEX "SalarySlipDetail_agency_code_idx" ON "SalarySlipDetail"("agency", "code");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSkillRecord_employeeId_skill_key" ON "EmployeeSkillRecord"("employeeId", "skill");

-- CreateIndex
CREATE INDEX "EmployeeGrievance_employeeId_filedAt_idx" ON "EmployeeGrievance"("employeeId", "filedAt");

-- CreateIndex
CREATE INDEX "EmployeeGrievance_status_filedAt_idx" ON "EmployeeGrievance"("status", "filedAt");

-- CreateIndex
CREATE INDEX "EmployeeFeedbackEntry_employeeId_createdAt_idx" ON "EmployeeFeedbackEntry"("employeeId", "createdAt");

-- CreateIndex
CREATE INDEX "EmployeeFeedbackEntry_authorEmployeeId_createdAt_idx" ON "EmployeeFeedbackEntry"("authorEmployeeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FullAndFinalSettlement_employeeId_key" ON "FullAndFinalSettlement"("employeeId");

-- CreateIndex
CREATE INDEX "FullAndFinalSettlement_separationDate_status_idx" ON "FullAndFinalSettlement"("separationDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AuthUser_email_key" ON "AuthUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthUser_employeeId_key" ON "AuthUser"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requestType_documentId_status_idx" ON "ApprovalRequest"("requestType", "documentId", "status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_submittedById_status_idx" ON "ApprovalRequest"("submittedById", "status");

-- CreateIndex
CREATE INDEX "ApprovalAction_approvalRequestId_step_createdAt_idx" ON "ApprovalAction"("approvalRequestId", "step", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_occurredAt_idx" ON "AuditEvent"("entityType", "entityId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorUserId_occurredAt_idx" ON "AuditEvent"("actorUserId", "occurredAt");

-- CreateIndex
CREATE INDEX "Notification_recipientId_readAt_createdAt_idx" ON "Notification"("recipientId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_provider_name_key" ON "IntegrationConnection"("provider", "name");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationEvent_idempotencyKey_key" ON "IntegrationEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "IntegrationEvent_status_receivedAt_idx" ON "IntegrationEvent"("status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollPolicy_companyId_key" ON "PayrollPolicy"("companyId");

-- CreateIndex
CREATE INDEX "StatutorySchedule_agency_ruleKind_effectiveFrom_effectiveTo_idx" ON "StatutorySchedule"("agency", "ruleKind", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE UNIQUE INDEX "StatutorySchedule_agency_ruleKind_version_key" ON "StatutorySchedule"("agency", "ruleKind", "version");

-- CreateIndex
CREATE INDEX "StatutorySlab_scheduleId_compensationMin_compensationMax_idx" ON "StatutorySlab"("scheduleId", "compensationMin", "compensationMax");

-- CreateIndex
CREATE UNIQUE INDEX "StatutorySlab_scheduleId_code_payrollPeriod_key" ON "StatutorySlab"("scheduleId", "code", "payrollPeriod");

-- CreateIndex
CREATE INDEX "StatutoryEligibility_employeeId_agency_ruleCode_effectiveFr_idx" ON "StatutoryEligibility"("employeeId", "agency", "ruleCode", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionAllocationPolicy_payrollPolicyId_agency_contrib_key" ON "ContributionAllocationPolicy"("payrollPolicyId", "agency", "contributionProgram", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeContributionAllocationOverride_employeeId_agency_co_key" ON "EmployeeContributionAllocationOverride"("employeeId", "agency", "contributionProgram", "effectiveFrom");

-- CreateIndex
CREATE INDEX "JobRequisition_companyId_status_createdAt_idx" ON "JobRequisition"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "JobOpening_companyId_status_opensOn_idx" ON "JobOpening"("companyId", "status", "opensOn");

-- CreateIndex
CREATE INDEX "JobApplication_jobOpeningId_status_appliedAt_idx" ON "JobApplication"("jobOpeningId", "status", "appliedAt");

-- CreateIndex
CREATE INDEX "JobApplication_email_idx" ON "JobApplication"("email");

-- CreateIndex
CREATE INDEX "Interview_applicationId_scheduledAt_idx" ON "Interview"("applicationId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewFeedback_interviewId_interviewerId_key" ON "InterviewFeedback"("interviewId", "interviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "JobOffer_applicationId_key" ON "JobOffer"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "AppraisalCycle_companyId_name_key" ON "AppraisalCycle"("companyId", "name");

-- CreateIndex
CREATE INDEX "PerformanceGoal_employeeId_dueDate_status_idx" ON "PerformanceGoal"("employeeId", "dueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceAppraisal_cycleId_employeeId_key" ON "PerformanceAppraisal"("cycleId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProgram_companyId_code_key" ON "TrainingProgram"("companyId", "code");

-- CreateIndex
CREATE INDEX "TrainingEvent_programId_startsAt_idx" ON "TrainingEvent"("programId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingEnrollment_eventId_employeeId_key" ON "TrainingEnrollment"("eventId", "employeeId");

-- CreateIndex
CREATE INDEX "EmployeeCheckin_employeeId_eventAt_idx" ON "EmployeeCheckin"("employeeId", "eventAt");

-- CreateIndex
CREATE INDEX "EmployeeCheckin_deviceId_eventAt_idx" ON "EmployeeCheckin"("deviceId", "eventAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeCheckin_source_externalId_key" ON "EmployeeCheckin"("source", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftSchedule_companyId_name_key" ON "ShiftSchedule"("companyId", "name");

-- CreateIndex
CREATE INDEX "ShiftAssignment_employeeId_startsOn_endsOn_idx" ON "ShiftAssignment"("employeeId", "startsOn", "endsOn");

-- CreateIndex
CREATE INDEX "ShiftAssignment_shiftScheduleId_startsOn_idx" ON "ShiftAssignment"("shiftScheduleId", "startsOn");

-- CreateIndex
CREATE INDEX "ShiftRequest_employeeId_effectiveDate_status_idx" ON "ShiftRequest"("employeeId", "effectiveDate", "status");

-- CreateIndex
CREATE INDEX "AttendanceCorrectionRequest_employeeId_workDate_idx" ON "AttendanceCorrectionRequest"("employeeId", "workDate");

-- CreateIndex
CREATE INDEX "AttendanceCorrectionRequest_status_submittedAt_idx" ON "AttendanceCorrectionRequest"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "OvertimeRequest_employeeId_workDate_idx" ON "OvertimeRequest"("employeeId", "workDate");

-- CreateIndex
CREATE INDEX "OvertimeRequest_status_workDate_idx" ON "OvertimeRequest"("status", "workDate");

-- CreateIndex
CREATE UNIQUE INDEX "HolidayCalendar_companyId_name_key" ON "HolidayCalendar"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "HolidayDate_holidayCalendarId_holidayDate_key" ON "HolidayDate"("holidayCalendarId", "holidayDate");

-- CreateIndex
CREATE INDEX "DailyAttendance_workDate_employeeId_idx" ON "DailyAttendance"("workDate", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAttendance_employeeId_workDate_key" ON "DailyAttendance"("employeeId", "workDate");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Designation" ADD CONSTRAINT "Designation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_reportsToId_fkey" FOREIGN KEY ("reportsToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryAssignment" ADD CONSTRAINT "SalaryAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryAssignment" ADD CONSTRAINT "SalaryAssignment_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "SalaryStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAddress" ADD CONSTRAINT "EmployeeAddress_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeIdentityDocument" ADD CONSTRAINT "EmployeeIdentityDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentEvent" ADD CONSTRAINT "EmploymentEvent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAssetAssignment" ADD CONSTRAINT "EmployeeAssetAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAssetAssignment" ADD CONSTRAINT "EmployeeAssetAssignment_inventoryAssetId_fkey" FOREIGN KEY ("inventoryAssetId") REFERENCES "AssetInventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetInventory" ADD CONSTRAINT "AssetInventory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeOnboarding" ADD CONSTRAINT "EmployeeOnboarding_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseType" ADD CONSTRAINT "ExpenseType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaimDetail" ADD CONSTRAINT "ExpenseClaimDetail_expenseClaimId_fkey" FOREIGN KEY ("expenseClaimId") REFERENCES "ExpenseClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaimDetail" ADD CONSTRAINT "ExpenseClaimDetail_expenseTypeId_fkey" FOREIGN KEY ("expenseTypeId") REFERENCES "ExpenseType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAdvance" ADD CONSTRAINT "EmployeeAdvance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleLog" ADD CONSTRAINT "VehicleLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveType" ADD CONSTRAINT "LeaveType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePeriod" ADD CONSTRAINT "LeavePeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePolicy" ADD CONSTRAINT "LeavePolicy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeavePolicyAssignment" ADD CONSTRAINT "EmployeeLeavePolicyAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeavePolicyAssignment" ADD CONSTRAINT "EmployeeLeavePolicyAssignment_leavePolicyId_fkey" FOREIGN KEY ("leavePolicyId") REFERENCES "LeavePolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePolicyDetail" ADD CONSTRAINT "LeavePolicyDetail_leavePolicyId_fkey" FOREIGN KEY ("leavePolicyId") REFERENCES "LeavePolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePolicyDetail" ADD CONSTRAINT "LeavePolicyDetail_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAllocation" ADD CONSTRAINT "LeaveAllocation_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAllocation" ADD CONSTRAINT "LeaveAllocation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAllocation" ADD CONSTRAINT "LeaveAllocation_leavePeriodId_fkey" FOREIGN KEY ("leavePeriodId") REFERENCES "LeavePeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveLedgerEntry" ADD CONSTRAINT "LeaveLedgerEntry_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveLedgerEntry" ADD CONSTRAINT "LeaveLedgerEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveLedgerEntry" ADD CONSTRAINT "LeaveLedgerEntry_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "LeaveAllocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveLedgerEntry" ADD CONSTRAINT "LeaveLedgerEntry_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LeaveApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAdjustment" ADD CONSTRAINT "LeaveAdjustment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAdjustment" ADD CONSTRAINT "LeaveAdjustment_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveEncashment" ADD CONSTRAINT "LeaveEncashment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveEncashment" ADD CONSTRAINT "LeaveEncashment_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensatoryLeaveRequest" ADD CONSTRAINT "CompensatoryLeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensatoryLeaveRequest" ADD CONSTRAINT "CompensatoryLeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryComponent" ADD CONSTRAINT "SalaryComponent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructureComponent" ADD CONSTRAINT "SalaryStructureComponent_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "SalaryStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructureComponent" ADD CONSTRAINT "SalaryStructureComponent_salaryComponentId_fkey" FOREIGN KEY ("salaryComponentId") REFERENCES "SalaryComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructureAssignment" ADD CONSTRAINT "SalaryStructureAssignment_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "SalaryStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructureAssignment" ADD CONSTRAINT "SalaryStructureAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollTaxYearInput" ADD CONSTRAINT "PayrollTaxYearInput_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalAccount" ADD CONSTRAINT "JournalAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "JournalAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollPostingRule" ADD CONSTRAINT "PayrollPostingRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollPostingRule" ADD CONSTRAINT "PayrollPostingRule_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "JournalAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollPostingRule" ADD CONSTRAINT "PayrollPostingRule_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "JournalAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanProduct" ADD CONSTRAINT "LoanProduct_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLoan" ADD CONSTRAINT "EmployeeLoan_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLoan" ADD CONSTRAINT "EmployeeLoan_loanProductId_fkey" FOREIGN KEY ("loanProductId") REFERENCES "LoanProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "EmployeeLoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeBenefit" ADD CONSTRAINT "EmployeeBenefit_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_amendedFromId_fkey" FOREIGN KEY ("amendedFromId") REFERENCES "SalarySlip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalarySlipDetail" ADD CONSTRAINT "SalarySlipDetail_salarySlipId_fkey" FOREIGN KEY ("salarySlipId") REFERENCES "SalarySlip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkillRecord" ADD CONSTRAINT "EmployeeSkillRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeGrievance" ADD CONSTRAINT "EmployeeGrievance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeFeedbackEntry" ADD CONSTRAINT "EmployeeFeedbackEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeFeedbackEntry" ADD CONSTRAINT "EmployeeFeedbackEntry_authorEmployeeId_fkey" FOREIGN KEY ("authorEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FullAndFinalSettlement" ADD CONSTRAINT "FullAndFinalSettlement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthUser" ADD CONSTRAINT "AuthUser_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AuthUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "AuthUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "AuthUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "AuthUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationEvent" ADD CONSTRAINT "IntegrationEvent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollPolicy" ADD CONSTRAINT "PayrollPolicy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatutorySlab" ADD CONSTRAINT "StatutorySlab_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "StatutorySchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatutoryEligibility" ADD CONSTRAINT "StatutoryEligibility_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionAllocationPolicy" ADD CONSTRAINT "ContributionAllocationPolicy_payrollPolicyId_fkey" FOREIGN KEY ("payrollPolicyId") REFERENCES "PayrollPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeContributionAllocationOverride" ADD CONSTRAINT "EmployeeContributionAllocationOverride_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequisition" ADD CONSTRAINT "JobRequisition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOpening" ADD CONSTRAINT "JobOpening_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOpening" ADD CONSTRAINT "JobOpening_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobOpeningId_fkey" FOREIGN KEY ("jobOpeningId") REFERENCES "JobOpening"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppraisalCycle" ADD CONSTRAINT "AppraisalCycle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceGoal" ADD CONSTRAINT "PerformanceGoal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceAppraisal" ADD CONSTRAINT "PerformanceAppraisal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceAppraisal" ADD CONSTRAINT "PerformanceAppraisal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgram" ADD CONSTRAINT "TrainingProgram_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEvent" ADD CONSTRAINT "TrainingEvent_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TrainingEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCheckin" ADD CONSTRAINT "EmployeeCheckin_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_shiftScheduleId_fkey" FOREIGN KEY ("shiftScheduleId") REFERENCES "ShiftSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_currentShiftId_fkey" FOREIGN KEY ("currentShiftId") REFERENCES "ShiftSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_requestedShiftId_fkey" FOREIGN KEY ("requestedShiftId") REFERENCES "ShiftSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCorrectionRequest" ADD CONSTRAINT "AttendanceCorrectionRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeRequest" ADD CONSTRAINT "OvertimeRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HolidayCalendar" ADD CONSTRAINT "HolidayCalendar_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HolidayDate" ADD CONSTRAINT "HolidayDate_holidayCalendarId_fkey" FOREIGN KEY ("holidayCalendarId") REFERENCES "HolidayCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttendance" ADD CONSTRAINT "DailyAttendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


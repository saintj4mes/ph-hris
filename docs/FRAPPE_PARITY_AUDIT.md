# Frappe HRMS parity audit

**Scope:** Standalone Next.js/Prisma workflows inspired by the local Frappe HRMS app, adapted for Philippine employment and payroll. Frappe Framework administration and India/UAE statutory implementations are excluded. This audit records the application state on 2026-10-10.

## Current status

`ph-hris` contains usable database-backed flows across employee records, attendance, leave, payroll, expenses, loans and advances, recruitment, performance, training, grievances, assets, and final settlements. It is a substantial foundation, but it is not yet a full feature-for-feature mirror of every Frappe HRMS workflow. The table below names the remaining gaps; a route or schema model alone does not count as an end-to-end feature.

## Module coverage

| Frappe HRMS area | Implemented in `ph-hris` | Remaining work |
| --- | --- | --- |
| HR / Employee | Employee directory/profile; organization and company setup; PH identity and statutory eligibility; salary assignments; profile/contact/benefit/skill updates; audited employment change requests with approval; assets; grievances; onboarding records; final settlement create/approve/pay | Onboarding checklist execution and document collection; richer configurable employee lifecycle templates; document storage and employee feedback review workflows |
| Shift & Attendance | Raw biometric event endpoint; employee self clock in/out; shifts and assignments; daily aggregation; attendance corrections and overtime requests; admin and employee views | Vendor-specific biometric adapters; holiday/rest-day calendar editor; stronger duplicate/missing-punch remediation; approved overtime policy and detailed payroll integration review |
| Leaves | Leave type/period and policy setup; policy assignments and idempotent accrual; balance adjustments; employee application/cancellation; approval and ledger; configurable encashment requests with salary-based estimates and payment marking; compensatory-time requests converted from scheduled hours and posted after HR approval; ESS views | Holiday/block-list setup; encashment legal and company caps; external payment integration; richer amendment and delegation rules |
| Payroll / Tax & Benefits | Effective-dated salary structures and assignments; Decimal calculation engine; configurable cutoffs, divisors, hours/day, statutory eligibility and contribution allocation; PH statutory schedules; payroll run, approval, frozen itemized slips, adjustment/reversal records, internal journal posting; payroll-linked loans/advances | Tax-year import and annualization review UI; payroll period administration; employee benefit/component configuration breadth; payment bank-file/export adapters; external accounting connector and reconciliation screens |
| Expenses | Employee claim with receipt reference; review, approval, and payment flow; admin/ESS views | Managed receipt upload; partial reimbursements; accounting export and reconciliation |
| Loans & advances | Product setup; employee requests; HR review/release; repayment schedules and manual repayment; payroll deduction with net-pay cap and partial balance carry-forward; employee history | More flexible loan interest/restructuring, delinquency and write-off workflows; reconciliation and repayment reporting |
| Recruitment | Requisition/opening/applicant pipeline; public careers listing and applications; stage transitions; interview scheduling/feedback; offer creation UI | Requisition approval/staffing plan; applicant account/communications; offer acceptance and onboarding conversion; fuller interview evaluation and reporting |
| Performance | Cycle setup; employee goal creation and actual progress updates; self-assessment; HR/manager review and finalization; employee and admin views | KPI/KRA templates, calibration, review delegation, feedback conversations and cycle-level completion controls |
| Training | Program and event setup; employee enrollment; capacity check; result/score/feedback entry; employee history | Nomination/manager approval, certification expiry tracking, attendance evidence, cost tracking and analytics |
| Assets / Employee services | Company-scoped asset inventory with tags, type, serial, acquisition cost/date and condition; available/assigned/maintenance/retired lifecycle; guarded custody assignment and return history; employee skills, benefits, contacts, grievance reporting and admin grievance resolution | Procurement and depreciation accounting; maintenance work-order history; employee feedback and service case workflow breadth; managed files |
| Reporting | Live headcount, attendance, leave and payroll summaries | Payroll register; tax/contribution remittances; leave liability; overtime and cost reports; recruitment/training reports; configurable filters, exports and scheduled reports |
| Platform services | Local identity/session; role-linked users and permission checks; audit trail; approval records; in-app notifications; integration events and biometric webhook | Role/permission administration UI; MFA and password reset/rotation; email/SMS delivery provider; workflow builder, delegation/escalation; integration retry and monitoring UI |

## MVP essentials

- **Employee master data:** employee records, organization, statutory identifiers/eligibility and salary assignment are usable. Employment changes require review and are audited. Onboarding documents/checklists remain incomplete.
- **Attendance and timesheets:** raw punches, ESS punches, daily aggregates, shift assignments, corrections and overtime requests are available. A production biometric integration still needs a vendor adapter and employer credentials.
- **Leave:** requests, approval, policy assignment/accrual, balances, adjustments and future cancellation are available. Accrual ledger entries are idempotent.
- **Payroll and payslips:** a Decimal-based payroll path, Philippine statutory calculations, payroll-linked loan/advance deductions, approval, frozen detail lines, amendments/reversals and internal accounting journal workflow are present. Runs depend on configured company policy, employee compensation, attendance, eligibility and published statutory schedules.

## Demo access and database setup

- `APP_MODE=DEV` now starts a persistent embedded PGlite PostgreSQL-compatible database, applies migrations and seeds demo fixtures before Next.js starts. Demo sign-in buttons use `DEMO_HR_ADMIN_*` and `DEMO_EMPLOYEE_*` values from local `.env`; the seeded HR admin has full local demo permissions.
- `APP_MODE=LIVE` uses the configured `DATABASE_URL` PostgreSQL connection. Live migrations and production database availability still need deployment-specific verification. The seed refuses production and any database name other than `ph_hris`; fixture operations use upserts and do not delete existing data.
- 2026 statutory schedules that have not been officially published/reviewed remain explicitly pending; do not treat placeholders as confirmed payroll law.

## External touchpoints

- **Biometrics:** `POST /api/integrations/biometric/checkins` accepts authenticated device events. Vendor-specific polling/SDK support is not included.
- **Notifications:** notifications are persisted and shown in-app. No email/SMS sender is configured.
- **Accounting:** payroll can produce an internally balanced journal from configured mappings. This is the standalone accounting touchpoint; it does not connect to ERPNext or an external GL.
- **Statutory references:** published PH schedules are versioned with effective dates and source references; unconfirmed future schedules stay pending.

## Validation in this implementation pass

- `npm run prisma:validate` — passed.
- `npm run prisma:generate` — passed.
- `APP_MODE=DEV` embedded database startup/migration/seed — validated when the PGlite walkthrough is started.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run build` — passed.
- `npm test` — passed (3 files, 6 tests).
- Database migration and demo seeding were not run because PostgreSQL was not listening at the configured local endpoint.

Module: payroll

References

FR-027 (Wizard Step 1), FR-028 (Wizard Step 2), FR-029 (State Machine),
FR-030 (Computation), FR-031 (Warnings), FR-032 (Validation), FR-033
(Mark Paid), FR-034 (Payslip List), FR-035 (Payslip Detail), FR-036
(PDF), FR-037 (Bulk Email)

Hackathon Spec §B5 (Payrun Creation Wizard), §B6 (Payrun Processing
Screen), §B7 (Payslip & Salary Computation), §B8 (Payslip PDF & Employee
Delivery)

Overview

Transactional payroll module that creates Payruns, accepts payroll
inputs, computes Payslips, validates payroll warnings, records payment
status, generates PDF payslips, and distributes payslips by email.

A Payslip is always a child of a Payrun. Payruns are associated with a
defined payroll period and Salary Structure. Each Payslip snapshots the
applicable employment contract and the salary calculation results used
for that period.

The module depends on:

employees --- employee identity, department, employment type,
bank/payroll information

contracts --- period-specific wage, schedule, and Salary Structure
context

working-schedules --- expected working hours

attendance --- worked hours, overtime, attendance exceptions

time-off --- approved leave and unpaid leave inputs

payroll-config --- Salary Structures, Salary Rules, rule
sequencing and versions

users --- authorization and audit actors

Finalized and paid payroll records are retained as immutable historical
records.

1. Payroll Architecture

Employee
   |
   +---- Contract History
   |        |
   |        +---- Salary Structure
   |
   +---- Attendance
   |
   +---- Time Off
   |
   +---- Payroll Inputs / Adjustments
            |
            v
      Payroll Period
            |
            v
          Payrun
            |
     +------+------+
     |             |
     v             v
 Payslips       Warnings
     |
     +---- Payslip Lines
     |
     +---- Calculation Trace
     |
     +---- Payment
     |
     +---- Delivery Logs
     |
     +---- Audit Logs

Core principles

Period-specific contract selection: Payroll must use the
contract applicable to the selected payroll period.

Deterministic computation: Salary Rules execute in ascending
sequence order.

Input-driven computation: Attendance, approved Time Off,
contract terms, and explicit payroll adjustments become calculation
inputs.

Immutable history: Paid payroll cannot be modified or
recomputed.

Auditable lifecycle: Every important state transition and
operational action is recorded.

Cross-payrun duplicate protection: Duplicate payslips are
detected across overlapping payroll periods, not merely within one
Payrun.

Per-recipient delivery tracking: Bulk payslip delivery records
success/failure independently for each employee.

Historical reproducibility: Salary Structure/Rule configuration
used for a Payrun is versioned or snapshotted.

2. Payrun State Machine

Draft
  |
  | Compute
  v
Computed
  |
  | Validate
  v
Validated
  |
  | Mark Paid
  v
Paid

Allowed transitions

Current State   Action         Next State    Authorization

Draft           Compute        Computed      HR Payroll User+
Computed        Validate       Validated     HR Payroll Manager+
Validated       Mark Paid      Paid          HR Payroll Manager+
Paid            Any mutation   Not Allowed   None

Re-computation

A Computed Payrun may be recomputed while it has not yet been Validated.

Computed
   |
   | Recompute
   v
Computed

Every computation creates/updates computation metadata and replaces the
current draft calculation results. Re-computation is forbidden after
Validated.

There is no rollback after Paid.

3. Frontend --- client/src/features/payroll/

Components

File                                    Responsibility

components/PayrunWizardStep1.tsx      Scope form --- Salary Structure,
Payroll Period/Start/End, employee
type/company filters; Continue does
not create a Payrun

components/PayrunWizardStep2.tsx      Employee selection --- eligible
employee search, filters,
checkboxes, Back, Create Payrun

components/PayrollInputEditor.tsx     Add/edit manual payroll inputs such
as bonus, commission,
reimbursement, advance, loan
deduction, arrears, or adjustment

components/WarningBanner.tsx          Displays blocking/non-blocking
warnings and resolution status

components/PayrunSummary.tsx          Gross, deductions, net, employee
count, warning count,
payment/delivery summary

components/PayslipLineBreakdown.tsx   Displays ordered salary-rule
calculation lines

components/DeliveryStatusTable.tsx    Displays per-employee payslip email
delivery status and retry state

components/PayrollAuditTimeline.tsx   Displays payrun lifecycle and
important payroll actions

components/PaymentStatusBadge.tsx     Displays payroll payment state

Pages

File                                Responsibility

pages/PayrunListPage.tsx          All Payruns --- Period, Status,
Total Gross, Total Net, Warning
count

pages/PayrunProcessingPage.tsx    Payrun lifecycle --- Compute,
Recompute, Validate, Mark Paid,
Send Payslips; warnings, inputs,
payslips and delivery results

pages/PayslipListPage.tsx         Payslips by Payrun and dedicated
top-level list view

pages/PayslipDetailPage.tsx       Employee, contract snapshot,
period, worked days, inputs,
salary-rule breakdown, warnings and
actions

pages/PayrollPeriodListPage.tsx   Payroll periods, payment dates,
frequency and processing state

Hooks

File                                Responsibility

hooks/usePayrunWizard.ts          Multi-step wizard state and
validation

hooks/usePayrun.ts                Fetches Payrun details and
lifecycle state

hooks/usePayslip.ts               Fetches Payslip with lines, inputs,
warnings and calculation trace

hooks/usePayrollInputs.ts         Loads and manages employee-specific
payroll inputs

hooks/usePayrollWarnings.ts       Loads, filters and resolves
warnings

Services

File                                     Responsibility

services/payrun.service.ts             Payrun creation, computation,
recomputation, validation, payment
and delivery actions

services/payslip.service.ts            Payslip list/detail access

services/payroll-input.service.ts      Create/update/delete
Draft/Computed-period payroll
inputs

services/payroll-warning.service.ts    Warning retrieval and resolution

services/payroll-payment.service.ts    Payment status and payment
reference handling

services/payslip-pdf.client.ts         PDF endpoint and blob download

Types

File                                Responsibility

types/payrun.types.ts             Payrun, status, warning summary,
period and lifecycle metadata

types/payslip.types.ts            Payslip, PayslipLine,
PayslipSummary, computation output

types/payroll-input.types.ts      Payroll input/adjustment shape and
source

types/payroll-warning.types.ts    Warning code, severity, blocking
and resolution

types/payroll-payment.types.ts    Payment status and transaction
information

types/payroll-delivery.types.ts   Per-recipient email delivery state

types/payroll-period.types.ts     Period, frequency and payment date

Tests

File                                          Responsibility

tests/usePayrunWizard.test.ts               Wizard transitions, validation and
no record creation on Continue

tests/payrun.service.test.ts                State transitions, authorization
and recomputation

tests/payroll-input.service.test.ts         Manual input lifecycle and source
validation

tests/payslip-computation.service.test.ts   Fixed, percentage, formula,
proration, overtime, leave and rule
sequence

tests/warning-detector.service.test.ts      Blocking/non-blocking warning
conditions

tests/payroll.integration.test.ts           Wizard → Payrun → Compute →
Validate → Paid → PDF → Delivery

tests/payroll-audit.test.ts                 State/action audit records

4. Backend --- server/src/modules/payroll/

Controllers

File                                          Responsibility

controllers/payrun.controller.ts            Payrun CRUD and lifecycle
transition handlers

controllers/payslip.controller.ts           Payslip list/detail, PDF and
employee delivery handlers

controllers/payroll-input.controller.ts     Payroll adjustment/input CRUD

controllers/payroll-warning.controller.ts   Warning retrieval and resolution

controllers/payroll-payment.controller.ts   Payment status/reference operations

controllers/payroll-period.controller.ts    Payroll period management

Services

services/payrun.service.ts

Responsibilities:

create Payrun

enforce employee selection

attach Payroll Period

initialize Draft Payslips

enforce state transitions

compute/recompute

validate

mark Paid

freeze fields after Paid

create audit records

services/payslip-computation.service.ts

Core calculation engine.

It:

Resolves the applicable period contract through
active-contract.resolver.ts.

Loads the Payrun's Salary Structure version.

Loads attendance and approved Time Off inputs.

Loads manual payroll inputs.

Applies salary rules through rule-sequencer.ts.

Calculates Basic, Allowances, Gross, Deductions, Employer
Contributions and Net.

Applies configured proration logic where required.

Produces immutable calculation snapshots for the Payrun.

Produces PayslipLine records.

Produces a calculation trace explaining important formula inputs.

It must not reimplement contract period resolution or rule
sequencing.

services/payroll-input.service.ts

Supports:

bonus

commission

incentive

reimbursement

overtime

unpaid leave

advance

loan deduction

arrears

manual earnings

manual deductions

other configured payroll inputs

Each input has a source:

ATTENDANCE
TIME_OFF
CONTRACT
SYSTEM
MANUAL

Manual inputs require an authorized user and reason.

services/warning-detector.service.ts

Checks:

missing contract

expired/inapplicable contract

missing bank/payroll details

cross-payrun duplicate payslip

zero worked days

pending/unapproved Time Off affecting payroll

unresolved attendance exceptions

missing required payroll input

invalid Salary Structure

invalid Salary Rule dependency

computation mismatch

payment/delivery issues

Warnings expose machine-readable codes, severity, blocking state and
human-readable messages.

services/payroll-payment.service.ts

Tracks:

payment initiation

payment reference

payment method

payment provider

success/failure

failure reason

timestamps

For the hackathon, actual banking integration may be mocked, but payment
records must still be represented consistently.

services/payslip-pdf.service.ts

Renders:

company information

employee snapshot

contract snapshot

period

attendance/worked days

earnings

deductions

employer contributions where applicable

gross

net

currency

calculation breakdown

Output:

single-page A4 PDF where content permits

retryable per-item generation failure

services/payslip-mailer.service.ts

Responsibilities:

generate/obtain PDF

send individually

track per-recipient result

retry failed delivery

record provider response

never mark all recipients as successful because one provider call
succeeded

services/payroll-audit.service.ts

Records:

Payrun creation

computation

recomputation

validation

payment

warning resolution

manual payroll input changes

delivery actions

important configuration changes

5. Repositories

File                                                    Responsibility

repositories/payrun.repository.ts                     findAll, findById, create, update
lifecycle metadata, freeze fields

repositories/payslip.repository.ts                    findByPayrun, findById,
createBatch, replaceLines,
findWithWarnings

repositories/payroll-input.repository.ts              Payroll input CRUD and source
filtering

repositories/payroll-warning.repository.ts            Warning creation, resolution and
queries

repositories/payroll-payment.repository.ts            Payment lifecycle

repositories/payroll-delivery.repository.ts           Recipient delivery tracking and
retry

repositories/payroll-audit.repository.ts              Immutable audit event persistence

repositories/payroll-period.repository.ts             Period creation and overlap checks

repositories/salary-structure-version.repository.ts   Version retrieval used by Payruns

6. Routes

Base path:

/api/payroll

Endpoint                             Auth

GET /payruns                       HR Payroll User+
POST /payruns                      HR Payroll User
GET /payruns/:id                   HR Payroll User+
POST /payruns/:id/compute          HR Payroll User
POST /payruns/:id/recompute        HR Payroll User
POST /payruns/:id/validate         HR Payroll Manager
POST /payruns/:id/mark-paid        HR Payroll Manager
POST /payruns/:id/send             HR Payroll Manager
GET /payruns/:id/payslips          HR Payroll User+
GET /payslips                      HR Payroll User+
GET /payslips/:id                  HR Payroll User+ / Employee own
GET /payslips/:id/pdf              HR Payroll User+ / Employee own
GET /payruns/:id/inputs            HR Payroll User+
POST /payruns/:id/inputs           HR Payroll User
PATCH /inputs/:id                  HR Payroll User
DELETE /inputs/:id                 HR Payroll User
GET /payruns/:id/warnings          HR Payroll User+
POST /warnings/:id/resolve         HR Payroll Manager
GET /payruns/:id/payments          HR Payroll Manager
GET /payruns/:id/delivery          HR Payroll User+
POST /payruns/:id/delivery/retry   HR Payroll Manager
GET /periods                       HR Payroll User+
POST /periods                      HR Payroll Manager

7. Validators

validators/payrun.validator.ts

Required:

structureId

periodStart

periodEnd

at least one employeeId

valid period

valid Salary Structure

employee must be eligible for selected scope

validators/payroll-input.validator.ts

Validates:

code

name

value

source

employee

Payrun

reason for manual adjustment

validators/payroll-period.validator.ts

Validates:

start/end

frequency

payment date

no overlapping closed payroll periods

8. Models

models/payroll-period.model.ts

id
name
companyId
periodStart
periodEnd
paymentDate
frequency
status
createdBy
createdAt
updatedAt

Status:

Open
Processing
Closed

models/payrun.model.ts

id
name
periodId
periodStart
periodEnd
companyId
structureId
structureVersionId
status
totalGross
totalDeductions
totalEmployerContributions
totalNet
warningCount
employeeCount
computedAt
computedBy
validatedAt
validatedBy
paidAt
paidBy
currencyCode
createdAt
updatedAt

models/payslip.model.ts

id
payrunId
employeeId
contractId
structureId
structureVersionId

employeeNameSnapshot
employeeCodeSnapshot
departmentSnapshot
jobPositionSnapshot
contractReferenceSnapshot
companyNameSnapshot
currencyCode

gross
deductions
employerContributions
net
workedDays
workedMinutes
overtimeMinutes

status
warningCount
createdAt
updatedAt

Unique:

(payrunId, employeeId)

Additionally, service-level validation prevents an employee from
receiving overlapping-period payslips across different Payruns.

models/payslip-line.model.ts

id
payslipId
ruleCode
ruleName
category
amount
sequence
sourceValue
calculationDescription
createdAt

Categories:

Basic
Allowance
Gross
Deduction
EmployerContribution
Net
Other

Rule name/code and calculation description are snapshots.

models/payroll-input.model.ts

id
payrunId
payslipId
employeeId
code
name
category
value
unit
source
sourceReference
isManual
reason
createdBy
createdAt
updatedAt

Categories may include:

Earning
Deduction
Reimbursement
Attendance
Leave
Adjustment
Other

models/payroll-warning.model.ts

id
payrunId
payslipId
employeeId
code
message
severity
blocking
status
resolutionNote
resolvedBy
resolvedAt
createdAt
updatedAt

Severity:

INFO
WARNING
ERROR

Status:

OPEN
RESOLVED
IGNORED

models/payroll-payment.model.ts

id
payrunId
payslipId
employeeId
amount
currencyCode
paymentMethod
status
paymentReference
provider
failureReason
initiatedAt
completedAt
createdAt
updatedAt

Payment status:

Pending
Processing
Paid
Failed
Reversed

models/payslip-delivery.model.ts

id
payrunId
payslipId
employeeId
recipientEmail
deliveryType
provider
status
providerMessageId
attemptCount
errorMessage
sentAt
lastAttemptAt
createdAt
updatedAt

Delivery status:

Pending
Sending
Sent
Failed

models/payroll-audit-log.model.ts

id
entityType
entityId
action
oldStatus
newStatus
changedFields
performedBy
performedAt
metadata

Audit records are append-only.

models/salary-structure-version.model.ts

id
structureId
version
effectiveFrom
effectiveTo
status
createdBy
createdAt

A Payrun stores the exact structureVersionId used for computation.

models/salary-rule-version.model.ts

id
structureVersionId
ruleCode
ruleName
category
sequence
computationMethod
amount
percentage
percentageBaseType
percentageBaseCode
formula
isActive
createdAt

models/payslip-calculation-trace.model.ts

id
payslipId
payslipLineId
ruleCode
inputName
inputValue
formula
result
sequence
createdAt

This allows an auditor to understand how a line was calculated.

9. Salary Computation Engine

Input hierarchy

Contract
    ↓
Base Wage
    ↓
Attendance + Overtime
    ↓
Approved Time Off
    ↓
Payroll Inputs
    ↓
Salary Rule Sequence
    ↓
Payslip Lines
    ↓
Gross
    ↓
Deductions
    ↓
Employer Contributions
    ↓
Net

Example

Basic Salary       ₹50,000
HRA                ₹20,000
Travel Allowance   ₹10,000
--------------------------------
Gross               ₹80,000

PF                  ₹5,000
--------------------------------
Net                 ₹75,000

Percentage rule

Rules must support a configurable base:

BASIC
GROSS
RULE
INPUT

Example:

HRA = 40% × BASIC
PF  = 10% × BASIC

Formula rule

Formula rules may reference controlled system variables such as:

contract.wage
worked_hours
overtime_hours
worked_days
calendar_days
unpaid_leave
attendance
time_off
inputs.BONUS
inputs.LOAN_DEDUCTION
rules.BASIC
rules.GROSS

Formula execution must use a safe expression evaluator. Arbitrary
unrestricted server-side code execution is not permitted.

10. Salary Proration

The payroll engine must support period-sensitive compensation where
required.

Supported configuration:

CALENDAR_DAYS
WORKING_DAYS
FIXED_30_DAYS

Examples:

employee joins during the payroll period

employee terminates during the payroll period

salary changes during the payroll period

contract changes during the payroll period

The applicable contract must be resolved using the established contract
resolver before computation.

11. Attendance and Time-Off Integration

Attendance

Payroll may consume:

worked_minutes
overtime_minutes
worked_days
late/absence status

Time Off

Payroll may consume:

approved paid leave
approved unpaid leave
leave duration
allocation information

Unpaid leave can produce:

inputs.UNPAID_LEAVE

and a configured deduction rule can consume that input.

Pending or unapproved leave must not silently reduce salary.

Unresolved attendance exceptions may create warnings.

12. Payroll Warnings

Blocking

The following normally prevent Validate:

MISSING_CONTRACT
INVALID_CONTRACT
DUPLICATE_PAYSLIP
INVALID_SALARY_STRUCTURE
INVALID_RULE_DEPENDENCY
COMPUTATION_MISMATCH

Non-blocking

Examples:

MISSING_BANK_DETAILS
ZERO_WORKED_DAYS
PENDING_TIME_OFF
ATTENDANCE_EXCEPTION
MISSING_OPTIONAL_PAYROLL_INPUT

Each warning must include:

code
employee
message
severity
blocking
status

Warnings must be persisted, not only returned from an API response.

13. Duplicate Payslip Detection

The database constraint:

UNIQUE(payrun_id, employee_id)

prevents duplicate employees inside the same Payrun.

However, business-level duplicate detection must additionally check:

employee
+
overlapping payroll period
+
existing non-cancelled/non-voided payslip

Example:

Payrun A
01 Sep → 30 Sep
Employee 001

Payrun B
01 Sep → 30 Sep
Employee 001

Payrun B must receive:

DUPLICATE_PAYSLIP
blocking = true

14. Payrun Validation

Validation should check:

Payrun is Computed.

At least one Payslip exists.

No blocking warnings remain.

Every Payslip has an applicable contract.

Salary Structure version exists.

Payslip totals match Payslip Lines.

Gross = earnings total.

Net = Gross - deductions.

No duplicate overlapping-period Payslips.

Required employee/payroll data is present.

Calculation inputs are internally consistent.

Only after successful validation:

Computed → Validated

15. Mark Paid

Mark Paid:

requires Validated

requires authorized Payroll Manager

records paidAt

records paidBy

optionally creates payment records

freezes Payrun

freezes Payslips

freezes Payslip Lines

prevents payroll inputs from being changed

prevents recomputation

creates an audit event

No rollback is allowed.

16. Payslip PDF

PDF must contain:

Company
Employee
Employee Code
Department
Job Position
Contract Reference
Payroll Period
Payment Date
Currency

Earnings
-----------------------
Basic
Allowances
Overtime
Bonus
Other Earnings

Gross

Deductions
-----------------------
PF
Tax
Unpaid Leave
Loan
Other Deductions

Net Salary

Employer Contributions
-----------------------
PF
Other Contributions

Calculation/summary information

The PDF must use the historical employee, contract and Salary Structure
snapshot for the Payslip.

17. Bulk Payslip Delivery

Bulk Send operates independently per employee.

Example:

John   → Sent
Jane   → Failed
Bob    → Sent
Alex   → Failed

The Payrun response must include:

sentCount
failedCount
pendingCount
results[]

Each delivery attempt is stored.

Failed messages can be retried without resending successful recipients.

18. Payroll Audit Timeline

Example:

05 Sep 09:00
Payrun Created
by Payroll User

05 Sep 09:12
Computed
by Payroll User

05 Sep 09:14
Warning Resolved
MISSING_BANK_DETAILS
by Payroll Manager

05 Sep 09:30
Validated
by Payroll Manager

05 Sep 10:00
Marked Paid
by Payroll Manager

05 Sep 10:05
Payslips Sent
3 Sent / 1 Failed

Audit records are append-only.

19. API Endpoints

GET /api/payroll/payruns

Auth: HR Payroll User+

Query:

?status=Computed&page=1&limit=20

Response:

{
  "data": [
    {
      "id": "run_01",
      "name": "September 2026 Payroll",
      "periodStart": "2026-09-01",
      "periodEnd": "2026-09-30",
      "structureId": "str_01",
      "structureVersionId": "strv_03",
      "status": "Computed",
      "employeeCount": 25,
      "totalGross": 3200000,
      "totalDeductions": 350000,
      "totalNet": 2850000,
      "warningCount": 2,
      "computedAt": "2026-09-28T10:05:00Z",
      "computedBy": "u_01",
      "validatedAt": null,
      "paidAt": null
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}

POST /api/payroll/payruns

Creates a Draft Payrun only after final wizard submission.

{
  "name": "September 2026 Payroll",
  "periodId": "period_09_2026",
  "structureId": "str_01",
  "periodStart": "2026-09-01",
  "periodEnd": "2026-09-30",
  "employeeIds": [
    "emp_01",
    "emp_02"
  ]
}

Continue in wizard Step 1 must never call this endpoint.

POST /api/payroll/payruns/:id/compute

Computes all selected Payslips.

Returns:

{
  "id": "run_01",
  "status": "Computed",
  "totalGross": 3200000,
  "totalDeductions": 350000,
  "totalNet": 2850000,
  "warningCount": 2,
  "warnings": [],
  "computedAt": "2026-09-28T10:05:00Z"
}

POST /api/payroll/payruns/:id/recompute

Allowed only when Payrun is Computed.

Rebuilds calculation results from current valid inputs and configuration
version.

POST /api/payroll/payruns/:id/validate

Allowed only for Payroll Manager.

Fails if blocking warnings remain.

POST /api/payroll/payruns/:id/mark-paid

Allowed only for Payroll Manager.

Requires:

status = Validated

Response:

{
  "id": "run_01",
  "status": "Paid",
  "paidAt": "2026-09-30T09:00:00Z",
  "paidBy": "u_05"
}

POST /api/payroll/payruns/:id/send

Sends payslips individually and returns per-recipient results.

{
  "payrunId": "run_01",
  "results": [
    {
      "employeeId": "emp_01",
      "email": "john@company.com",
      "status": "sent"
    },
    {
      "employeeId": "emp_02",
      "email": "jane@company.com",
      "status": "failed",
      "error": "SMTP delivery failed"
    }
  ],
  "sentCount": 1,
  "failedCount": 1,
  "pendingCount": 0
}

20. Payroll Inputs API

POST /api/payroll/payruns/:id/inputs

Example:

{
  "employeeId": "emp_01",
  "code": "BONUS",
  "name": "Performance Bonus",
  "category": "Earning",
  "value": 10000,
  "unit": "amount",
  "source": "MANUAL",
  "reason": "Quarterly performance bonus"
}

Manual inputs require authorization and a reason.

Inputs cannot be changed after the Payrun is Validated.

21. Payroll Warnings API

GET /api/payroll/payruns/:id/warnings

Returns persisted warnings.

POST /api/payroll/warnings/:id/resolve

Example:

{
  "resolutionNote": "Bank account updated in Employee Master"
}

Resolution must record:

resolvedBy
resolvedAt
resolutionNote

22. Payroll Payment API

GET /api/payroll/payruns/:id/payments

Returns payment records.

POST /api/payroll/payments/:id/update

Updates payment state/reference according to authorized workflow.

23. Payroll Delivery API

GET /api/payroll/payruns/:id/delivery

Returns per-recipient delivery state.

POST /api/payroll/payruns/:id/delivery/retry

Retries failed recipients only.

24. Salary Structure Versioning

A Payrun must never rely only on the current mutable Salary Structure.

Salary Structure
      |
      +-- Version 1
      |     +-- BASIC
      |     +-- HRA
      |
      +-- Version 2
            +-- BASIC
            +-- HRA
            +-- PF

When a Payrun is created/computed:

Payrun → Structure Version

The exact version is retained for historical reproducibility.

Paid payroll must continue to reference the version used during
computation.

25. RBAC

Action          Employee   HR Manager   HR Payroll   HR Payroll        Admin
User      Manager

View Own               ✓          ---            ✓            ✓            ✓
Payslip

View                 Own          ---            ✓            ✓            ✓
Payroll
Lists

Create               ---          ---            ✓            ✓            ✓
Payrun

Compute              ---          ---            ✓            ✓            ✓

Add Manual           ---          ---            ✓            ✓            ✓
Payroll
Input

Resolve              ---          ---          ---            ✓            ✓
Blocking
Warning

Validate             ---          ---          ---            ✓            ✓

Mark Paid            ---          ---          ---            ✓            ✓

Generate             Own          ---            ✓            ✓            ✓
PDF

Send                 ---          ---      Execute      Execute            ✓
Payslips

Manage               ---          ---         Read         CRUD         CRUD
Salary
Rules

Manage               ---          ---         Read         CRUD         CRUD
Structure
Versions

26. Payroll Dashboard Integration

The Payroll Dashboard consumes live Payroll data.

KPIs

Total Net Salary Paid

Total Gross Salary

Total Deductions

Employer Contribution Cost

Payslips Generated

Average Net Salary

Approved Time Off

Attendance Health

Open Blocking Warnings

Failed Payslip Deliveries

Charts

Salary Cost by Department

Monthly Net Salary Trend

Gross vs Net

Deductions by Category

Attendance/Absence

Overtime

Leave Consumption

Operational alerts

Unvalidated Payruns
Blocking Warnings
Missing Bank Details
Duplicate Payslips
Expiring Contracts
Failed Payslip Emails
Failed Payments

All dashboard figures must come from live database records.

27. End-to-End Payroll Flow

1. Employee Master
       ↓
2. Contract + Salary Structure
       ↓
3. Working Schedule
       ↓
4. Attendance + Time Off
       ↓
5. Payroll Period
       ↓
6. Payrun Wizard
       ↓
7. Employee Selection
       ↓
8. Draft Payrun
       ↓
9. Payroll Inputs
       ↓
10. Compute
       ↓
11. Warning Detection
       ↓
12. Review / Resolve
       ↓
13. Validate
       ↓
14. Mark Paid
       ↓
15. Generate PDFs
       ↓
16. Send Payslips
       ↓
17. Payment / Delivery Tracking
       ↓
18. Audit + Dashboard

28. Business Rules

Step 1 Continue never creates a Payrun.

A Payrun is created only after employee selection is submitted.

At least one employee is required.

Every Payslip belongs to exactly one Payrun.

One employee cannot have two Payslips in the same Payrun.

Cross-Payrun overlapping-period duplicate Payslips are blocking.

Payroll uses the contract applicable to the selected period.

Payroll uses the Salary Structure version associated with the
Payrun.

Salary Rules execute in ascending sequence.

Circular Salary Rule dependencies are rejected.

Approved Time Off affects payroll according to its configured
paid/unpaid policy.

Pending Time Off does not silently affect salary.

Attendance/overtime inputs are derived from Attendance records.

Manual payroll inputs require authorization and a reason.

Blocking warnings prevent validation.

Non-blocking warnings do not prevent validation.

Computed Payruns may be recomputed before validation.

Validated Payruns cannot be recomputed.

Paid Payruns are immutable.

Paid Payslips are immutable.

Payment status is distinct from the Paid Payrun state when actual
payment processing is modeled.

Bulk email delivery is tracked per recipient.

Failed deliveries can be retried without resending successful
recipients.

Audit records are append-only.

Historical Payslips retain employee, contract, structure and rule
snapshots.

Currency must be explicitly associated with monetary payroll
amounts.

Employer contributions are tracked separately from employee
deductions.

Payroll formulas execute through a safe expression evaluator and
must not execute unrestricted arbitrary code.

Deactivated/archived master records remain available where required
for historical payroll.

No hard deletion of Paid Payruns, Paid Payslips, or their historical
calculation records.

29. Important Implementation Corrections

The payroll implementation must also address these schema/business
consistency issues:

Contract → Salary Structure creation order

Salary Structures must exist before Contracts reference them, or the
foreign key must be added after both tables are created.

paidBy historical integrity

Do not allow deletion of a user to erase the historical identity of the
person who marked payroll Paid. Use restricted deletion or an actor
snapshot.

Duplicate warning

The database uniqueness constraint only detects duplicates within one
Payrun. The warning detector must check overlapping payroll periods
across Payruns.

Bank details

The Employee/Payroll domain must contain a proper bank-account source
for the MISSING_BANK_DETAILS warning rather than relying on a field
that is not represented in the database.

Company and currency

Payroll monetary records should use explicit companyId and
currencyCode rather than relying only on free-text company names or
implicit INR assumptions.

30. Minimum Required Models

The Payroll module should contain at least these models:

1. PayrollPeriod
2. Payrun
3. Payslip
4. PayslipLine
5. PayrollInput
6. PayrollWarning
7. PayrollPayment
8. PayslipDelivery
9. PayrollAuditLog
10. SalaryStructureVersion
11. SalaryRuleVersion
12. PayslipCalculationTrace

Supporting existing models:

Employee
Contract
WorkingSchedule
Attendance
TimeOffType
TimeOffAllocation
TimeOffRequest
SalaryStructure
SalaryRule
User

31. Hackathon Scope vs Production Extension

Required for the hackathon

Payrun Wizard

Employee selection

Payrun state machine

Salary computation

Salary Rule sequencing

Contract resolution

Attendance integration

Time Off integration

Payroll warnings

Payslip lines

PDF generation

Bulk email

Dashboard

RBAC

Basic audit trail

Cross-payrun duplicate detection

Strongly recommended

Payroll Inputs

Persisted warnings

Delivery logs

Computed/Validated metadata

Salary Structure version snapshot

Employee payroll/bank information

Employer contribution category

Currency

Production-oriented extensions

Actual bank/payment integration

Full calculation trace

Payroll period management

Payment reconciliation

Notification center

Advanced tax engine

Multi-company payroll

Multi-currency payroll

Payroll accounting/journal integration

Statutory filing integrations

32. Tests / Acceptance Criteria

A complete Payroll implementation must prove:

Wizard

Continue does not create a Payrun.

Create Payrun creates exactly one batch.

Empty employee selection is rejected.

Contract

Correct period contract is selected.

Missing contract blocks computation.

Overlapping contracts are rejected.

Computation

Fixed rule works.

Percentage rule works.

Percentage base can reference a configured rule.

Formula rule works.

Rules execute in sequence.

Circular dependencies are rejected.

Attendance and overtime inputs work.

Paid/unpaid leave inputs work.

Manual payroll inputs work.

Proration works where configured.

Warnings

Missing bank details detected.

Duplicate overlapping-period Payslip detected.

Missing contract detected.

Attendance exception detected.

Pending Time Off detected.

Blocking warnings prevent validation.

Non-blocking warnings do not prevent validation.

Warning resolution is audited.

Lifecycle

Draft → Computed → Validated → Paid

invalid transitions fail

recomputation is possible only before validation

Paid records cannot be changed

Delivery

PDF generated successfully.

One recipient failure does not fail all recipients.

Delivery result is persisted.

Failed recipients can be retried.

History

Paid Payslip remains readable after Employee/Contract changes.

Salary Structure version used by the Payrun remains identifiable.

Audit timeline remains immutable.

33. Final Payroll Module Contract

The Payroll module is responsible for turning a selected group of
employees and a defined payroll period into validated, explainable and
historically reproducible Payslips.

The complete contract is:

Employee
   +
Applicable Contract
   +
Working Schedule
   +
Attendance
   +
Approved Time Off
   +
Payroll Inputs
   +
Salary Structure Version
   +
Ordered Salary Rules
        ↓
   PAYSLIP COMPUTATION
        ↓
Warnings + Calculation Trace
        ↓
   PAYRUN VALIDATION
        ↓
      PAYMENT
        ↓
 PDF + Email Delivery
        ↓
 Immutable Historical Payroll
        ↓
 Dashboard + Audit

The Payroll module must prioritize accurate business logic,
deterministic salary computation, period-aware contract selection,
persisted warnings, auditability, historical reproducibility, and
reliable employee delivery over simple CRUD behavior.
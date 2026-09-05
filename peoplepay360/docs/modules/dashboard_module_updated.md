Module: dashboard

References

FR-038 (Live Filters), FR-039 (KPI Cards), FR-040 (Salary Analytics), FR-041 (Payroll Alerts), FR-042 (Attendance Overview), FR-043 (Time Off Overview), FR-044 (Department Overview)

Hackathon Spec §A7 (Reporting & Dashboard Configuration), §B9 (Payroll Dashboard)

Overview

The Dashboard is a read-only cross-module aggregation module for Payroll and HR users. It presents live metrics for payroll cost, staffing, attendance, time off, contracts, and operational warnings.

All dashboard values must be derived from live operational records. No hardcoded, demo, static, or fallback dashboard data is permitted. Filter changes must recompute all applicable widgets.

Supported filters:

Period

Company

Department

Employment Type

The Dashboard is the terminal node in the module dependency graph. Other modules must not depend on Dashboard. The dashboard aggregator may consume repository interfaces from other modules, but must never import their services or controllers.

The specification requires live aggregation across Employees, Contracts, Payroll, Attendance, and Time Off. The Hackathon specification also requires KPI cards, salary analytics, alerts, attendance/time-off overviews, and department salary/headcount analysis.

1. Core Schema Changes

The Dashboard exposes three dimensions that must be first-class relational entities rather than free-text values:

Company

Department

Employment Type

This is required for reliable filtering, grouping, historical reporting, and future multi-company support.

1.1 Company

Model

Company

Fields

Field

Type

Required

Notes

id

UUID

Yes

Primary key

code

VARCHAR

Yes

Unique stable identifier

name

VARCHAR

Yes

Display name

currency_code

CHAR(3)

Yes

Default company currency

is_active

BOOLEAN

Yes

Default true

created_at

TIMESTAMP

Yes

Audit timestamp

updated_at

TIMESTAMP

Yes

Audit timestamp

deleted_at

TIMESTAMP

No

Soft delete

Constraints

code must be unique.

Active company names should be unique.

Soft-deleted companies must not be selectable for new records.

Historical payroll records remain queryable.

Relationships

Company 1:N Department
Company 1:N Employee
Company 1:N Contract
Company 1:N SalaryStructure
Company 1:N Payrun
Company 1:N DashboardAlert

1.2 Department

Model

Department

Fields

Field

Type

Required

Notes

id

UUID

Yes

Primary key

company_id

UUID

Yes

FK → companies.id

code

VARCHAR

Yes

Unique within company

name

VARCHAR

Yes

Department name

manager_employee_id

UUID

No

Optional FK → employees.id

is_active

BOOLEAN

Yes

Default true

created_at

TIMESTAMP

Yes

Audit timestamp

updated_at

TIMESTAMP

Yes

Audit timestamp

deleted_at

TIMESTAMP

No

Soft delete

Constraints

(company_id, code) unique.

(company_id, name) unique among active departments.

Department belongs to exactly one company.

Prefer soft deletion/reassignment rather than hard deletion.

Relationships

Company 1:N Department
Department 1:N Employee

1.3 Employment Type

Model

EmploymentType

Fields

Field

Type

Required

Notes

id

UUID

Yes

Primary key

code

VARCHAR

Yes

Unique stable identifier

name

VARCHAR

Yes

Display label

description

TEXT

No

Optional

is_active

BOOLEAN

Yes

Default true

created_at

TIMESTAMP

Yes

Audit timestamp

updated_at

TIMESTAMP

Yes

Audit timestamp

deleted_at

TIMESTAMP

No

Soft delete

Recommended initial values

FULL_TIME
PART_TIME
CONTRACTOR

The overall requirements define employment type as an employee organizational attribute, including Full-Time, Part-Time, and Contractor.

2. Employee Model Updates

Employee is the central HR entity. The requirements identify Department, Employment Type, Company/organizational assignment, bank details, working schedule, and active contract as important employee context.

Add:

company_id UUID NOT NULL
department_id UUID NULL
employment_type_id UUID NOT NULL

Relationships:

Employee.company_id
    → Company.id

Employee.department_id
    → Department.id

Employee.employment_type_id
    → EmploymentType.id

Dashboard rule

If department_id IS NULL, the employee must still be included in Dashboard aggregation under:

Unassigned

The employee must never be silently dropped.

3. Contract Model Updates

Add:

company_id UUID NOT NULL

Relationship:

Contract.company_id → Company.id

The contract company must be consistent with the employee/company context used for payroll.

Contracts remain the authoritative source for period-valid employment terms.

4. Payroll Model Updates

Add company context to payroll records:

payruns.company_id UUID NOT NULL
salary_structures.company_id UUID NOT NULL

Relationships:

Payrun.company_id → Company.id
SalaryStructure.company_id → Company.id

Payslips inherit company context through Payrun.

This allows payroll dashboard calculations to filter and group reliably by company.

5. Dashboard-Specific Models

Two persisted Dashboard models are recommended:

dashboard_alerts

dashboard_saved_views

These do not replace operational records as the source of truth.

6. Dashboard Alerts

Model

DashboardAlert

Purpose

Stores actionable Dashboard alert instances with severity, lifecycle, source-record references, and resolution metadata.

The Dashboard requirements explicitly include missing bank details, duplicate payslips, unvalidated payruns, and expiring contracts as operational alerts.

Fields

Field

Type

Required

Description

id

UUID

Yes

Primary key

company_id

UUID

Yes

FK → companies.id

type

ENUM/VARCHAR

Yes

Alert category

severity

ENUM

Yes

INFO, WARNING, CRITICAL

title

VARCHAR

Yes

Short title

message

TEXT

Yes

Human-readable message

entity_type

VARCHAR

No

Employee, Payrun, Payslip, Contract

entity_id

UUID

No

Related source record

employee_id

UUID

No

Related employee

status

ENUM

Yes

OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED

blocking

BOOLEAN

Yes

Whether condition is blocking

metadata

JSONB

No

Additional structured data

first_detected_at

TIMESTAMP

Yes

First detection

last_detected_at

TIMESTAMP

Yes

Last detection

resolved_at

TIMESTAMP

No

Resolution timestamp

resolved_by

UUID

No

FK → users.id

created_at

TIMESTAMP

Yes

Audit timestamp

updated_at

TIMESTAMP

Yes

Audit timestamp

Canonical Alert Types

MISSING_BANK_DETAILS
DUPLICATE_PAYSLIP
UNVALIDATED_PAYRUN
EXPIRING_CONTRACT

Lifecycle

OPEN
  ↓
ACKNOWLEDGED
  ↓
RESOLVED

OPEN → DISMISSED

Resolved and dismissed records remain available for history/audit.

Source-of-truth rule

dashboard_alerts is not authoritative for the underlying condition.

Examples:

Missing bank details → Employee/bank data.

Duplicate payslip → Payslip/Payrun data.

Unvalidated payrun → Payrun status.

Expiring contract → Contract status/end date.

The alert service must be able to reconcile persisted alerts against live operational data.

Alert identity

Recommended deterministic keys:

MISSING_BANK_DETAILS:
    company_id + employee_id + type

DUPLICATE_PAYSLIP:
    company_id + payrun_id + employee_id + type

UNVALIDATED_PAYRUN:
    company_id + payrun_id + type

EXPIRING_CONTRACT:
    company_id + contract_id + type

This prevents repeated evaluations from generating duplicate unresolved alerts.

7. Dashboard Saved Views

Model

DashboardSavedView

Purpose

Stores reusable user-specific Dashboard filter combinations.

Saved views are convenience/configuration data and do not become a source for KPI calculations.

Fields

Field

Type

Required

Description

id

UUID

Yes

Primary key

user_id

UUID

Yes

FK → users.id

name

VARCHAR

Yes

View name

period

VARCHAR

No

Selected reporting period

company_id

UUID

No

FK → companies.id

department_id

UUID

No

FK → departments.id

employment_type_id

UUID

No

FK → employment_types.id

is_default

BOOLEAN

Yes

Default false

created_at

TIMESTAMP

Yes

Audit timestamp

updated_at

TIMESTAMP

Yes

Audit timestamp

deleted_at

TIMESTAMP

No

Soft delete

Constraints

(user_id, name) unique among active views.

A user may have at most one default view.

Saved views are user-scoped.

A user cannot access another user's saved view.

Soft deletion should preserve historical references.

8. Optional Dashboard Models

These should only be implemented if later product requirements need them.

DashboardMetricSnapshot

Used for high-volume analytics/reporting optimization.

id
company_id
period
metric_code
metric_value
dimension_type
dimension_value
snapshot_at

Important: Current requirements require live operational data, so snapshots must not replace live aggregation.

DashboardWidgetConfig

For customizable widget visibility/layout:

id
user_id
role
widget_code
position
width
is_visible
configuration
created_at
updated_at

DashboardExport

Only if Dashboard export becomes a formal requirement:

id
user_id
filter_snapshot
format
file_path
status
created_at
completed_at

9. Entity Relationship Summary

Company
 ├── Departments
 │     └── Employees
 │            └── EmploymentType
 │
 ├── Employees
 ├── Contracts
 ├── SalaryStructures
 ├── Payruns
 │     └── Payslips
 │
 └── DashboardAlerts

User
 └── DashboardSavedViews
        ├── Company
        ├── Department
        └── EmploymentType

10. Frontend

Directory

client/src/features/dashboard/

Components

File

Responsibility

components/KpiCard.tsx

Metric tile

components/SalaryByDeptChart.tsx

Salary cost grouped by Department

components/TrendChart.tsx

Monthly net salary trend

components/AlertList.tsx

Operational alerts

components/AlertDetail.tsx

Alert details/source navigation

components/AttendanceOverview.tsx

Attendance summary

components/TimeOffOverview.tsx

Leave summary/balances

components/DepartmentOverview.tsx

Department headcount/salary

components/DashboardFilters.tsx

Period, Company, Department, Employment Type

components/SavedViewSelector.tsx

Saved view selection/management

Pages

pages/DashboardPage.tsx

Hooks

hooks/useDashboardData.ts
hooks/useDashboardSavedViews.ts

Services

services/dashboard.service.ts
services/dashboard-saved-view.service.ts

11. Backend

Directory

server/src/modules/dashboard/

Controllers

controllers/dashboard.controller.ts
controllers/dashboard-saved-view.controller.ts

Services

services/dashboard-aggregator.service.ts
services/dashboard-alert.service.ts
services/dashboard-saved-view.service.ts

Aggregator dependency rule

dashboard-aggregator.service.ts may consume repository interfaces such as:

EmployeeRepository
ContractRepository
AttendanceRepository
TimeOffRepository
PayrollRepository
CompanyRepository
DepartmentRepository
EmploymentTypeRepository
DashboardAlertRepository

It must never import another module's Service, Controller, or Route.

12. Repository Layer

Recommended repositories:

dashboard-employee.repository.ts
dashboard-contract.repository.ts
dashboard-payroll.repository.ts
dashboard-attendance.repository.ts
dashboard-timeoff.repository.ts
company.repository.ts
department.repository.ts
employment-type.repository.ts
dashboard-alert.repository.ts
dashboard-saved-view.repository.ts

All dashboard aggregation queries are read-only.

13. GET Dashboard API

GET /api/dashboard

Auth

HR Manager+

Employee role must receive 403.

Query parameters

period
companyId
departmentId
employmentTypeId

Example:

GET /api/dashboard?period=2024-03&companyId=cmp_001&departmentId=dep_eng&employmentTypeId=et_full_time

Use structured IDs rather than display names.

14. Dashboard Response

{
  "filters": {
    "period": "2024-03",
    "companyId": "cmp_001",
    "departmentId": "dep_eng",
    "employmentTypeId": "et_full_time"
  },
  "kpis": {
    "totalNetSalaryPaid": 2850000,
    "payslipsGenerated": 38,
    "averageSalary": 75000,
    "approvedTimeOffDays": 47,
    "attendanceHealthPercent": 94.2
  },
  "salaryByDepartment": [
    {
      "departmentId": "dep_eng",
      "department": "Engineering",
      "totalNet": 1200000,
      "headcount": 16
    },
    {
      "departmentId": null,
      "department": "Unassigned",
      "totalNet": 350000,
      "headcount": 5
    }
  ],
  "monthlySalaryTrend": [
    { "period": "2024-01", "totalNet": 2800000 },
    { "period": "2024-02", "totalNet": 2830000 },
    { "period": "2024-03", "totalNet": 2850000 }
  ],
  "alerts": [
    {
      "id": "alert_001",
      "type": "MISSING_BANK_DETAILS",
      "severity": "WARNING",
      "count": 3,
      "message": "3 employees are missing bank details",
      "blocking": false,
      "status": "OPEN"
    },
    {
      "id": "alert_002",
      "type": "DUPLICATE_PAYSLIP",
      "severity": "CRITICAL",
      "count": 1,
      "message": "1 duplicate payslip detected",
      "blocking": true,
      "status": "OPEN"
    }
  ],
  "attendanceOverview": {
    "present": 820,
    "late": 34,
    "absent": 12,
    "overtime": 58,
    "missingCheckOuts": 5,
    "manualEdits": 9,
    "coveragePercent": 94.2
  },
  "timeOffOverview": {
    "approvedDays": 47,
    "pendingRequests": 8,
    "balancesByType": [
      {
        "typeId": "tot_01",
        "typeName": "Annual Leave",
        "totalRemaining": 312
      },
      {
        "typeId": "tot_02",
        "typeName": "Sick Leave",
        "totalRemaining": null
      }
    ]
  },
  "departmentOverview": [
    {
      "departmentId": "dep_eng",
      "department": "Engineering",
      "headcount": 16,
      "monthlySalary": 1200000
    },
    {
      "departmentId": null,
      "department": "Unassigned",
      "headcount": 5,
      "monthlySalary": 350000
    }
  ]
}

15. Saved View APIs

GET    /api/dashboard/saved-views
POST   /api/dashboard/saved-views
PATCH  /api/dashboard/saved-views/:id
DELETE /api/dashboard/saved-views/:id

Example POST:

{
  "name": "Engineering Full-Time",
  "period": "2024-03",
  "companyId": "cmp_001",
  "departmentId": "dep_eng",
  "employmentTypeId": "et_full_time",
  "isDefault": false
}

16. Dashboard Alert APIs

Optional lifecycle endpoints:

GET   /api/dashboard/alerts
PATCH /api/dashboard/alerts/:id

Example:

{
  "status": "ACKNOWLEDGED"
}

Changing an alert's lifecycle must never mutate the underlying operational record.

17. KPI Definitions

KPI

Source

Calculation

Total Net Salary Paid

Payroll

Sum net of validated/paid payruns

Payslips Generated

Payroll

Count payslips in selected scope

Average Salary

Payroll

Selected payroll net divided by defined eligible population

Approved Time Off Days

Time Off

Sum approved request durations

Attendance Health

Attendance + Schedules

Present scheduled employee-days / expected scheduled employee-days

Salary Cost by Department

Payroll + Employees

Net payroll grouped by Department

Monthly Salary Trend

Payroll

Net salary grouped by payroll period

Missing Bank Details

Employee/Payroll

Employees missing required bank details

Duplicate Payslips

Payroll

Duplicate payslip condition

Unvalidated Payruns

Payroll

Draft/Computed payruns requiring action

Expiring Contracts

Contracts

Contracts ending within default 30-day window

Present/Late/Absent

Attendance

Status counts

Overtime

Attendance

Overtime according to attendance definition

Missing Check-Outs

Attendance

Open sessions without checkout

Manual Edits

Attendance

isManualEntry = true count

Pending Time Off

Time Off

Pending request count

Leave Balance

Time Off

Remaining allocation balance by type

Department Headcount

Employees

Employees grouped by Department

Department Salary

Payroll

Net salary grouped by Department

18. Critical Calculation Rules

Attendance Health

Do not calculate attendance health as attendance rows divided by employee count.

Use expected scheduled employee-days:

attendanceHealthPercent =
    presentScheduledEmployeeDays
    /
    expectedScheduledEmployeeDays
    × 100

If the denominator is zero, return a safe zero/N/A representation rather than dividing by zero.

Average Salary

The denominator must match the selected payroll population.

Recommended:

averageSalary =
    selected payroll net
    /
    selected eligible payslip/employee population

Do not divide by all current employees when the selected payroll period has a different eligible population.

Department Aggregation

Missing Department:

department_id = NULL

must be represented as:

Unassigned

Leave Balance

For leave types without allocation:

{
  "totalRemaining": null
}

The UI displays N/A.

Company Filter

Use:

company_id

not company name.

Department Filter

Use:

department_id

not department name.

Employment Type Filter

Use:

employment_type_id

not a free-text value.

19. Live Data Rule

Incorrect:

if payroll repository fails:
    return demo dashboard data

Correct:

if aggregation fails:
    return HTTP 500

Example:

{
  "error": "Dashboard aggregation failed: payroll repository unavailable"
}

All KPI/chart values must remain derived from actual operational records.

20. Database Indexes

Companies

UNIQUE(code)
INDEX(is_active)

Departments

UNIQUE(company_id, code)
INDEX(company_id)
INDEX(company_id, is_active)

Employment Types

UNIQUE(code)
INDEX(is_active)

Employees

INDEX(company_id)
INDEX(department_id)
INDEX(employment_type_id)
INDEX(company_id, department_id)
INDEX(company_id, employment_type_id)

Contracts

INDEX(company_id)
INDEX(employee_id, start_date, end_date)
INDEX(status, end_date)

Payruns

INDEX(company_id, period_start, period_end)
INDEX(company_id, status)

Dashboard Alerts

INDEX(company_id, status)
INDEX(company_id, type, status)
INDEX(company_id, employee_id)
INDEX(entity_type, entity_id)
INDEX(last_detected_at)

Dashboard Saved Views

INDEX(user_id)
INDEX(user_id, is_default)
UNIQUE(user_id, name)

21. Migration Plan

Migration 1 — Reference entities

Create:

companies
employment_types
departments

Migration 2 — Employee relationships

Add:

employees.company_id
employees.department_id
employees.employment_type_id

Backfill before enforcing required constraints.

Migration 3 — Historical company context

Add:

contracts.company_id
payruns.company_id
salary_structures.company_id

Backfill from deterministic employee/payroll relationships.

Migration 4 — Dashboard alerts

Create:

dashboard_alerts

Migration 5 — Saved views

Create:

dashboard_saved_views

Migration 6 — Constraints/indexes

Add all foreign keys, uniqueness constraints, and performance indexes.

22. Legacy Data Migration

If existing Employee data contains free-text values such as:

company
department
employment_type

use this migration strategy:

1. Create Company records.
2. Create Department records.
3. Create EmploymentType records.
4. Match existing employee values.
5. Populate foreign keys.
6. Validate unmatched values.
7. Set unmatched departments to NULL.
8. Display NULL department as Unassigned.
9. Enforce foreign keys.
10. Deprecate/remove old free-text columns.

Company and Department names must not become permanent foreign-key identifiers.

23. Security & RBAC

Role

Dashboard

Employee

No access

HR Manager

Full dashboard

HR Payroll User

Full dashboard

HR Payroll Manager

Full dashboard

Admin

Full dashboard

The overall system requirements grant Dashboard & Reports access at HR/payroll management levels and no access to Employees.

Saved views are user-scoped.

A user must not be able to retrieve another user's saved view by changing the view ID.

24. Testing Requirements

Core relationship tests

Company relationship works.

Department relationship works.

Employment Type relationship works.

Department belongs to Company.

Invalid foreign keys are rejected.

Inactive dimensions cannot be assigned to new employees.

Historical records remain queryable.

Dashboard aggregation tests

Period filter changes results.

Company filter changes results.

Department filter changes results.

Employment Type filter changes results.

Missing Department becomes Unassigned.

Attendance denominator zero is handled safely.

Non-allocation leave returns null.

Average salary uses the correct denominator.

Payroll repository failure returns 500.

No static fallback values are returned.

Aggregator imports repositories only.

Queries are read-only.

Alert tests

Missing bank details alert created/reconciled.

Duplicate payslip alert is blocking.

Draft/Computed payrun generates unvalidated alert.

Contract ending within 30 days generates expiring alert.

Repeated evaluation does not duplicate alerts.

Resolved alerts remain historically available.

Alert lifecycle does not modify source records.

Saved-view tests

User can create a saved view.

User can list own saved views.

User cannot access another user's saved view.

Only one default view exists per user.

New default unsets previous default.

Saved view resolves IDs correctly.

Deleted dimensions do not corrupt saved-view records.

25. Acceptance Criteria

Core model

companies exists.

departments exists.

employment_types exists.

Employee has company_id.

Employee has department_id.

Employee has employment_type_id.

Contract has company_id.

Payrun has company_id.

Salary Structure has company_id.

Required indexes/constraints exist.

Dashboard models

dashboard_alerts exists.

dashboard_saved_views exists.

Alert lifecycle works.

Alert reconciliation/deduplication works.

Saved views are user-scoped.

One default view per user is enforced.

Dashboard

Period filter works.

Company filter works.

Department filter works.

Employment Type filter works.

KPI cards use live data.

Salary-by-department uses structured Department.

Monthly trend uses payroll history.

Alerts are source-linked.

Attendance overview is live.

Time-off overview is live.

Department overview is live.

Unassigned employees remain visible.

Zero denominators are safe.

Non-allocation balances display N/A.

Aggregation errors are surfaced.

No hardcoded dashboard fallback exists.

Architecture

Aggregator imports repository interfaces only.

Dashboard operations are read-only.

Other modules do not depend on Dashboard.

Employee role is blocked.

HR Manager+ access is enforced.

26. Implementation Priority

P0 — Required

companies
departments
employment_types

employees.company_id
employees.department_id
employees.employment_type_id

contracts.company_id
payruns.company_id
salary_structures.company_id

structured dashboard filters
dashboard repository/query layer
correct attendance-health calculation
correct average-salary denominator

P1 — Dashboard-specific

dashboard_alerts
dashboard_saved_views

P2 — Optional

dashboard_metric_snapshots
dashboard_widget_config
dashboard_exports
fine-grained dashboard access scopes

27. Final Architecture

                         ┌──────────────────────┐
                         │      Dashboard       │
                         │   Read-only Layer    │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼────────────────────┐
              │                     │                    │
              ▼                     ▼                    ▼
       Payroll Repository     HR Repository      Attendance/TimeOff
              │                     │                    │
              ▼                     ▼                    ▼
          Payruns              Employees          Operational Records
          Payslips              Contracts
          SalaryStructures      Company
                                Department
                                EmploymentType

                         Dashboard Alert Service
                                  │
                                  ▼
                         dashboard_alerts

                         Dashboard Saved Views
                                  ▲
                                  │
                                Users

Final Decision

The Dashboard should remain a read-only aggregation layer and should not introduce unnecessary transactional models.

The essential additions are:

companies
departments
employment_types

dashboard_alerts
dashboard_saved_views

The most important change is making Company, Department, and Employment Type first-class relational dimensions in the core HR/payroll schema. This makes Dashboard filtering, grouping, multi-company support, and historical reporting deterministic.

dashboard_alerts provides persistence for actionable alert instances, while dashboard_saved_views provides reusable user-specific filter configurations. KPI and chart values must continue to come from live operational records.
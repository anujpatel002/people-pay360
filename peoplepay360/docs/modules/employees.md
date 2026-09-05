Absolutely. Below is the **updated `employees` module specification** for PeoplePay360, incorporating the missing fields, RBAC corrections, validation rules, lifecycle behavior, payroll dependencies, auditability, and the Employee Hub requirements from the uploaded system specification. 

# Module: `employees`

## 1. Module Overview

The **Employees module** is the central HR master-data hub of PeoplePay360.

Every employee-related operational module references the Employee record:

```text
                         EMPLOYEE HUB
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
   CONTRACTS              SCHEDULES              ORGANIZATION
       │                      │                      │
       │                      ▼                      │
       │                  ATTENDANCE                 │
       │                      │                      │
       └──────────────┬───────┘                      │
                      ▼                              │
                  TIME OFF ◄────────────────────────┘
                      │
                      ▼
                   PAYROLL
                      │
                      ▼
                  PAYSLIPS
```

The Employee record is the **single source of truth for employee identity, organizational assignment, employment status, working schedule, and payroll-related master information**.

The module provides:

* Kanban view
* List view
* Unified Employee Form
* Employee search/filtering
* Employee creation/editing
* Employee archival
* Employee restoration
* Employee hierarchy/manager assignment
* Working schedule assignment
* Current contract visibility
* Payroll/bank information
* Smart buttons for related records
* Role-based access control
* Audit information

The module depends on:

```text
auth
schedules
```

and integrates with:

```text
contracts
attendance
time-off
payroll
```

The `contracts` module remains the authoritative source for contract history and contract terms; the Employee module only references the current contract.

---

# 2. Frontend

## Location

```text
client/src/features/employees/
```

---

# 3. Frontend Components

| File                                     | Responsibility                          |
| ---------------------------------------- | --------------------------------------- |
| `components/EmployeeCard.tsx`            | Kanban employee card                    |
| `components/SmartButtons.tsx`            | Related-record count/navigation buttons |
| `components/EmployeeAvatar.tsx`          | Employee avatar/photo                   |
| `components/EmployeeStatusBadge.tsx`     | Active/Archived status                  |
| `components/EmployeeForm.tsx`            | Main employee form                      |
| `components/EmployeePersonalInfo.tsx`    | Personal information section            |
| `components/EmployeeWorkInfo.tsx`        | Work/organization information           |
| `components/EmployeePayrollInfo.tsx`     | Bank/payroll information                |
| `components/EmployeeScheduleInfo.tsx`    | Schedule assignment                     |
| `components/EmployeeContractSummary.tsx` | Current contract summary                |
| `components/EmployeeFilters.tsx`         | Search/filter controls                  |
| `components/EmployeeArchiveDialog.tsx`   | Archive confirmation                    |
| `components/EmployeeRestoreDialog.tsx`   | Restore confirmation                    |

---

# 4. EmployeeCard

### `components/EmployeeCard.tsx`

Kanban card displays:

```text
┌────────────────────────────────────┐
│        [Avatar]                    │
│                                    │
│        John Smith                  │
│        Senior Engineer             │
│                                    │
│        Engineering                │
│        Full-Time                  │
│                                    │
│        ● Active                   │
└────────────────────────────────────┘
```

Display:

* Avatar
* Full name
* Employee number
* Job position
* Department
* Employment type
* Status

Clicking the card opens:

```text
/ employees / :id
```

---

# 5. Smart Buttons

### `components/SmartButtons.tsx`

Display:

```text
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Contracts  │ │ Attendance │ │  Time Off  │ │ Allocations│
│     3      │ │    142     │ │     7      │ │     4      │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

Click behavior:

```text
Contracts
→ /contracts?employeeId=emp_01

Attendance
→ /attendance?employeeId=emp_01

Time Off
→ /time-off?employeeId=emp_01

Allocations
→ /time-off/allocations?employeeId=emp_01
```

The target module must apply the `employeeId` filter and **must not display unrelated records**.

---

# 6. Employee Pages

## `pages/EmployeeKanbanPage.tsx`

Provides:

* NEW button
* Search employees
* Department filter
* Status filter
* Employment Type filter
* Company filter
* Job Position filter
* Manager filter
* Location filter
* Schedule filter
* Kanban/List toggle
* Pagination
* Empty state

Example:

```text
Employees

[ + NEW ]  [ Search employees... ]

Department ▼
Status ▼
Employment Type ▼
Company ▼

[Kanban] [List]

Engineering
────────────────────────────

[John Smith] [Sarah Jones]
[Mike Brown] [David Lee]
```

---

# 7. Employee List

### `pages/EmployeeListPage.tsx`

Columns:

| Column          |
| --------------- |
| Employee        |
| Employee Number |
| Work Email      |
| Job Position    |
| Department      |
| Employment Type |
| Manager         |
| Schedule        |
| Company         |
| Location        |
| Status          |
| Hire Date       |

Sortable columns should support:

```text
firstName
lastName
employeeNumber
workEmail
department
jobPosition
employmentType
hireDate
status
```

---

# 8. Unified Employee Form

### `pages/EmployeeFormPage.tsx`

The Employee Form is the operational hub.

Suggested layout:

```text
Employee
──────────────────────────────────────────────

[Avatar]  John Smith
          EMP-00124
          ● Active

[Contracts 3] [Attendance 142]
[Time Off 7]  [Allocations 4]

──────────────────────────────────────────────

Personal Information

First Name        Last Name
Work Email        Phone
Private Address

Emergency Contact
Emergency Contact Phone

──────────────────────────────────────────────

Work Information

Job Title
Job Position
Department
Manager
Employment Type
Company
Location
Hire Date

──────────────────────────────────────────────

Working Schedule

Schedule
Weekly Hours

──────────────────────────────────────────────

Current Contract

Contract Reference
Contract Status
Start Date
End Date
Salary Structure

[View Contract]

──────────────────────────────────────────────

Payroll Information

Bank Account
IBAN
SWIFT

──────────────────────────────────────────────

[EDIT] [ARCHIVE]
```

---

# 9. Employee Data Model

## `types/employee.types.ts`

```ts
export type EmployeeStatus =
  | 'active'
  | 'archived';

export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contractor';

export interface Employee {
  id: string;

  // Business identity
  employeeNumber?: string;

  // Personal information
  firstName: string;
  lastName: string;
  workEmail: string;
  phone?: string;
  privateAddress?: string;

  emergencyContact?: string;
  emergencyContactPhone?: string;

  avatarUrl?: string;

  // Organization
  jobTitle?: string;

  jobPositionId?: string;
  jobPositionName?: string;

  departmentId?: string;
  departmentName?: string;

  managerId?: string;
  managerName?: string;

  employmentType: EmploymentType;

  companyId?: string;
  companyName?: string;

  location?: string;

  // Operations
  scheduleId?: string;
  scheduleName?: string;

  // Employment
  hireDate: string;

  // Contract
  currentContractId?: string;

  currentContract?: CurrentContractSummary;

  // Payroll
  bankAccount?: string;
  iban?: string;
  swift?: string;

  // State
  status: EmployeeStatus;

  // Audit
  createdAt: string;
  updatedAt: string;

  createdBy?: string;
  updatedBy?: string;

  archivedAt?: string;
  archivedBy?: string;
}

export interface CurrentContractSummary {
  id: string;
  referenceCode: string;
  startDate: string;
  endDate?: string;
  wage: number;
  structureId?: string;
  structureName?: string;
  status: 'draft' | 'active' | 'expired' | 'cancelled';
}

export interface EmployeeFormValues {
  firstName: string;
  lastName: string;
  workEmail: string;

  phone?: string;
  privateAddress?: string;

  emergencyContact?: string;
  emergencyContactPhone?: string;

  jobTitle?: string;
  jobPositionId?: string;

  departmentId?: string;
  managerId?: string;

  employmentType: EmploymentType;

  companyId?: string;
  location?: string;

  scheduleId?: string;

  hireDate: string;

  bankAccount?: string;
  iban?: string;
  swift?: string;
}

export interface SmartCounts {
  employeeId: string;
  contracts: number;
  attendance: number;
  timeOff: number;
  allocations: number;
}
```

---

# 10. Employee Hooks

## `hooks/useEmployees.ts`

Responsible for:

```ts
getEmployees({
  search,
  departmentId,
  status,
  employmentType,
  jobPositionId,
  managerId,
  companyId,
  location,
  scheduleId,
  sortBy,
  sortOrder,
  page,
  limit
})
```

Returns:

```ts
{
  data: Employee[];
  total: number;
  page: number;
  limit: number;
}
```

---

## `hooks/useEmployee.ts`

Fetches:

```text
Employee
+
Current Contract
+
Smart Counts
```

The base Employee record must still load if:

* no contract exists
* no attendance exists
* no time-off exists
* no allocations exist

In such cases:

```text
Contracts: 0
Attendance: 0
Time Off: 0
Allocations: 0
```

and the UI shows an appropriate empty state.

---

# 11. Employee Services

## `services/employees.service.ts`

Required functions:

```ts
getEmployees(filters)

getEmployee(id)

getSmartCounts(id)

createEmployee(data)

updateEmployee(id, data)

archiveEmployee(id)

restoreEmployee(id)
```

---

# 12. Backend Structure

```text
server/src/modules/employees/
```

## Controllers

```text
controllers/employees.controller.ts
```

Handlers:

```text
listEmployees()
getEmployee()
createEmployee()
updateEmployee()
archiveEmployee()
restoreEmployee()
getSmartCounts()
```

---

# 13. Backend Service

### `services/employees.service.ts`

Business logic:

### Employee creation

Validate:

* Required identity
* Email
* Employment type
* Hire date
* Related references
* Email uniqueness
* Manager hierarchy
* Schedule validity

---

### Employee update

Support partial updates.

Before updating:

```text
Validate references
Validate manager hierarchy
Validate email uniqueness
Validate status rules
Validate schedule
```

---

### Manager validation

Prevent:

```text
employee.managerId === employee.id
```

Also prevent hierarchical cycles:

```text
A → B
B → C
C → A
```

The update must fail.

---

# 14. Employee Repository

### `repositories/employees.repository.ts`

Functions:

```ts
findAll(filters)

findById(id)

findByEmail(email)

findByEmployeeNumber(employeeNumber)

create(data)

update(id, data)

softArchive(id)

restore(id)

countRelated(id)
```

---

# 15. Smart Count Query

`countRelated(id)` should aggregate all four counts in **one database operation**, rather than:

```text
SELECT contracts
SELECT attendance
SELECT time_off
SELECT allocations
```

separately.

Required output:

```json
{
  "employeeId": "emp_01",
  "contracts": 3,
  "attendance": 142,
  "timeOff": 7,
  "allocations": 4
}
```

The precise counting semantics should be:

### Contracts

Count all employee contracts:

```text
Draft
Active
Expired
Cancelled
```

### Attendance

Count all attendance records for the employee.

### Time Off

Count all time-off requests.

### Allocations

Count all allocation records.

This preserves the Employee Hub's historical relationship view.

---

# 16. Employee Model

### `models/employee.model.ts`

Recommended database schema:

```text
employees
──────────────────────────────────────
id
employee_number

first_name
last_name
work_email
phone

private_address

emergency_contact
emergency_contact_phone

avatar_url

job_title
job_position_id

department_id
manager_id

employment_type

company_id
location

schedule_id

hire_date

current_contract_id

bank_account
iban
swift

status

created_at
updated_at

created_by
updated_by

archived_at
archived_by
```

---

# 17. Foreign Key Relationships

```text
Employee
│
├── managerId
│     └── Employee.id
│
├── departmentId
│     └── Department.id
│
├── jobPositionId
│     └── JobPosition.id
│
├── companyId
│     └── Company.id
│
├── scheduleId
│     └── Schedule.id
│
└── currentContractId
      └── Contract.id
```

Operational records reference:

```text
Attendance.employeeId
TimeOff.employeeId
Allocation.employeeId
Contract.employeeId
Payslip.employeeId
```

---

# 18. Important Contract Design

Do **not** make `currentContractId` the source of truth for contract history.

The `contracts` module remains authoritative.

The Employee record can expose:

```text
currentContractId
```

as a convenience/reference.

Payroll must still query the Contracts module using the pay period.

For payrun:

```text
Contract.startDate <= Payrun.startDate

AND

(
  Contract.endDate >= Payrun.endDate
  OR Contract.endDate IS NULL
)

AND

Contract.status = ACTIVE
```

The broader requirements explicitly require contextual contract selection during payroll processing. 

---

# 19. API Endpoints

## GET `/api/employees`

### Authentication

```text
Employee → Own record only
HR Manager → All employees
HR Payroll User → All employees
HR Payroll Manager → All employees
Admin → All employees
```

### Query

```text
GET /api/employees
```

Supported:

```text
search
departmentId
status
employmentType
jobPositionId
managerId
companyId
location
scheduleId
sortBy
sortOrder
page
limit
```

Example:

```text
/api/employees?
search=john
&departmentId=dept_01
&status=active
&employmentType=full_time
&sortBy=lastName
&sortOrder=asc
&page=1
&limit=20
```

---

# 20. Pagination Rules

```text
page >= 1

limit >= 1

default limit = 20

maximum limit = 100
```

Response:

```json
{
  "data": [],
  "total": 85,
  "page": 1,
  "limit": 20
}
```

---

# 21. Search Rules

`search` should search:

```text
firstName
lastName
fullName
workEmail
employeeNumber
jobTitle
jobPosition
```

Example:

```text
search=john
```

can match:

```text
John Smith
john.smith@company.com
EMP-00124
```

---

# 22. GET Employee

```http
GET /api/employees/:id
```

Response:

```json
{
  "id": "emp_01",
  "employeeNumber": "EMP-00124",

  "firstName": "John",
  "lastName": "Smith",

  "workEmail": "john.smith@company.com",
  "phone": "+1-555-0100",

  "privateAddress": "New York",

  "emergencyContact": "Jane Smith",
  "emergencyContactPhone": "+1-555-0101",

  "jobTitle": "Software Engineer",

  "jobPositionId": "pos_01",
  "jobPositionName": "Senior Engineer",

  "departmentId": "dept_01",
  "departmentName": "Engineering",

  "managerId": "emp_00",
  "managerName": "Alice Brown",

  "employmentType": "full_time",

  "companyId": "company_01",
  "companyName": "Acme Corp",

  "location": "New York",

  "scheduleId": "sch_01",
  "scheduleName": "Standard 40h",

  "hireDate": "2022-03-01",

  "currentContractId": "con_01",

  "status": "active",

  "createdAt": "2022-03-01T08:00:00Z",
  "updatedAt": "2024-01-10T10:00:00Z"
}
```

### Important

Bank information should be returned according to the authenticated user's permissions. Employees should not automatically receive unrestricted access to sensitive payroll/bank information merely because they can view their own employee profile.

---

# 23. Smart Counts API

```http
GET /api/employees/:id/smart-counts
```

Response:

```json
{
  "employeeId": "emp_01",
  "contracts": 3,
  "attendance": 142,
  "timeOff": 7,
  "allocations": 4
}
```

---

# 24. Create Employee

```http
POST /api/employees
```

Request:

```json
{
  "firstName": "John",
  "lastName": "Smith",

  "workEmail": "john.smith@company.com",
  "phone": "+1-555-0100",

  "privateAddress": "New York",

  "emergencyContact": "Jane Smith",
  "emergencyContactPhone": "+1-555-0101",

  "jobTitle": "Software Engineer",
  "jobPositionId": "pos_01",

  "departmentId": "dept_01",
  "managerId": "emp_00",

  "employmentType": "full_time",

  "companyId": "company_01",
  "location": "New York",

  "scheduleId": "sch_01",

  "hireDate": "2022-03-01",

  "bankAccount": "123456789",
  "iban": "IBAN_VALUE",
  "swift": "SWIFT_VALUE"
}
```

Server automatically sets:

```text
status = active
createdAt
updatedAt
createdBy
```

---

# 25. Update Employee

```http
PUT /api/employees/:id
```

All fields optional.

Example:

```json
{
  "departmentId": "dept_02",
  "managerId": "emp_02",
  "scheduleId": "sch_02",
  "jobPositionId": "pos_05",
  "employmentType": "full_time"
}
```

Before saving:

```text
Validate references
Validate manager hierarchy
Validate email uniqueness
Validate employee status
Validate schedule
```

---

# 26. Archive Employee

```http
DELETE /api/employees/:id
```

This is a **soft archive**, not physical deletion.

Response:

```json
{
  "message": "Employee archived",
  "id": "emp_01"
}
```

The record remains available for historical reporting.

---

# 27. Archive Restrictions

Archived employees:

| Operation               | Allowed |
| ----------------------- | ------: |
| View employee           |       ✅ |
| View contracts          |       ✅ |
| View attendance history |       ✅ |
| View time-off history   |       ✅ |
| View payroll history    |       ✅ |
| New attendance          |       ❌ |
| New time-off request    |       ❌ |
| New allocation          |       ❌ |
| New contract            |       ❌ |
| New payrun              |       ❌ |

Existing historical records must **never be deleted** merely because the employee is archived.

---

# 28. Payrun Archive Protection

Before archiving:

```text
Check whether employee is referenced by an open payrun.
```

If yes:

```http
409 Conflict
```

```json
{
  "error": "Employee is referenced by an open payrun"
}
```

This preserves payroll integrity.

---

# 29. Restore Employee

Add:

```http
POST /api/employees/:id/restore
```

Response:

```json
{
  "message": "Employee restored",
  "id": "emp_01",
  "status": "active"
}
```

Set:

```text
status = active
archivedAt = null
archivedBy = null
```

---

# 30. Validators

## `validators/employee.validator.ts`

### Required fields

```text
firstName
lastName
workEmail
employmentType
hireDate
```

### Email

Must:

* be valid
* be normalized to lowercase
* be unique

Example:

```text
John.Smith@Company.com
```

becomes:

```text
john.smith@company.com
```

---

### Employment Type

Allowed:

```text
full_time
part_time
contractor
```

---

### Status

Allowed:

```text
active
archived
```

---

### Manager

Must:

```text
exist
be active
not equal employee
not create a hierarchy cycle
```

---

### Schedule

Must:

```text
exist
be valid
not be deleted/invalid
```

---

### Department

Must reference an existing department.

---

### Job Position

Must reference an existing job position.

---

### Company

Must reference an existing company.

---

# 31. Database Constraints

Recommended constraints:

```text
PRIMARY KEY(id)

UNIQUE(work_email)

UNIQUE(employee_number)

FOREIGN KEY(manager_id)
REFERENCES employees(id)

FOREIGN KEY(department_id)
REFERENCES departments(id)

FOREIGN KEY(job_position_id)
REFERENCES job_positions(id)

FOREIGN KEY(schedule_id)
REFERENCES schedules(id)

FOREIGN KEY(company_id)
REFERENCES companies(id)
```

Foreign keys should preserve historical employee relationships where required.

---

# 32. RBAC

The Employee module must align with the system-wide RBAC.

| Capability           |    Employee | HR Manager | HR Payroll User | HR Payroll Manager | Admin |
| -------------------- | ----------: | ---------: | --------------: | -----------------: | ----: |
| View own profile     |           ✅ |          ✅ |               ✅ |                  ✅ |     ✅ |
| View other employees |           ❌ |          ✅ |               ✅ |                  ✅ |     ✅ |
| Create employee      |           ❌ |          ✅ |               ✅ |                  ✅ |     ✅ |
| Edit employee        |           ❌ |          ✅ |               ✅ |                  ✅ |     ✅ |
| Archive employee     |           ❌ |          ✅ |               ✅ |                  ✅ |     ✅ |
| Restore employee     |           ❌ |          ✅ |               ✅ |                  ✅ |     ✅ |
| View contracts       | Own/limited |          ✅ |               ✅ |                  ✅ |     ✅ |
| View attendance      | Own/limited |          ✅ |               ✅ |                  ✅ |     ✅ |
| View time-off        | Own/limited |          ✅ |               ✅ |                  ✅ |     ✅ |
| View allocations     | Own/limited |          ✅ |               ✅ |                  ✅ |     ✅ |

This corrects the earlier `HR Manager+` limitation in your original specification. The uploaded RBAC explicitly gives the Employee role **View Own** access to Employee Master. 

---

# 33. Sensitive Data Access

The following should be treated as sensitive:

```text
privateAddress
emergencyContact
bankAccount
iban
swift
```

The API/service layer should apply field-level authorization where appropriate.

For example:

```text
Employee
→ Own permitted information

HR Manager
→ HR information

Payroll roles
→ Payroll/bank information

Admin
→ Full access
```

The exact field-level visibility should be finalized as part of the system's authorization policy.

---

# 34. Auditability

Every modification should record:

```text
createdAt
createdBy

updatedAt
updatedBy

archivedAt
archivedBy
```

Important changes to audit include:

```text
Department
Manager
Job Position
Employment Type
Schedule
Company
Status
Bank information
```

This is especially important because employee master information feeds downstream payroll and attendance processes.

---

# 35. Frontend Tests

## `tests/useEmployees.test.ts`

Test:

```text
✓ fetch employees
✓ pagination
✓ search
✓ department filter
✓ status filter
✓ employment type filter
✓ company filter
✓ job position filter
✓ sorting
✓ Kanban grouping
✓ List/Kanban toggle
✓ empty state
✓ archived employees
✓ loading state
✓ error state
```

---

# 36. Service Tests

## `tests/employees.service.test.ts`

Test:

```text
✓ create employee
✓ update employee
✓ archive employee
✓ restore employee
✓ unique email validation
✓ invalid email
✓ required fields
✓ invalid employment type
✓ invalid department
✓ invalid schedule
✓ manager self-reference
✓ manager cycle
✓ archive blocked by open payrun
✓ smart-count aggregation
```

---

# 37. Integration Tests

## `tests/employees.integration.test.ts`

Test:

```text
GET    /api/employees
GET    /api/employees/:id
GET    /api/employees/:id/smart-counts
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id
POST   /api/employees/:id/restore
```

Also test RBAC:

```text
Employee → own employee only
Employee → cannot view another employee
HR Manager → all employees
HR Payroll User → all employees
HR Payroll Manager → all employees
Admin → all employees
```

---

# 38. Final Employee Module Dependency Map

```text
                         ┌──────────────┐
                         │     AUTH     │
                         └──────┬───────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │      EMPLOYEES      │
                    │                     │
                    │ Personal            │
                    │ Organization        │
                    │ Employment          │
                    │ Schedule             │
                    │ Payroll master data │
                    └─────────┬───────────┘
                              │
           ┌──────────────────┼───────────────────┐
           │                  │                   │
           ▼                  ▼                   ▼
      CONTRACTS          SCHEDULES           ATTENDANCE
           │                  │                   │
           │                  └────────┬──────────┘
           │                           │
           ▼                           ▼
      PAYROLL ◄────────────────── TIME OFF
           │
           ▼
       PAYSLIPS
```

---

# 39. What is now covered

The updated module now covers the complete Employee Master requirements:

### Employee identity

* First name
* Last name
* Work email
* Phone
* Avatar
* Employee number

### Personal HR information

* Private address
* Emergency contact
* Emergency contact phone

### Organization

* Department
* Job position
* Job title
* Manager
* Company
* Location
* Employment type

### Operations

* Working schedule
* Current active contract

### Payroll master data

* Bank account
* IBAN
* SWIFT

### Lifecycle

* Active
* Archived
* Restore
* Hire date
* Archive metadata

### Related modules

* Contracts
* Attendance
* Time Off
* Allocations
* Payroll

### Engineering

* Search
* Filtering
* Sorting
* Pagination
* Validation
* RBAC
* Auditability
* Foreign keys
* Smart-count aggregation
* Manager-cycle protection
* Email uniqueness
* Archive protection

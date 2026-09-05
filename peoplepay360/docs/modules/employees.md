# Module: employees

## References
FR-004 (Kanban View), FR-005 (List View), FR-006 (Unified Employee Form), FR-007 (Related Navigation / Smart Buttons)
Hackathon Spec §A1 (Employee Master Management), §B1 (Main Navigation), §B2 (Employee Form & Related Record Navigation)

## Overview
Central HR master data hub. Every other operational module (contracts, attendance, time-off, payroll) references an employee record. Provides Kanban and List views for browsing, and a unified Form that acts as the operational hub with smart buttons showing related-record counts and navigating to filtered views. Captures essential work details: department, manager, schedule, job position, and status. Depends on `auth`.

---

## Frontend — `client/src/features/employees/`

### Components
| File | Responsibility |
|------|---------------|
| `components/EmployeeCard.tsx` | Kanban card — avatar, name, job position, department, status badge; click opens Employee Form (FR-004) |
| `components/SmartButtons.tsx` | Row of count buttons — Contracts N / Attendance N / Time Off N / Allocations N; each navigates to that module filtered by this employee (FR-007, §B2) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/EmployeeKanbanPage.tsx` | Kanban board — NEW, Search employees, Kanban/List toggle; cards grouped by department/status (FR-004, §B1) |
| `pages/EmployeeListPage.tsx` | Sortable/filterable table — Employee, Work Email, Job Position, Department, Status columns; NEW, search, toggle (FR-005, §B1) |
| `pages/EmployeeFormPage.tsx` | Unified hub — identity, role, department, manager, schedule, company, position, location, status, work email; EDIT; SmartButtons for Contracts/Attendance/Time Off/Allocations (FR-006, §B2) |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useEmployees.ts` | Fetches paginated/filtered employee list; exposes search, department, status filter params |
| `hooks/useEmployee.ts` | Fetches single employee by ID including smart-button counts |

### Services
| File | Responsibility |
|------|---------------|
| `services/employees.service.ts` | `getEmployees(filters)`, `getEmployee(id)`, `getSmartCounts(id)`, `createEmployee()`, `updateEmployee()`, `archiveEmployee()` |

### Types
| File | Responsibility |
|------|---------------|
| `types/employee.types.ts` | `Employee`, `EmployeeStatus`, `EmployeeFormValues`, `SmartCounts` interfaces |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/useEmployees.test.ts` | Hook tests — fetch, search filter, kanban grouping, empty state |
| `tests/employees.service.test.ts` | Mocked API — CRUD, smart-count calls |

---

## Backend — `server/src/modules/employees/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/employees.controller.ts` | List, get, create, update, archive, smart-counts handlers |

### Services
| File | Responsibility |
|------|---------------|
| `services/employees.service.ts` | Archive validation (blocks if open payrun references employee), manager self-reference check, smart-count aggregation in single query |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/employees.repository.ts` | findAll (search + filter + pagination), findById, create, update, softArchive, countRelated (contracts + attendance + time-off + allocations in one query) |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/employees.routes.ts` | `/api/employees` — read: HR Manager+; write: HR Manager; archive: HR Manager |

### Validators
| File | Responsibility |
|------|---------------|
| `validators/employee.validator.ts` | Zod — firstName/lastName required, workEmail valid format, hireDate valid date, status enum, scheduleId/managerId valid references |

### Models
| File | Responsibility |
|------|---------------|
| `models/employee.model.ts` | Schema — id, firstName, lastName, workEmail, phone, jobTitle, jobPosition, department, managerId (self-FK), scheduleId (FK), company, location, status (active/archived), hireDate, timestamps |

### Types
| File | Responsibility |
|------|---------------|
| `types/employee.types.ts` | Server-side TypeScript interfaces for employee entity and filter params |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/employees.service.test.ts` | Unit — archive block, manager self-reference, smart-count aggregation |
| `tests/employees.integration.test.ts` | Integration — CRUD, search/filter queries, smart-count endpoint |

---

## API Endpoints

---

### GET `/api/employees`
**Auth:** HR Manager+

**Query Params:** `?search=john&department=Engineering&status=active&page=1&limit=20`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "emp_01",
      "firstName": "John",
      "lastName": "Smith",
      "workEmail": "john.smith@company.com",
      "phone": "+1-555-0100",
      "jobTitle": "Software Engineer",
      "jobPosition": "Senior Engineer",
      "department": "Engineering",
      "managerId": "emp_00",
      "managerName": "Alice Brown",
      "scheduleId": "sch_01",
      "scheduleName": "Standard 40h",
      "company": "Acme Corp",
      "location": "New York",
      "status": "active",
      "hireDate": "2022-03-01",
      "createdAt": "2022-03-01T08:00:00Z"
    }
  ],
  "total": 85,
  "page": 1,
  "limit": 20
}
```

---

### GET `/api/employees/:id`
**Auth:** HR Manager+

**Response `200`:**
```json
{
  "id": "emp_01",
  "firstName": "John",
  "lastName": "Smith",
  "workEmail": "john.smith@company.com",
  "phone": "+1-555-0100",
  "jobTitle": "Software Engineer",
  "jobPosition": "Senior Engineer",
  "department": "Engineering",
  "managerId": "emp_00",
  "managerName": "Alice Brown",
  "scheduleId": "sch_01",
  "scheduleName": "Standard 40h",
  "company": "Acme Corp",
  "location": "New York",
  "status": "active",
  "hireDate": "2022-03-01",
  "createdAt": "2022-03-01T08:00:00Z",
  "updatedAt": "2024-01-10T10:00:00Z"
}
```

**Response `404`:**
```json
{ "error": "Employee not found" }
```

---

### GET `/api/employees/:id/smart-counts`
**Auth:** HR Manager+

**Response `200`:**
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

### POST `/api/employees`
**Auth:** HR Manager

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "workEmail": "john.smith@company.com",
  "phone": "+1-555-0100",
  "jobTitle": "Software Engineer",
  "jobPosition": "Senior Engineer",
  "department": "Engineering",
  "managerId": "emp_00",
  "scheduleId": "sch_01",
  "company": "Acme Corp",
  "location": "New York",
  "hireDate": "2022-03-01"
}
```

**Response `201`:**
```json
{
  "id": "emp_01",
  "firstName": "John",
  "lastName": "Smith",
  "workEmail": "john.smith@company.com",
  "status": "active",
  "hireDate": "2022-03-01",
  "createdAt": "2022-03-01T08:00:00Z"
}
```

**Response `422`:**
```json
{ "error": "firstName and lastName are required" }
```

---

### PUT `/api/employees/:id`
**Auth:** HR Manager

**Request Body:** _(all fields optional)_
```json
{
  "department": "Product",
  "managerId": "emp_02",
  "scheduleId": "sch_02",
  "jobPosition": "Lead Engineer"
}
```

**Response `200`:**
```json
{
  "id": "emp_01",
  "firstName": "John",
  "lastName": "Smith",
  "department": "Product",
  "managerId": "emp_02",
  "scheduleId": "sch_02",
  "jobPosition": "Lead Engineer",
  "updatedAt": "2024-03-10T11:00:00Z"
}
```

**Response `422`:**
```json
{ "error": "An employee cannot be their own manager" }
```

---

### DELETE `/api/employees/:id`
**Auth:** HR Manager

**Request Body:** _(none)_

**Response `200`:**
```json
{ "message": "Employee archived", "id": "emp_01" }
```

**Response `409`:**
```json
{ "error": "Employee is referenced by an open payrun" }
```

---

## Key Rules (§A1, §B1, §B2)
- Kanban and List views share the same data source — toggle is UI-only, no separate endpoint (FR-004, FR-005)
- Both Kanban and List views lead to the same unified Employee Form acting as the operational hub (§B1)
- Employee Form displays: identity, role, department, manager, schedule, and active status (§B2)
- Smart buttons display counts and open filtered views for Contracts, Attendance, Time Off, and Allocations (§B2, FR-007)
- Smart-button counts are a single aggregation query — not 4 separate calls (FR-007)
- Smart-button navigation passes `employeeId` as a filter to the target module — no unrelated records shown (FR-007)
- Archiving does not delete related records — contracts, attendance, time-off remain intact and historically queryable
- `managerId` is a self-referential FK — an employee cannot be their own manager
- `scheduleId` is set here and consumed by `attendance` and `payroll` — schedule module must exist before assignment
- Missing related records (no contract, no attendance) must not prevent the base employee form from loading — show empty state (FR-006)
- Only records permitted to the authenticated user's role are returned (FR-004 validation)

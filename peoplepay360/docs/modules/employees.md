# Module: employees

## SRS References
FR-004 (Kanban View), FR-005 (List View), FR-006 (Unified Employee Form), FR-007 (Related Navigation / Smart Buttons)

## Overview
Central HR master data hub. Every other operational module (contracts, attendance, time-off, payroll) references an employee record. Provides Kanban and List views for browsing, and a unified Form that acts as the operational hub with smart buttons showing related-record counts and navigating to filtered views. Depends on `auth`.

---

## Frontend — `client/src/features/employees/`

### Components
| File | Responsibility |
|------|---------------|
| `components/EmployeeCard.tsx` | Kanban card — avatar, name, job position, department, status badge; click opens Employee Form (FR-004) |
| `components/SmartButtons.tsx` | Row of count buttons — Contracts N / Attendance N / Time Off N; each navigates to that module filtered by this employee (FR-007) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/EmployeeKanbanPage.tsx` | Kanban board — NEW, Search employees, Kanban/List toggle; cards grouped by department/status (FR-004) |
| `pages/EmployeeListPage.tsx` | Sortable/filterable table — Employee, Work Email, Job Position, Department, Status columns; NEW, search, toggle (FR-005) |
| `pages/EmployeeFormPage.tsx` | Unified hub — identity, role, department, manager, schedule, company, position, location, status, work email; EDIT; SmartButtons (FR-006) |

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
| `repositories/employees.repository.ts` | findAll (search + filter + pagination), findById, create, update, softArchive, countRelated (contracts + attendance + time-off in one query) |

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

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/employees` | HR Manager+ | Paginated + filtered list (search, department, status) |
| GET | `/api/employees/:id` | HR Manager+ | Single employee detail |
| GET | `/api/employees/:id/smart-counts` | HR Manager+ | Contracts / Attendance / Time Off counts for smart buttons |
| POST | `/api/employees` | HR Manager | Create employee |
| PUT | `/api/employees/:id` | HR Manager | Update employee |
| DELETE | `/api/employees/:id` | HR Manager | Archive employee (soft delete) |

---

## Key Rules (SRS §FR-004–007)
- Kanban and List views share the same data source — toggle is UI-only, no separate endpoint (FR-004, FR-005)
- Smart-button counts are a single aggregation query — not 3 separate calls (FR-007)
- Smart-button navigation passes `employeeId` as a filter to the target module — no unrelated records shown (FR-007)
- Archiving does not delete related records — contracts, attendance, time-off remain intact and historically queryable (SRS §8.1)
- `managerId` is a self-referential FK — an employee cannot be their own manager
- `scheduleId` is set here and consumed by `attendance` and `payroll` — schedule module must exist before assignment
- Missing related records (no contract, no attendance) must not prevent the base employee form from loading — show empty state (FR-006 error handling)
- Only records permitted to the authenticated user's role are returned (FR-004 validation)

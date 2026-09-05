# Module: employees

## Overview
HR master data for all employees. Provides Kanban, List, and Form views. Smart buttons on the form show related record counts (contracts, attendance, time-off) and navigate to those modules filtered by employee. Depends on `auth`.

---

## Frontend — `client/src/features/employees/`

### Components
| File | Responsibility |
|------|---------------|
| `components/EmployeeCard.tsx` | Kanban card — avatar, name, job title, department, status badge |
| `components/SmartButtons.tsx` | Row of count buttons (Contracts / Attendance / Time Off) linking to filtered views |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/EmployeeKanbanPage.tsx` | Kanban board grouped by department or status |
| `pages/EmployeeListPage.tsx` | Sortable, filterable table of all employees |
| `pages/EmployeeFormPage.tsx` | Create / edit employee — personal info, work details, SmartButtons |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useEmployees.ts` | Fetches paginated/filtered employee list |
| `hooks/useEmployee.ts` | Fetches single employee by ID |

### Services
| File | Responsibility |
|------|---------------|
| `services/employees.service.ts` | `getEmployees()`, `getEmployee(id)`, `createEmployee()`, `updateEmployee()`, `archiveEmployee()` |

### Types
| File | Responsibility |
|------|---------------|
| `types/employee.types.ts` | `Employee`, `EmployeeStatus`, `EmployeeFormValues` interfaces |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/useEmployees.test.ts` | Hook tests — fetch, filter, kanban grouping |
| `tests/employees.service.test.ts` | Mocked API call assertions |

---

## Backend — `server/src/modules/employees/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/employees.controller.ts` | CRUD + smart-button count endpoints |

### Services
| File | Responsibility |
|------|---------------|
| `services/employees.service.ts` | Business logic — archive check, manager validation, smart-button count aggregation |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/employees.repository.ts` | DB queries — findAll (with filters), findById, create, update, archive, countRelated |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/employees.routes.ts` | Mounts handlers on `/api/employees`, role-guarded per action |

### Validators
| File | Responsibility |
|------|---------------|
| `validators/employee.validator.ts` | Zod schema — required fields, date formats, enum values |

### Models
| File | Responsibility |
|------|---------------|
| `models/employee.model.ts` | Schema — id, firstName, lastName, email, phone, jobTitle, department, managerId, scheduleId, status, hireDate, timestamps |

### Types
| File | Responsibility |
|------|---------------|
| `types/employee.types.ts` | Server-side TypeScript interfaces for employee entity |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/employees.service.test.ts` | Unit — archive logic, smart-button counts |
| `tests/employees.integration.test.ts` | Integration — CRUD + filter queries |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/employees` | HR Manager+ | Paginated + filtered list |
| GET | `/api/employees/:id` | HR Manager+ | Single employee |
| GET | `/api/employees/:id/smart-counts` | HR Manager+ | Contract / attendance / time-off counts |
| POST | `/api/employees` | HR Manager | Create employee |
| PUT | `/api/employees/:id` | HR Manager | Update employee |
| DELETE | `/api/employees/:id` | HR Manager | Archive employee (soft delete) |

---

## Key Rules
- Archiving an employee does not delete related records — contracts, attendance, time-off remain intact
- Smart-button counts are a single aggregation query, not 3 separate calls
- `managerId` references another employee in the same table (self-referential FK)
- `scheduleId` references `working-schedules` — set here, read by `attendance` and `payroll`

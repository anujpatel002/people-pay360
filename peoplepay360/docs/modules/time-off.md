# Module: time-off

## Overview
Manages leave types, allocations per employee, leave requests, approval workflow, and balance deduction. Depends on `employees`. `payroll` reads approved time-off records to account for unpaid/paid leave in payslip computation.

---

## Frontend — `client/src/features/time-off/`

### Components
| File | Responsibility |
|------|---------------|
| `components/BalanceIndicator.tsx` | Shows remaining vs allocated days per leave type |
| `components/ApprovalActions.tsx` | Approve / Refuse buttons with optional refusal reason input |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/RequestListPage.tsx` | All leave requests — filter by employee, type, status, date range |
| `pages/RequestFormPage.tsx` | Employee submits a leave request — type, dates, reason |
| `pages/AllocationListPage.tsx` | HR view of allocations per employee per leave type |
| `pages/TypeConfigPage.tsx` | HR Payroll Manager configures leave types (name, paid/unpaid, max days) |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useTimeOffRequests.ts` | Fetches requests with filter params |
| `hooks/useAllocations.ts` | Fetches allocations for an employee |

### Services
| File | Responsibility |
|------|---------------|
| `services/time-off.service.ts` | `getRequests()`, `createRequest()`, `approveRequest()`, `refuseRequest()`, `getAllocations()`, `getTypes()` |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/useTimeOffRequests.test.ts` | Hook tests — filter, status transitions |
| `tests/time-off.service.test.ts` | Mocked API call assertions |

---

## Backend — `server/src/modules/time-off/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/time-off.controller.ts` | Handlers for types, allocations, requests, approval actions |

### Services
| File | Responsibility |
|------|---------------|
| `services/time-off.service.ts` | Orchestrates request lifecycle, calls balance service |
| `services/allocation-balance.service.ts` | Tracks remaining balance — deducts on approval, restores on refusal/cancellation |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/time-off.repository.ts` | DB queries for types, allocations, requests tables |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/time-off.routes.ts` | Mounts handlers on `/api/time-off` |

### Validators
| File | Responsibility |
|------|---------------|
| `validators/request.validator.ts` | Zod schema — startDate required, endDate >= startDate, typeId required |
| `validators/allocation.validator.ts` | Zod schema — days positive integer, year required |

### Models
| File | Responsibility |
|------|---------------|
| `models/time-off-type.model.ts` | Schema — id, name, isPaid, maxDaysPerYear, requiresApproval |
| `models/allocation.model.ts` | Schema — id, employeeId, typeId, year, totalDays, usedDays |
| `models/time-off-request.model.ts` | Schema — id, employeeId, typeId, startDate, endDate, days, status, reason, refusalReason, timestamps |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/allocation-balance.service.test.ts` | Unit — deduct on approve, restore on refuse, insufficient balance |
| `tests/time-off.integration.test.ts` | Integration — full request → approve → balance deduction flow |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/time-off/types` | HR Manager+ | All leave types |
| POST | `/api/time-off/types` | HR Payroll Manager | Create leave type |
| GET | `/api/time-off/allocations` | HR Manager+ | Allocations (filter by employeeId, year) |
| POST | `/api/time-off/allocations` | HR Manager | Create allocation |
| GET | `/api/time-off/requests` | HR Manager+ / Employee (own) | Leave requests |
| POST | `/api/time-off/requests` | Employee+ | Submit request |
| PUT | `/api/time-off/requests/:id/approve` | HR Manager | Approve request |
| PUT | `/api/time-off/requests/:id/refuse` | HR Manager | Refuse request with reason |

---

## Key Rules
- Balance deduction happens only on approval, not on submission
- Cancelling an approved request restores the balance via `allocation-balance.service.ts`
- An employee cannot request more days than their remaining allocation — validated at service level
- `payroll` reads approved requests via repository to determine paid/unpaid leave days in the pay period

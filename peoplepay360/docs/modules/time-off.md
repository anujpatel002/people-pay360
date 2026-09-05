# Module: time-off

## SRS References
FR-018 (Navigation), FR-019 (Type Configuration), FR-020 (Allocation), FR-021 (Request Creation), FR-022 (Approval/Refusal), FR-023 (Balance View)

## Overview
Manages the full leave lifecycle: configurable Time Off Types → employee Allocations → leave Requests → approval/refusal workflow → balance deduction. Navigation is grouped under a Time Off dropdown (not separate top-level items). Depends on `employees`. `payroll` reads approved requests via repository for paid/unpaid leave computation.

---

## Frontend — `client/src/features/time-off/`

### Components
| File | Responsibility |
|------|---------------|
| `components/BalanceIndicator.tsx` | Shows Allocated / Taken / Remaining per leave type for an employee (FR-023) |
| `components/ApprovalActions.tsx` | Approve / Refuse buttons with optional refusal reason input — visible only to authorized approvers (FR-022) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/RequestListPage.tsx` | All leave requests — Employee, Type, Start, End, Duration, Status; filter by employee/type/status/date range (FR-021) |
| `pages/RequestFormPage.tsx` | Submit request — Type, Start Date, End Date, Duration (auto-computed), Reason; balance check shown inline (FR-021) |
| `pages/AllocationListPage.tsx` | HR view — Employee, Type, Allocated, Taken, Remaining, Validity, Approver, Status (FR-020) |
| `pages/TypeConfigPage.tsx` | Configure leave types — Name, Unit (days/hours), Allocation Required, Approval behavior, Active, Work Entry, Color, Notes (FR-019) |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useTimeOffRequests.ts` | Fetches requests with filter params; exposes status transition actions |
| `hooks/useAllocations.ts` | Fetches allocations for an employee with Allocated/Taken/Remaining values |
| `hooks/useTimeOffTypes.ts` | Fetches all active leave types for selectors |

### Services
| File | Responsibility |
|------|---------------|
| `services/time-off.service.ts` | `getTypes()`, `createType()`, `getAllocations(employeeId)`, `createAllocation()`, `getRequests(filters)`, `createRequest()`, `approveRequest(id)`, `refuseRequest(id, reason)` |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/useTimeOffRequests.test.ts` | Hook tests — filter, status transitions, balance display |
| `tests/time-off.service.test.ts` | Mocked API — all CRUD and workflow calls |

---

## Backend — `server/src/modules/time-off/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/time-off.controller.ts` | Separate handler groups for types, allocations, requests, and approval actions |

### Services
| File | Responsibility |
|------|---------------|
| `services/time-off.service.ts` | Orchestrates request lifecycle — validates balance sufficiency before submission, calls balance service on approval/refusal |
| `services/allocation-balance.service.ts` | Atomic balance operations — deduct `days` from allocation on approval; restore on refusal or cancellation; uses DB transaction to prevent partial state (SRS §17 recommendation) |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/time-off.repository.ts` | Queries for time_off_types, allocations, requests tables — findTypes, findAllocations(employeeId, year), findRequests(filters), findBalance(employeeId, typeId), create/update for each entity |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/time-off.routes.ts` | `/api/time-off` — types CRUD: HR Payroll Manager; allocations: HR Manager; requests: Employee+ (own) / HR Manager (all); approve/refuse: HR Manager |

### Validators
| File | Responsibility |
|------|---------------|
| `validators/request.validator.ts` | Zod — typeId required, startDate required, endDate >= startDate, duration positive, employeeId valid |
| `validators/allocation.validator.ts` | Zod — employeeId required, typeId required, totalDays positive integer, validity dates valid |
| `validators/type.validator.ts` | Zod — name required, unit enum (days/hours), allocationRequired boolean, approvalMode enum |

### Models
| File | Responsibility |
|------|---------------|
| `models/time-off-type.model.ts` | Schema — id, name, unit (days/hours), allocationRequired, approvalMode (no_validation/time_off/set_by_time_off_officer), isPaid, workEntry, color, isActive, notes |
| `models/allocation.model.ts` | Schema — id, employeeId (FK), typeId (FK), year, totalDays, usedDays, validityStart, validityEnd, approverId, status, timestamps |
| `models/time-off-request.model.ts` | Schema — id, employeeId (FK), typeId (FK), allocationId (FK, nullable), startDate, endDate, days, status (Draft/Confirmed/Approved/Refused/Cancelled), reason, refusalReason, timestamps |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/allocation-balance.service.test.ts` | Unit — deduct on approve, restore on refuse, restore on cancel, insufficient balance at approval, partial allocation, expired allocation |
| `tests/time-off.integration.test.ts` | Integration — full request → approve → balance deduction; refuse → balance restored; atomic transaction on concurrent approval |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/time-off/types` | HR Manager+ | All leave types |
| POST | `/api/time-off/types` | HR Payroll Manager | Create leave type |
| PUT | `/api/time-off/types/:id` | HR Payroll Manager | Update leave type |
| GET | `/api/time-off/allocations` | HR Manager+ | Allocations (filter by employeeId, year) |
| POST | `/api/time-off/allocations` | HR Manager | Create allocation |
| GET | `/api/time-off/requests` | HR Manager+ / Employee (own) | Leave requests with filters |
| POST | `/api/time-off/requests` | Employee+ | Submit leave request |
| PUT | `/api/time-off/requests/:id/approve` | HR Manager | Approve — deducts balance |
| PUT | `/api/time-off/requests/:id/refuse` | HR Manager | Refuse with reason — no balance change |
| GET | `/api/time-off/balance/:employeeId` | HR Manager+ / Employee (own) | Remaining balances by type |

---

## Navigation (SRS §FR-018)
Time Off dropdown in top nav exposes three sub-areas:
- Time Off ▼ → Requests
- Time Off ▼ → Allocations
- Time Off ▼ → Time Off Types

## Key Rules (SRS §FR-018–023)
- Balance deduction is atomic — uses DB transaction to prevent partial state on concurrent approvals (SRS §17)
- Deduction happens only on approval, not on submission (FR-022)
- Refusal and cancellation of an approved request restore the balance (FR-022)
- An employee cannot request more days than their remaining allocation — validated at service level before submission (FR-021)
- Non-allocation leave types (allocationRequired = false) show N/A for balance (FR-023 edge case)
- Employee role sees only own requests and balances; HR Manager sees all (FR-023)
- Changing leave type policy after requests exist is an edge case — existing approved requests are not retroactively affected (FR-019 edge case)
- `payroll` reads approved requests via repository — this module does not push data to payroll

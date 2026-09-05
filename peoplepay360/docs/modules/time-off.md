# Module: time-off

## References
FR-018 (Navigation), FR-019 (Type Configuration), FR-020 (Allocation), FR-021 (Request Creation), FR-022 (Approval/Refusal), FR-023 (Balance View)
Hackathon Spec §A4 (Time Off Type & Allocation Setup), §B4 (Time Off Requests)

## Overview
Manages the full leave lifecycle: configurable Time Off Types → employee Allocations → leave Requests → approval/refusal workflow → balance deduction. Navigation is grouped under a Time Off dropdown in the top nav (not separate top-level items). Time Off Types define leave policies including units, allocation requirements, approval workflows, and payroll integration. Allocations manage employee balances, requiring approval before availability. Approved leave requests automatically deduct from assigned allocations. Depends on `employees`. `payroll` reads approved requests via repository for paid/unpaid leave computation.

---

## Frontend — `client/src/features/time-off/`

### Components
| File | Responsibility |
|------|---------------|
| `components/BalanceIndicator.tsx` | Shows Allocated / Taken / Remaining per leave type for an employee (FR-023, §A4) |
| `components/ApprovalActions.tsx` | Approve / Refuse buttons with optional refusal reason input — visible only to authorized approvers (FR-022, §B4) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/RequestListPage.tsx` | All leave requests — Employee, Type, Start Date, End Date, Duration, Status; filter by employee/type/status/date range (FR-021, §B4) |
| `pages/RequestFormPage.tsx` | Submit request — Type, Start Date, End Date, Duration (auto-computed), Reason; balance check shown inline; approval or refusal workflow (FR-021, §B4) |
| `pages/AllocationListPage.tsx` | HR view — Employee, Type, Allocated, Taken, Remaining, Validity, Approver, Status; tracks detailed metrics (FR-020, §A4) |
| `pages/TypeConfigPage.tsx` | Configure leave types — Name, Unit (days/hours), Allocation Required, Approval behavior, Active, Work Entry, Color, Notes (FR-019, §A4) |

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
| `services/allocation-balance.service.ts` | Atomic balance operations — deduct `days` from allocation on approval; restore on refusal or cancellation; uses DB transaction to prevent partial state |

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

---

### GET `/api/time-off/types`
**Auth:** HR Manager+

**Response `200`:**
```json
{
  "data": [
    {
      "id": "tot_01",
      "name": "Annual Leave",
      "unit": "days",
      "allocationRequired": true,
      "approvalMode": "time_off",
      "isPaid": true,
      "workEntry": "leave",
      "color": "#4CAF50",
      "isActive": true,
      "notes": ""
    }
  ],
  "total": 6
}
```

---

### POST `/api/time-off/types`
**Auth:** HR Payroll Manager

**Request Body:**
```json
{
  "name": "Annual Leave",
  "unit": "days",
  "allocationRequired": true,
  "approvalMode": "time_off",
  "isPaid": true,
  "workEntry": "leave",
  "color": "#4CAF50",
  "notes": ""
}
```

**Response `201`:**
```json
{
  "id": "tot_01",
  "name": "Annual Leave",
  "unit": "days",
  "allocationRequired": true,
  "isActive": true,
  "createdAt": "2024-01-01T08:00:00Z"
}
```

**Response `422`:**
```json
{ "error": "name and unit are required" }
```

---

### PUT `/api/time-off/types/:id`
**Auth:** HR Payroll Manager

**Request Body:** _(all fields optional)_
```json
{
  "name": "Annual Leave (Updated)",
  "isActive": false
}
```

**Response `200`:**
```json
{
  "id": "tot_01",
  "name": "Annual Leave (Updated)",
  "isActive": false,
  "updatedAt": "2024-03-10T11:00:00Z"
}
```

---

### GET `/api/time-off/allocations`
**Auth:** HR Manager+

**Query Params:** `?employeeId=emp_01&year=2024`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "alloc_01",
      "employeeId": "emp_01",
      "employeeName": "John Smith",
      "typeId": "tot_01",
      "typeName": "Annual Leave",
      "year": 2024,
      "totalDays": 21,
      "usedDays": 5,
      "remainingDays": 16,
      "validityStart": "2024-01-01",
      "validityEnd": "2024-12-31",
      "approverId": "u_05",
      "approverName": "HR Manager",
      "status": "Approved"
    }
  ],
  "total": 3
}
```

---

### POST `/api/time-off/allocations`
**Auth:** HR Manager

**Request Body:**
```json
{
  "employeeId": "emp_01",
  "typeId": "tot_01",
  "year": 2024,
  "totalDays": 21,
  "validityStart": "2024-01-01",
  "validityEnd": "2024-12-31"
}
```

**Response `201`:**
```json
{
  "id": "alloc_01",
  "employeeId": "emp_01",
  "typeId": "tot_01",
  "year": 2024,
  "totalDays": 21,
  "usedDays": 0,
  "status": "Approved",
  "createdAt": "2024-01-01T08:00:00Z"
}
```

**Response `422`:**
```json
{ "error": "employeeId, typeId, totalDays, and validity dates are required" }
```

---

### GET `/api/time-off/requests`
**Auth:** HR Manager+ / Employee (own)

**Query Params:** `?employeeId=emp_01&typeId=tot_01&status=Approved&dateFrom=2024-03-01&dateTo=2024-03-31&page=1&limit=20`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "req_01",
      "employeeId": "emp_01",
      "employeeName": "John Smith",
      "typeId": "tot_01",
      "typeName": "Annual Leave",
      "allocationId": "alloc_01",
      "startDate": "2024-03-18",
      "endDate": "2024-03-22",
      "days": 5,
      "status": "Approved",
      "reason": "Family vacation",
      "refusalReason": null,
      "createdAt": "2024-03-01T10:00:00Z"
    }
  ],
  "total": 7,
  "page": 1,
  "limit": 20
}
```

---

### POST `/api/time-off/requests`
**Auth:** Employee+

**Request Body:**
```json
{
  "typeId": "tot_01",
  "startDate": "2024-03-18",
  "endDate": "2024-03-22",
  "days": 5,
  "reason": "Family vacation"
}
```

**Response `201`:**
```json
{
  "id": "req_01",
  "employeeId": "emp_01",
  "typeId": "tot_01",
  "startDate": "2024-03-18",
  "endDate": "2024-03-22",
  "days": 5,
  "status": "Confirmed",
  "reason": "Family vacation",
  "createdAt": "2024-03-01T10:00:00Z"
}
```

**Response `422`:**
```json
{ "error": "Insufficient leave balance. Available: 3 days, Requested: 5 days" }
```

---

### PUT `/api/time-off/requests/:id/approve`
**Auth:** HR Manager

**Request Body:** _(none)_

**Response `200`:**
```json
{
  "id": "req_01",
  "status": "Approved",
  "allocationId": "alloc_01",
  "remainingBalance": 16,
  "updatedAt": "2024-03-05T09:00:00Z"
}
```

**Response `422`:**
```json
{ "error": "Insufficient allocation balance to approve this request" }
```

---

### PUT `/api/time-off/requests/:id/refuse`
**Auth:** HR Manager

**Request Body:**
```json
{
  "refusalReason": "Insufficient team coverage during this period"
}
```

**Response `200`:**
```json
{
  "id": "req_01",
  "status": "Refused",
  "refusalReason": "Insufficient team coverage during this period",
  "updatedAt": "2024-03-05T09:00:00Z"
}
```

---

### GET `/api/time-off/balance/:employeeId`
**Auth:** HR Manager+ / Employee (own)

**Response `200`:**
```json
{
  "employeeId": "emp_01",
  "balances": [
    {
      "typeId": "tot_01",
      "typeName": "Annual Leave",
      "unit": "days",
      "allocated": 21,
      "taken": 5,
      "remaining": 16,
      "validityEnd": "2024-12-31"
    },
    {
      "typeId": "tot_02",
      "typeName": "Sick Leave",
      "unit": "days",
      "allocated": null,
      "taken": 2,
      "remaining": null,
      "validityEnd": null
    }
  ]
}
```

---

## Navigation (§A4, §B4, FR-018)
Time Off dropdown in top nav exposes three sub-areas:
- Time Off ▼ → Requests (accessed exclusively via this path — §B4)
- Time Off ▼ → Allocations
- Time Off ▼ → Time Off Types

## Key Rules (§A4, §B4, FR-018–023)
- Time Off is accessible via the main navigation dropdown, housing Requests, Allocations, and configured Time Off Types (§A4)
- Requests are accessed exclusively via Time Off → Requests in the top navigation (§B4)
- Request List provides an overview of Employee, Type, Dates, Duration, and Status (§B4)
- Request Form details the request and supports a simple approval or refusal workflow (§B4)
- Approved requests automatically reduce balances for leave types requiring allocation (§B4)
- Allocations require approval before availability and track Allocated, Taken, Remaining, and validity periods (§A4)
- Balance deduction is atomic — uses DB transaction to prevent partial state on concurrent approvals
- Deduction happens only on approval, not on submission (FR-022)
- Refusal and cancellation of an approved request restore the balance (FR-022)
- An employee cannot request more days than their remaining allocation — validated at service level before submission (FR-021)
- Non-allocation leave types (allocationRequired = false) show N/A for balance (FR-023 edge case)
- Employee role sees only own requests and balances; HR Manager sees all (FR-023)
- `payroll` reads approved requests via repository — this module does not push data to payroll

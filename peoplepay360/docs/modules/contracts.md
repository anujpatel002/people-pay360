# Module: contracts

## References
FR-008 (Contract List), FR-009 (Contract Form), FR-010 (Period-Specific Contract Selection)
Hackathon Spec §A2 (Contract Management), §B2 (Employee Form — smart button link to contracts)

## Overview
Manages historical and active employment contracts per employee. Stores period-specific employment terms: duration, department, position, wage, and salary structure. The critical domain rule — "which contract is applicable for a given payroll period" — lives exclusively in `active-contract.resolver.ts` and is called by `payroll`. Depends on `employees` and `working-schedules`.

---

## Frontend — `client/src/features/contracts/`

### Components
| File | Responsibility |
|------|---------------|
| `components/ActiveContractBadge.tsx` | "Running" green badge vs grey "Expired/New" — visually identifies the active contract in the list; active contract must be clearly highlighted (FR-008, §A2) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/ContractListPage.tsx` | Contract list — Contract ID, Employee, Start Date, End Date, Wage/Month, Status; NEW, Search contracts; Running contract visually obvious (FR-008, §A2) |
| `pages/ContractFormPage.tsx` | Create / edit — Employee (required), Start Date, End Date, Status, Department, Job Position, Wage/Month, Working Schedule, Salary Structure, Notes (FR-009, §A2) |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useContracts.ts` | Fetches contracts filtered by employeeId, sorted by startDate descending |
| `hooks/useActiveContract.ts` | Fetches the period-applicable contract for a given employeeId + date range |

### Services
| File | Responsibility |
|------|---------------|
| `services/contracts.service.ts` | `getContracts(employeeId)`, `getContract(id)`, `getActiveContract(employeeId, periodStart, periodEnd)`, `createContract()`, `updateContract()` |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/useContracts.test.ts` | Hook tests — fetch by employee, active badge display, open-ended contract |
| `tests/contracts.service.test.ts` | Mocked API — CRUD, active contract lookup |

---

## Backend — `server/src/modules/contracts/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/contracts.controller.ts` | List, get, create, update, active-contract lookup handlers |

### Services
| File | Responsibility |
|------|---------------|
| `services/contracts.service.ts` | Orchestrates CRUD; calls resolver for active-contract queries; validates no overlapping active contracts for same employee |
| `services/active-contract.resolver.ts` | Period-based resolution — given employeeId + periodStart + periodEnd, returns the single applicable contract or throws if none/ambiguous (FR-010); ensures payroll uses only the contract applicable to the selected period, avoiding concurrent active contracts (§A2) |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/contracts.repository.ts` | findByEmployee, findById, findActiveForPeriod (date-overlap SQL query), create, update |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/contracts.routes.ts` | `/api/contracts` — read: HR Manager+; write: HR Manager |

### Validators
| File | Responsibility |
|------|---------------|
| `validators/contract.validator.ts` | Zod — employeeId required, startDate required, endDate must be after startDate when provided, wage non-negative, scheduleId and structureId valid references |

### Models
| File | Responsibility |
|------|---------------|
| `models/contract.model.ts` | Schema — id, employeeId (FK), contractRef, status (New/Running/Expired/Cancelled), department, jobPosition, wage, startDate, endDate (nullable = open-ended), scheduleId (FK), structureId (FK), notes, timestamps |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/active-contract.resolver.test.ts` | Unit — period fully inside contract, period spanning contract boundary, open-ended contract, no contract, two overlapping contracts (ambiguity error), contract starts/ends inside period |
| `tests/contracts.integration.test.ts` | Integration — CRUD, active resolution, overlap validation against test DB |

---

## API Endpoints

---

### GET `/api/contracts`
**Auth:** HR Manager+

**Query Params:** `?employeeId=emp_01&status=Running&page=1&limit=20`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "con_01",
      "contractRef": "CTR-2024-001",
      "employeeId": "emp_01",
      "employeeName": "John Smith",
      "status": "Running",
      "department": "Engineering",
      "jobPosition": "Senior Engineer",
      "wage": 75000,
      "startDate": "2023-01-01",
      "endDate": null,
      "scheduleId": "sch_01",
      "scheduleName": "Standard 40h",
      "structureId": "str_01",
      "structureName": "Regular Salary",
      "notes": "",
      "createdAt": "2023-01-01T08:00:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 20
}
```

---

### GET `/api/contracts/:id`
**Auth:** HR Manager+

**Response `200`:**
```json
{
  "id": "con_01",
  "contractRef": "CTR-2024-001",
  "employeeId": "emp_01",
  "employeeName": "John Smith",
  "status": "Running",
  "department": "Engineering",
  "jobPosition": "Senior Engineer",
  "wage": 75000,
  "startDate": "2023-01-01",
  "endDate": null,
  "scheduleId": "sch_01",
  "scheduleName": "Standard 40h",
  "structureId": "str_01",
  "structureName": "Regular Salary",
  "notes": "",
  "createdAt": "2023-01-01T08:00:00Z",
  "updatedAt": "2024-01-01T08:00:00Z"
}
```

**Response `404`:**
```json
{ "error": "Contract not found" }
```

---

### GET `/api/contracts/active`
**Auth:** HR Payroll User+

**Query Params:** `?employeeId=emp_01&periodStart=2024-03-01&periodEnd=2024-03-31`

**Response `200`:**
```json
{
  "id": "con_01",
  "contractRef": "CTR-2024-001",
  "employeeId": "emp_01",
  "employeeName": "John Smith",
  "status": "Running",
  "wage": 75000,
  "startDate": "2023-01-01",
  "endDate": null,
  "scheduleId": "sch_01",
  "structureId": "str_01"
}
```

**Response `404`:**
```json
{ "error": "No active contract found for the given period" }
```

**Response `409`:**
```json
{ "error": "Multiple overlapping contracts found for the given period" }
```

---

### POST `/api/contracts`
**Auth:** HR Manager

**Request Body:**
```json
{
  "employeeId": "emp_01",
  "contractRef": "CTR-2024-001",
  "status": "Running",
  "department": "Engineering",
  "jobPosition": "Senior Engineer",
  "wage": 75000,
  "startDate": "2023-01-01",
  "endDate": null,
  "scheduleId": "sch_01",
  "structureId": "str_01",
  "notes": ""
}
```

**Response `201`:**
```json
{
  "id": "con_01",
  "contractRef": "CTR-2024-001",
  "employeeId": "emp_01",
  "status": "Running",
  "wage": 75000,
  "startDate": "2023-01-01",
  "endDate": null,
  "createdAt": "2023-01-01T08:00:00Z"
}
```

**Response `409`:**
```json
{ "error": "Employee already has an overlapping Running contract for this period" }
```

**Response `422`:**
```json
{ "error": "employeeId and startDate are required" }
```

---

### PUT `/api/contracts/:id`
**Auth:** HR Manager

**Request Body:** _(all fields optional)_
```json
{
  "status": "Expired",
  "endDate": "2024-12-31",
  "wage": 80000,
  "notes": "Salary revised"
}
```

**Response `200`:**
```json
{
  "id": "con_01",
  "status": "Expired",
  "endDate": "2024-12-31",
  "wage": 80000,
  "notes": "Salary revised",
  "updatedAt": "2024-12-31T17:00:00Z"
}
```

---

## Key Rules (§A2, FR-008–010)
- List view must display key contract details: dates, wages, and status, clearly highlighting the active contract (§A2)
- Contract form captures employment terms: duration, department, position, wage, and salary structure (§A2)
- Payroll processes only the contract applicable to the selected period — concurrent active contracts for the same employee are blocked (§A2, FR-010)
- `active-contract.resolver.ts` is the single source of truth for period-based contract selection — `payroll` calls it, never reimplements it (FR-010)
- A contract with no `endDate` is open-ended and treated as still active (FR-009 edge case)
- Overlapping Running contracts for the same employee in the same period are a validation error — blocked at service level (FR-010)
- Contract deletion is not supported — set `endDate` or change status to Expired/Cancelled to close
- Historical contract records must not be overwritten in a way that destroys prior employment terms
- The Running contract must be visually obvious in the list view (FR-008 acceptance criteria)
- `payroll` is blocked from computing if no unique applicable contract exists for an employee in the selected period (FR-010 error handling)

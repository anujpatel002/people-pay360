# Module: contracts

## SRS References
FR-008 (Contract List), FR-009 (Contract Form), FR-010 (Period-Specific Contract Selection)

## Overview
Manages historical and active employment contracts per employee. Stores period-specific employment terms (wage, schedule, salary structure). The critical domain rule — "which contract is applicable for a given payroll period" — lives exclusively in `active-contract.resolver.ts` and is called by `payroll`. Depends on `employees` and `working-schedules`.

---

## Frontend — `client/src/features/contracts/`

### Components
| File | Responsibility |
|------|---------------|
| `components/ActiveContractBadge.tsx` | "Running" green badge vs grey "Expired/New" — visually identifies the active contract in the list (FR-008) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/ContractListPage.tsx` | Contract list — Contract ID, Employee, Start, End, Wage/Month, Status; NEW, Search contracts; Running contract visually obvious (FR-008) |
| `pages/ContractFormPage.tsx` | Create / edit — Employee (required), Start Date, End Date, Status, Department, Job Position, Wage/Month, Working Schedule, Salary Structure, Notes (FR-009) |

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
| `services/active-contract.resolver.ts` | Period-based resolution — given employeeId + periodStart + periodEnd, returns the single applicable contract or throws if none/ambiguous (FR-010) |

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

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/contracts` | HR Manager+ | List contracts (filter by employeeId) |
| GET | `/api/contracts/:id` | HR Manager+ | Single contract |
| GET | `/api/contracts/active?employeeId=&periodStart=&periodEnd=` | HR Payroll User+ | Period-applicable contract (used by payroll) |
| POST | `/api/contracts` | HR Manager | Create contract |
| PUT | `/api/contracts/:id` | HR Manager | Update contract |

---

## Key Rules (SRS §FR-008–010)
- `active-contract.resolver.ts` is the single source of truth for period-based contract selection — `payroll` calls it, never reimplements it (FR-010)
- A contract with no `endDate` is open-ended and treated as still active (FR-009 edge case)
- Overlapping Running contracts for the same employee in the same period are a validation error — blocked at service level (FR-010)
- Contract deletion is not supported — set `endDate` or change status to Expired/Cancelled to close (SRS §8.1)
- Historical contract records must not be overwritten in a way that destroys prior employment terms (SRS §8.1)
- The Running contract must be visually obvious in the list view (FR-008 acceptance criteria)
- `payroll` is blocked from computing if no unique applicable contract exists for an employee in the selected period (FR-010 error handling)

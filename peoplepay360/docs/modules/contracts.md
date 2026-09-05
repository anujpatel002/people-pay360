# Module: contracts

## Overview
Manages historical and active employment contracts per employee. The key domain rule — "which contract is active for a given pay period" — lives here in `active-contract.resolver.ts` and is called by `payroll`, never reimplemented there. Depends on `employees`.

---

## Frontend — `client/src/features/contracts/`

### Components
| File | Responsibility |
|------|---------------|
| `components/ActiveContractBadge.tsx` | Green/grey badge indicating whether a contract is currently active |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/ContractListPage.tsx` | All contracts for an employee, sorted by date descending |
| `pages/ContractFormPage.tsx` | Create / edit contract — type, wage, start/end dates, working schedule |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useContracts.ts` | Fetches contracts filtered by employeeId |
| `hooks/useActiveContract.ts` | Fetches the active contract for a given employee + period |

### Services
| File | Responsibility |
|------|---------------|
| `services/contracts.service.ts` | `getContracts(employeeId)`, `getContract(id)`, `createContract()`, `updateContract()` |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/useContracts.test.ts` | Hook tests — fetch by employee, active detection |
| `tests/contracts.service.test.ts` | Mocked API call assertions |

---

## Backend — `server/src/modules/contracts/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/contracts.controller.ts` | CRUD handlers + active contract lookup endpoint |

### Services
| File | Responsibility |
|------|---------------|
| `services/contracts.service.ts` | Orchestrates CRUD, calls resolver for active-contract queries |
| `services/active-contract.resolver.ts` | Period-based resolution — given employeeId + date range, returns the applicable contract |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/contracts.repository.ts` | DB queries — findByEmployee, findActive (date overlap query), create, update |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/contracts.routes.ts` | Mounts handlers on `/api/contracts` |

### Validators
| File | Responsibility |
|------|---------------|
| `validators/contract.validator.ts` | Zod schema — startDate required, endDate after startDate, wage positive number |

### Models
| File | Responsibility |
|------|---------------|
| `models/contract.model.ts` | Schema — id, employeeId, type (CDI/CDD/etc.), wage, startDate, endDate, scheduleId, timestamps |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/active-contract.resolver.test.ts` | Unit — overlapping periods, gap periods, multiple contracts |
| `tests/contracts.integration.test.ts` | Integration — CRUD + active resolution against test DB |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/contracts` | HR Manager+ | List contracts (filter by employeeId) |
| GET | `/api/contracts/:id` | HR Manager+ | Single contract |
| GET | `/api/contracts/active` | HR Manager+ | Active contract for employeeId + period |
| POST | `/api/contracts` | HR Manager | Create contract |
| PUT | `/api/contracts/:id` | HR Manager | Update contract |

---

## Key Rules
- `active-contract.resolver.ts` is the single source of truth for "which contract applies" — `payroll` imports and calls it, never duplicates the logic
- A contract with no `endDate` is treated as open-ended (still active)
- Overlapping contracts for the same employee are a validation error
- Contract deletion is not supported — update `endDate` to close a contract instead

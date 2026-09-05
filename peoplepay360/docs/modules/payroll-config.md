# Module: payroll-config

## SRS References
FR-024 (Salary Structure List/Form), FR-025 (Salary Rule Management), FR-026 (Salary Rule Sequencing)

## Overview
Configuration module for Salary Structures and their ordered Salary Rules. Defines *how* payslips are computed — not *who* gets paid. Edited rarely by HR Payroll Manager. `payroll` depends on this module via `rule-sequencer.ts`; this module has no dependency on employee or transactional data. Depends only on `auth`.

---

## Frontend — `client/src/features/payroll-config/`

### Components
| File | Responsibility |
|------|---------------|
| `components/RuleSequenceEditor.tsx` | Ordered list of salary rules within a structure — drag-to-reorder or numeric sequence input; sequence determines computation order (FR-026) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/SalaryStructureListPage.tsx` | All structures — Name, Rule Count, Employee Count, Active Status; NEW, search (FR-024) |
| `pages/SalaryStructureFormPage.tsx` | Create / edit structure — Name, Active status, associated rules with sequence (FR-024) |
| `pages/SalaryRuleListPage.tsx` | Rules for a structure — Name, Code, Category, Structure, Sequence; NEW, search (FR-025) |
| `pages/SalaryRuleFormPage.tsx` | Create / edit rule — Name, Code, Category, Sequence, Computation Method, Amount/Percentage/Formula (FR-025) |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useSalaryStructures.ts` | Fetches all salary structures for list and Contract/Payrun selectors |
| `hooks/useSalaryRules.ts` | Fetches rules for a given structureId, sorted by sequence |

### Services
| File | Responsibility |
|------|---------------|
| `services/payroll-config.service.ts` | `getStructures()`, `getStructure(id)`, `createStructure()`, `updateStructure()`, `getRules(structureId)`, `createRule()`, `updateRule()`, `deleteRule()` |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/RuleSequenceEditor.test.tsx` | Component — reorder rules, sequence number update, save sequence |
| `tests/payroll-config.service.test.ts` | Mocked API — CRUD for structures and rules |

---

## Backend — `server/src/modules/payroll-config/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/payroll-config.controller.ts` | CRUD handlers for salary structures and salary rules |

### Services
| File | Responsibility |
|------|---------------|
| `services/payroll-config.service.ts` | Duplicate code check within structure, structure integrity validation, circular dependency detection on rule save (FR-026), blocks structure delete if referenced by active contract |
| `services/rule-sequencer.ts` | Returns rules for a structure sorted ascending by sequence — the only export consumed by `payroll`; deterministic ordering; detects duplicate sequence numbers (FR-026) |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/salary-structure.repository.ts` | findAll, findById (with rules), create, update, isReferencedByContract |
| `repositories/salary-rule.repository.ts` | findByStructure (ordered by sequence), findById, create, update, delete |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/payroll-config.routes.ts` | `/api/payroll-config` — read: HR Payroll User+; write/delete: HR Payroll Manager only |

### Models
| File | Responsibility |
|------|---------------|
| `models/salary-structure.model.ts` | Schema — id, name, isActive, timestamps |
| `models/salary-rule.model.ts` | Schema — id, structureId (FK), code (unique within structure), name, category (Basic/Allowance/Deduction/Gross/Net/Other), sequence (integer), computationMethod (fixed_amount/percentage_of_gross/formula), amount (nullable), percentage (nullable), formula (nullable string expression), isActive, timestamps |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/rule-sequencer.test.ts` | Unit — ascending order, duplicate sequence numbers (deterministic tie-break), inactive rules excluded, empty structure |
| `tests/payroll-config.integration.test.ts` | Integration — structure + rule CRUD, delete guard when referenced by contract |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/payroll-config/structures` | HR Payroll User+ | All salary structures |
| GET | `/api/payroll-config/structures/:id` | HR Payroll User+ | Single structure with its rules |
| POST | `/api/payroll-config/structures` | HR Payroll Manager | Create structure |
| PUT | `/api/payroll-config/structures/:id` | HR Payroll Manager | Update structure |
| DELETE | `/api/payroll-config/structures/:id` | HR Payroll Manager | Delete — blocked with 409 if referenced by contract |
| GET | `/api/payroll-config/rules?structureId=` | HR Payroll User+ | Rules for a structure (ordered by sequence) |
| POST | `/api/payroll-config/rules` | HR Payroll Manager | Create rule |
| PUT | `/api/payroll-config/rules/:id` | HR Payroll Manager | Update rule |
| DELETE | `/api/payroll-config/rules/:id` | HR Payroll Manager | Delete rule |

---

## Computation Methods (SRS §FR-025)
| Method | Behaviour |
|--------|-----------|
| `fixed_amount` | Rule produces a fixed monetary value stored in `amount` |
| `percentage_of_gross` | Rule produces `percentage` × gross computed so far |
| `formula` | Rule evaluates `formula` string expression — can reference earlier rule codes as variables |

## Key Rules (SRS §FR-024–026)
- Rule `code` must be unique within a structure — used as variable name in formula evaluation by `payroll` (FR-025)
- Rules execute in ascending `sequence` order — dependent rules can reference earlier rule codes (FR-026)
- Circular rule dependencies must be detected and blocked before activation/compute (FR-026)
- `formula` is stored here and evaluated by `payslip-computation.service.ts` in `payroll` — this module stores, payroll evaluates (FR-025)
- `rule-sequencer.ts` is the only cross-module export — no other payroll-config internals are imported by `payroll`
- A structure cannot be deleted if any active contract references it — return 409 Conflict (FR-024 edge case)
- Changing a rule's amount/percentage/formula changes future payslip computation without code changes (FR-025 acceptance criteria)
- Payroll configuration must be visually distinguishable from payroll transactions in the UI (SRS §5.1)

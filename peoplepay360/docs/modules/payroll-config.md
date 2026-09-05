# Module: payroll-config

## Overview
Configuration module for Salary Structures and Salary Rules. Edited rarely by HR Payroll Manager. Completely independent of employee data — it defines *how* to compute a payslip, not *who* gets paid. `payroll` depends on this module; this module depends on nothing except `auth`.

---

## Frontend — `client/src/features/payroll-config/`

### Components
| File | Responsibility |
|------|---------------|
| `components/RuleSequenceEditor.tsx` | Drag-and-drop list to reorder salary rules within a structure |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/SalaryStructureListPage.tsx` | All salary structures — name, rule count, linked employee count |
| `pages/SalaryStructureFormPage.tsx` | Create / edit structure — name, base wage type, assign rules |
| `pages/SalaryRuleListPage.tsx` | All rules within a structure — code, name, category, sequence |
| `pages/SalaryRuleFormPage.tsx` | Create / edit rule — code, name, category, computation method, formula/amount |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useSalaryStructures.ts` | Fetches all salary structures |
| `hooks/useSalaryRules.ts` | Fetches rules for a given structureId |

### Services
| File | Responsibility |
|------|---------------|
| `services/payroll-config.service.ts` | CRUD for structures and rules |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/RuleSequenceEditor.test.tsx` | Component tests — reorder, save sequence |
| `tests/payroll-config.service.test.ts` | Mocked API call assertions |

---

## Backend — `server/src/modules/payroll-config/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/payroll-config.controller.ts` | CRUD handlers for structures and rules |

### Services
| File | Responsibility |
|------|---------------|
| `services/payroll-config.service.ts` | Business logic — duplicate code check, structure integrity validation |
| `services/rule-sequencer.ts` | Returns rules for a structure sorted by sequence number — called by `payroll` computation service |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/salary-structure.repository.ts` | DB queries for salary_structures table |
| `repositories/salary-rule.repository.ts` | DB queries for salary_rules table |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/payroll-config.routes.ts` | Mounts handlers on `/api/payroll-config`, HR Payroll Manager only |

### Models
| File | Responsibility |
|------|---------------|
| `models/salary-structure.model.ts` | Schema — id, name, baseWageType, timestamps |
| `models/salary-rule.model.ts` | Schema — id, structureId, code, name, category, sequence, computationMethod, amount, formula, timestamps |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/rule-sequencer.test.ts` | Unit — correct ordering, tie-breaking |
| `tests/payroll-config.integration.test.ts` | Integration — structure + rule CRUD |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/payroll-config/structures` | HR Payroll Manager | All salary structures |
| GET | `/api/payroll-config/structures/:id` | HR Payroll Manager | Single structure with rules |
| POST | `/api/payroll-config/structures` | HR Payroll Manager | Create structure |
| PUT | `/api/payroll-config/structures/:id` | HR Payroll Manager | Update structure |
| GET | `/api/payroll-config/rules` | HR Payroll Manager | Rules for a structureId |
| POST | `/api/payroll-config/rules` | HR Payroll Manager | Create rule |
| PUT | `/api/payroll-config/rules/:id` | HR Payroll Manager | Update rule |
| DELETE | `/api/payroll-config/rules/:id` | HR Payroll Manager | Delete rule |

---

## Key Rules
- Rule `code` must be unique within a structure — used as variable name in formula evaluation
- `computationMethod` enum: `fixed_amount` | `percentage_of_gross` | `formula`
- `formula` field is a string expression evaluated by `payslip-computation.service.ts` in `payroll` — payroll-config stores it, payroll evaluates it
- A structure cannot be deleted if any active contract references it — return 409 Conflict
- `rule-sequencer.ts` is the only export consumed by `payroll` — no other payroll-config internals are imported cross-module

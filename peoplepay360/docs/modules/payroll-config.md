# Module: payroll-config

## References
FR-024 (Salary Structure List/Form), FR-025 (Salary Rule Management), FR-026 (Salary Rule Sequencing)
Hackathon Spec §A5 (Salary Structure Setup), §A6 (Salary Rule Setup)

## Overview
Configuration module for Salary Structures and their ordered Salary Rules. Salary Structures act as containers for organized collections of Salary Rules (e.g. "Regular Salary"). Defines *how* payslips are computed — not *who* gets paid. Edited rarely by HR Payroll Manager. `payroll` depends on this module via `rule-sequencer.ts`; this module has no dependency on employee or transactional data. Depends only on `auth`.

---

## Frontend — `client/src/features/payroll-config/`

### Components
| File | Responsibility |
|------|---------------|
| `components/RuleSequenceEditor.tsx` | Ordered list of salary rules within a structure — drag-to-reorder or numeric sequence input; sequence determines computation order (FR-026, §A5) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/SalaryStructureListPage.tsx` | All structures — Name, Rule Count, Employee Count, Active Status; NEW, search (FR-024, §A5) |
| `pages/SalaryStructureFormPage.tsx` | Create / edit structure — Name, Active status, associated rules with sequence (FR-024, §A5) |
| `pages/SalaryRuleListPage.tsx` | Rules for a structure — Name, Code, Category, Structure, Sequence; NEW, search (FR-025, §A6) |
| `pages/SalaryRuleFormPage.tsx` | Create / edit rule — Name, Code, Category, Sequence, Computation Method, Amount/Percentage/Formula (FR-025, §A6) |

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

---

### GET `/api/payroll-config/structures`
**Auth:** HR Payroll User+

**Query Params:** `?search=regular&isActive=true`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "str_01",
      "name": "Regular Salary",
      "isActive": true,
      "ruleCount": 6,
      "employeeCount": 42,
      "createdAt": "2023-01-01T08:00:00Z"
    }
  ],
  "total": 3
}
```

---

### GET `/api/payroll-config/structures/:id`
**Auth:** HR Payroll User+

**Response `200`:**
```json
{
  "id": "str_01",
  "name": "Regular Salary",
  "isActive": true,
  "rules": [
    {
      "id": "rule_01",
      "code": "BASIC",
      "name": "Basic Salary",
      "category": "Basic",
      "sequence": 1,
      "computationMethod": "fixed_amount",
      "amount": 50000,
      "percentage": null,
      "formula": null,
      "isActive": true
    },
    {
      "id": "rule_02",
      "code": "HRA",
      "name": "House Rent Allowance",
      "category": "Allowance",
      "sequence": 2,
      "computationMethod": "percentage_of_gross",
      "amount": null,
      "percentage": 40,
      "formula": null,
      "isActive": true
    }
  ],
  "createdAt": "2023-01-01T08:00:00Z",
  "updatedAt": "2024-01-10T10:00:00Z"
}
```

**Response `404`:**
```json
{ "error": "Salary structure not found" }
```

---

### POST `/api/payroll-config/structures`
**Auth:** HR Payroll Manager

**Request Body:**
```json
{
  "name": "Regular Salary",
  "isActive": true
}
```

**Response `201`:**
```json
{
  "id": "str_01",
  "name": "Regular Salary",
  "isActive": true,
  "ruleCount": 0,
  "createdAt": "2023-01-01T08:00:00Z"
}
```

**Response `422`:**
```json
{ "error": "name is required" }
```

---

### PUT `/api/payroll-config/structures/:id`
**Auth:** HR Payroll Manager

**Request Body:** _(all fields optional)_
```json
{
  "name": "Regular Salary v2",
  "isActive": false
}
```

**Response `200`:**
```json
{
  "id": "str_01",
  "name": "Regular Salary v2",
  "isActive": false,
  "updatedAt": "2024-03-10T11:00:00Z"
}
```

---

### DELETE `/api/payroll-config/structures/:id`
**Auth:** HR Payroll Manager

**Request Body:** _(none)_

**Response `200`:**
```json
{ "message": "Structure deleted", "id": "str_01" }
```

**Response `409`:**
```json
{ "error": "Structure is referenced by one or more active contracts" }
```

---

### GET `/api/payroll-config/rules`
**Auth:** HR Payroll User+

**Query Params:** `?structureId=str_01`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "rule_01",
      "structureId": "str_01",
      "code": "BASIC",
      "name": "Basic Salary",
      "category": "Basic",
      "sequence": 1,
      "computationMethod": "fixed_amount",
      "amount": 50000,
      "percentage": null,
      "formula": null,
      "isActive": true
    },
    {
      "id": "rule_02",
      "structureId": "str_01",
      "code": "HRA",
      "name": "House Rent Allowance",
      "category": "Allowance",
      "sequence": 2,
      "computationMethod": "percentage_of_gross",
      "amount": null,
      "percentage": 40,
      "formula": null,
      "isActive": true
    },
    {
      "id": "rule_03",
      "structureId": "str_01",
      "code": "PF",
      "name": "Provident Fund",
      "category": "Deduction",
      "sequence": 5,
      "computationMethod": "formula",
      "amount": null,
      "percentage": null,
      "formula": "BASIC * 0.12",
      "isActive": true
    }
  ],
  "total": 6
}
```

---

### POST `/api/payroll-config/rules`
**Auth:** HR Payroll Manager

**Request Body:**
```json
{
  "structureId": "str_01",
  "code": "BONUS",
  "name": "Performance Bonus",
  "category": "Allowance",
  "sequence": 3,
  "computationMethod": "fixed_amount",
  "amount": 5000,
  "percentage": null,
  "formula": null
}
```

**Response `201`:**
```json
{
  "id": "rule_04",
  "structureId": "str_01",
  "code": "BONUS",
  "name": "Performance Bonus",
  "category": "Allowance",
  "sequence": 3,
  "computationMethod": "fixed_amount",
  "amount": 5000,
  "isActive": true,
  "createdAt": "2024-01-15T09:00:00Z"
}
```

**Response `409`:**
```json
{ "error": "Rule code BONUS already exists in this structure" }
```

**Response `422`:**
```json
{ "error": "structureId, code, name, category, sequence, and computationMethod are required" }
```

---

### PUT `/api/payroll-config/rules/:id`
**Auth:** HR Payroll Manager

**Request Body:** _(all fields optional)_
```json
{
  "amount": 6000,
  "sequence": 4
}
```

**Response `200`:**
```json
{
  "id": "rule_04",
  "code": "BONUS",
  "amount": 6000,
  "sequence": 4,
  "updatedAt": "2024-03-10T11:00:00Z"
}
```

**Response `422`:**
```json
{ "error": "Circular dependency detected in rule formula" }
```

---

### DELETE `/api/payroll-config/rules/:id`
**Auth:** HR Payroll Manager

**Request Body:** _(none)_

**Response `200`:**
```json
{ "message": "Rule deleted", "id": "rule_04" }
```

---

## Computation Methods (§A6, FR-025)
| Method | Behaviour |
|--------|-----------|
| `fixed_amount` | Rule produces a fixed monetary value stored in `amount` |
| `percentage_of_gross` | Rule produces `percentage` × gross computed so far |
| `formula` | Rule evaluates `formula` string expression — can reference earlier rule codes as variables |

## Rule Categories (§A6)
Basic, Allowances, Gross, Deductions, Net — allow clear distinction of salary components on payslips

## Key Rules (§A5, §A6, FR-024–026)
- Salary Structures act as containers for organized collections of Salary Rules (§A5)
- Structures require List and Form views displaying: number of rules, employee count, and active status (§A5)
- The form view manages included salary rules and their execution sequence (§A5)
- Selected structure on a Payrun dictates the specific set of rules applied to calculate employee payslips (§A5)
- Salary Rules define how earnings and deductions are calculated using Name, Code, Category, and Sequence (§A6)
- Rules are processed in a specific sequence to ensure dependencies are respected — complex totals build upon earlier calculations (§A6)
- Flexible computation methods (fixed amounts, percentages, formulas) drive actual salary calculations visible on final payslips (§A6)
- Rule `code` must be unique within a structure — used as variable name in formula evaluation by `payroll` (FR-025)
- Circular rule dependencies must be detected and blocked before activation/compute (FR-026)
- `formula` is stored here and evaluated by `payslip-computation.service.ts` in `payroll` — this module stores, payroll evaluates (FR-025)
- `rule-sequencer.ts` is the only cross-module export — no other payroll-config internals are imported by `payroll`
- A structure cannot be deleted if any active contract references it — return 409 Conflict (FR-024 edge case)
- Changing a rule's amount/percentage/formula changes future payslip computation without code changes (FR-025 acceptance criteria)
- Payroll configuration must be visually distinguishable from payroll transactions in the UI

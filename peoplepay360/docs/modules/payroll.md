# Module: payroll

## References
FR-027 (Wizard Step 1), FR-028 (Wizard Step 2), FR-029 (State Machine), FR-030 (Computation), FR-031 (Warnings), FR-032 (Validation), FR-033 (Mark Paid), FR-034 (Payslip List), FR-035 (Payslip Detail), FR-036 (PDF), FR-037 (Bulk Email)
Hackathon Spec §B5 (Payrun Creation Wizard), §B6 (Payrun Processing Screen), §B7 (Payslip & Salary Computation), §B8 (Payslip PDF & Employee Delivery)

## Overview
Transactional module that creates Payruns and computes Payslips. A Payslip is always a child of a Payrun — they share one computation pass. Payslips can be accessed via parent Payruns or from the dedicated Payslips list view. Depends on `contracts` (active-contract resolver), `working-schedules`, `attendance`, `time-off`, and `payroll-config` (rule-sequencer). Finalized/paid records are retained as immutable history.

## Payrun State Machine (FR-029)
```
Draft → Computed → Validated → Paid
```
Transitions are one-way. No rollback after Paid.

---

## Frontend — `client/src/features/payroll/`

### Components
| File | Responsibility |
|------|---------------|
| `components/PayrunWizardStep1.tsx` | Scope form — Salary Structure (required), Period Start/End (required), employee type/company filters; Continue does NOT create a Payrun record (FR-027, §B5) |
| `components/PayrunWizardStep2.tsx` | Employee selection — search, checkboxes, Back, Create Payrun; at least one employee required; Create Payrun initializes the batch and opens the processing view (FR-028, §B5) |
| `components/WarningBanner.tsx` | Displays blocking and non-blocking warnings (missing contract, missing bank details, duplicate payslip) before and after compute (FR-031, §B6) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/PayrunListPage.tsx` | All payruns — Period, Status, Total Gross, Total Net, Warnings count; NEW opens wizard (FR-029, §B6) |
| `pages/PayrunProcessingPage.tsx` | State machine UI — Compute, Validate, Mark Paid, Send Payslips action buttons; run name, structure, period, status; warning summary; payslip sub-list (FR-029, §B6) |
| `pages/PayslipListPage.tsx` | Payslips for a payrun — Employee, Warning, Period, Basic, Gross, Net, Structure, Status; also accessible as dedicated top-level list view (FR-034, §B7) |
| `pages/PayslipDetailPage.tsx` | Full breakdown — Employee, Structure, Payrun, Period, Status, Worked Days; Salary Computation section with rule-level lines (Basic/Allowances/Gross/Deductions/Net); Compute, Mark Paid, Print Payslip actions (FR-035, §B7) |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/usePayrunWizard.ts` | Multi-step wizard state — step navigation, form values, employee selection, validation; no record created until final submit |
| `hooks/usePayslip.ts` | Fetches single payslip with full line-item breakdown |

### Services
| File | Responsibility |
|------|---------------|
| `services/payrun.service.ts` | `getPayruns()`, `createPayrun()`, `computePayrun(id)`, `validatePayrun(id)`, `markPaid(id)`, `sendPayslips(id)` |
| `services/payslip.service.ts` | `getPayslips(payrunId)`, `getPayslip(id)` |
| `services/payslip-pdf.client.ts` | Triggers PDF endpoint, handles blob download for Print Payslip (FR-036, §B8) |

### Types
| File | Responsibility |
|------|---------------|
| `types/payrun.types.ts` | `Payrun`, `PayrunStatus`, `PayrunFormValues`, `PayrunWarning` interfaces |
| `types/payslip.types.ts` | `Payslip`, `PayslipLine`, `PayslipSummary`, `ComputationInput` interfaces |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/usePayrunWizard.test.ts` | Step transitions, validation, no record created on Continue |
| `tests/payrun.service.test.ts` | Mocked API — all state transition calls |

---

## Backend — `server/src/modules/payroll/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/payrun.controller.ts` | Payrun CRUD + state transition handlers (compute, validate, mark-paid, send) |
| `controllers/payslip.controller.ts` | Payslip list, detail, PDF generation, email send handlers |

### Services
| File | Responsibility |
|------|---------------|
| `services/payrun.service.ts` | Payrun lifecycle — create batch, trigger computation, enforce state transitions, mark paid + freeze fields |
| `services/payslip-computation.service.ts` | Core engine — calls `active-contract.resolver.ts`, calls `rule-sequencer.ts`, pulls attendance + time-off data, evaluates rules in sequence, produces PayslipLine records; computation logic automatically uses the applicable period contract alongside the Payrun's assigned Salary Structure (FR-030, §B7); sample: Basic ₹50,000 + Allowances ₹30,000 = Gross ₹80,000 − Deductions ₹5,000 = Net ₹75,000 |
| `services/payslip-pdf.service.ts` | Renders payslip data into HTML template → PDF buffer; per-item failure is retryable (FR-036, §B8) |
| `services/payslip-mailer.service.ts` | Attaches PDF per employee, sends via configured SMTP; records per-recipient success/failure; provider failure does not mark all as sent (FR-037, §B8) |
| `services/warning-detector.service.ts` | Pre-compute checks — missing contract (blocking), missing bank details (non-blocking), duplicate payslip (blocking), zero worked days (non-blocking); exposes machine-readable warning codes + human messages (FR-031, §B6) |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/payrun.repository.ts` | findAll, findById, create, updateStatus, freezeFields (on mark-paid) |
| `repositories/payslip.repository.ts` | findByPayrun, findById, createBatch, updateLines, findWithWarnings |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/payroll.routes.ts` | `/api/payroll` — read: HR Payroll User+; create/compute: HR Payroll User; validate/mark-paid/send: HR Payroll Manager |

### Validators
| File | Responsibility |
|------|---------------|
| `validators/payrun.validator.ts` | Zod — structureId required, periodStart required, periodEnd required, periodEnd after periodStart, at least one employeeId in selection |

### Models
| File | Responsibility |
|------|---------------|
| `models/payrun.model.ts` | Schema — id, name, periodStart, periodEnd, structureId (FK), status (Draft/Computed/Validated/Paid), totalGross, totalNet, warningCount, paidAt, paidBy, timestamps |
| `models/payslip.model.ts` | Schema — id, payrunId (FK), employeeId (FK), contractId (FK, snapshot), gross, deductions, net, workedDays, status, warningCodes (JSON), timestamps |
| `models/payslip-line.model.ts` | Schema — id, payslipId (FK), ruleCode, ruleName, category (Basic/Allowance/Deduction/Gross/Net/Other), amount, sequence |

### Types
| File | Responsibility |
|------|---------------|
| `types/payrun.types.ts` | Server-side interfaces for payrun entity, status enum, warning shape |
| `types/payslip.types.ts` | Server-side interfaces for payslip, line items, computation input/output |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/payslip-computation.service.test.ts` | Unit — fixed rule, percentage rule, formula rule, rule sequence order, missing contract blocks compute |
| `tests/warning-detector.service.test.ts` | Unit — each warning condition independently; blocking vs non-blocking classification |
| `tests/payroll.integration.test.ts` | Integration — full wizard → create → compute → validate → mark-paid flow; PDF generation; email per-recipient result tracking |

---

## API Endpoints

---

### GET `/api/payroll/payruns`
**Auth:** HR Payroll User+

**Query Params:** `?status=Computed&page=1&limit=20`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "run_01",
      "name": "March 2024 Payroll",
      "periodStart": "2024-03-01",
      "periodEnd": "2024-03-31",
      "structureId": "str_01",
      "structureName": "Regular Salary",
      "status": "Computed",
      "totalGross": 3200000,
      "totalNet": 2850000,
      "warningCount": 2,
      "paidAt": null,
      "paidBy": null,
      "createdAt": "2024-03-28T10:00:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

---

### POST `/api/payroll/payruns`
**Auth:** HR Payroll User

**Request Body:**
```json
{
  "name": "March 2024 Payroll",
  "structureId": "str_01",
  "periodStart": "2024-03-01",
  "periodEnd": "2024-03-31",
  "employeeIds": ["emp_01", "emp_02", "emp_03"]
}
```

**Response `201`:**
```json
{
  "id": "run_01",
  "name": "March 2024 Payroll",
  "periodStart": "2024-03-01",
  "periodEnd": "2024-03-31",
  "structureId": "str_01",
  "status": "Draft",
  "payslipCount": 3,
  "createdAt": "2024-03-28T10:00:00Z"
}
```

**Response `422`:**
```json
{ "error": "structureId, periodStart, periodEnd, and at least one employeeId are required" }
```

---

### POST `/api/payroll/payruns/:id/compute`
**Auth:** HR Payroll User

**Request Body:** _(none)_

**Response `200`:**
```json
{
  "id": "run_01",
  "status": "Computed",
  "totalGross": 3200000,
  "totalNet": 2850000,
  "warningCount": 2,
  "warnings": [
    {
      "code": "MISSING_BANK_DETAILS",
      "employeeId": "emp_02",
      "employeeName": "Jane Doe",
      "message": "Bank details missing for Jane Doe",
      "blocking": false
    },
    {
      "code": "MISSING_CONTRACT",
      "employeeId": "emp_03",
      "employeeName": "Bob Lee",
      "message": "No active contract found for Bob Lee in this period",
      "blocking": true
    }
  ],
  "updatedAt": "2024-03-28T10:05:00Z"
}
```

**Response `422`:**
```json
{ "error": "Payrun must be in Draft status to compute" }
```

---

### POST `/api/payroll/payruns/:id/validate`
**Auth:** HR Payroll Manager

**Request Body:** _(none)_

**Response `200`:**
```json
{
  "id": "run_01",
  "status": "Validated",
  "updatedAt": "2024-03-28T11:00:00Z"
}
```

**Response `422`:**
```json
{ "error": "Cannot validate: 1 blocking warning(s) must be resolved first" }
```

---

### POST `/api/payroll/payruns/:id/mark-paid`
**Auth:** HR Payroll Manager

**Request Body:** _(none)_

**Response `200`:**
```json
{
  "id": "run_01",
  "status": "Paid",
  "paidAt": "2024-03-31T09:00:00Z",
  "paidBy": "u_05",
  "updatedAt": "2024-03-31T09:00:00Z"
}
```

**Response `422`:**
```json
{ "error": "Payrun must be in Validated status to mark as paid" }
```

---

### POST `/api/payroll/payruns/:id/send`
**Auth:** HR Payroll Manager

**Request Body:** _(none)_

**Response `200`:**
```json
{
  "payrunId": "run_01",
  "results": [
    { "employeeId": "emp_01", "email": "john.smith@company.com", "status": "sent" },
    { "employeeId": "emp_02", "email": "jane.doe@company.com", "status": "failed", "error": "SMTP delivery failed" }
  ],
  "sentCount": 1,
  "failedCount": 1
}
```

---

### GET `/api/payroll/payruns/:id/payslips`
**Auth:** HR Payroll User+

**Response `200`:**
```json
{
  "payrunId": "run_01",
  "data": [
    {
      "id": "slip_01",
      "employeeId": "emp_01",
      "employeeName": "John Smith",
      "contractId": "con_01",
      "gross": 80000,
      "deductions": 5000,
      "net": 75000,
      "workedDays": 22,
      "status": "Computed",
      "warningCodes": []
    },
    {
      "id": "slip_02",
      "employeeId": "emp_02",
      "employeeName": "Jane Doe",
      "contractId": "con_02",
      "gross": 90000,
      "deductions": 6000,
      "net": 84000,
      "workedDays": 22,
      "status": "Computed",
      "warningCodes": ["MISSING_BANK_DETAILS"]
    }
  ],
  "total": 2
}
```

---

### GET `/api/payroll/payslips`
**Auth:** HR Payroll User+

**Query Params:** `?employeeId=emp_01&status=Computed&page=1&limit=20`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "slip_01",
      "payrunId": "run_01",
      "payrunName": "March 2024 Payroll",
      "employeeId": "emp_01",
      "employeeName": "John Smith",
      "periodStart": "2024-03-01",
      "periodEnd": "2024-03-31",
      "gross": 80000,
      "deductions": 5000,
      "net": 75000,
      "workedDays": 22,
      "status": "Computed",
      "warningCodes": []
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 20
}
```

---

### GET `/api/payroll/payslips/:id`
**Auth:** HR Payroll User+ / Employee (own)

**Response `200`:**
```json
{
  "id": "slip_01",
  "payrunId": "run_01",
  "payrunName": "March 2024 Payroll",
  "employeeId": "emp_01",
  "employeeName": "John Smith",
  "contractId": "con_01",
  "structureId": "str_01",
  "structureName": "Regular Salary",
  "periodStart": "2024-03-01",
  "periodEnd": "2024-03-31",
  "workedDays": 22,
  "gross": 80000,
  "deductions": 5000,
  "net": 75000,
  "status": "Computed",
  "warningCodes": [],
  "lines": [
    { "id": "line_01", "ruleCode": "BASIC", "ruleName": "Basic Salary", "category": "Basic", "amount": 50000, "sequence": 1 },
    { "id": "line_02", "ruleCode": "HRA", "ruleName": "House Rent Allowance", "category": "Allowance", "amount": 20000, "sequence": 2 },
    { "id": "line_03", "ruleCode": "TRAVEL", "ruleName": "Travel Allowance", "category": "Allowance", "amount": 10000, "sequence": 3 },
    { "id": "line_04", "ruleCode": "GROSS", "ruleName": "Gross Salary", "category": "Gross", "amount": 80000, "sequence": 4 },
    { "id": "line_05", "ruleCode": "PF", "ruleName": "Provident Fund", "category": "Deduction", "amount": 5000, "sequence": 5 },
    { "id": "line_06", "ruleCode": "NET", "ruleName": "Net Salary", "category": "Net", "amount": 75000, "sequence": 6 }
  ],
  "createdAt": "2024-03-28T10:05:00Z"
}
```

**Response `403`:**
```json
{ "error": "Access denied to this payslip" }
```

---

### GET `/api/payroll/payslips/:id/pdf`
**Auth:** HR Payroll User+ / Employee (own)

**Request Body:** _(none)_

**Response `200`:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="payslip_emp_01_march_2024.pdf"
<binary PDF buffer>
```

**Response `404`:**
```json
{ "error": "Payslip not found" }
```

---

## Key Rules (§B5–B8, FR-027–037)
- Clicking NEW launches a setup wizard — Step 1 defines Salary Structure and Period; clicking Continue moves to employee selection WITHOUT creating the Payrun (§B5, FR-027)
- Step 2 filters eligible staff for explicit user selection; Create Payrun initializes the batch containing only selected employees and opens the processing view (§B5, FR-028)
- Payrun Form provides processing actions: Compute, Validate, Mark Paid, and Send Payslips (§B6)
- Payrun displays: run name, structure, period, status, and summary list of payslips (§B6)
- Highlights warnings such as missing bank details or duplicate payslips prior to finalization (§B6)
- Payslips can be accessed via parent Payruns or from the dedicated Payslips list view (§B7)
- Salary Computation section details individual rule breakdowns: Basic, Allowances, Deductions, Gross, and Net amounts (§B7)
- Computation logic automatically uses the applicable period contract alongside the Payrun's assigned Salary Structure (§B7)
- Print Payslip action generates a printable PDF document for individual employees (§B8)
- Parent Payrun includes a Send Payslips action for bulk email distribution (§B8)
- `payslip-computation.service.ts` calls `active-contract.resolver.ts` — never reimplements period-based contract logic (FR-010, FR-030)
- `payslip-computation.service.ts` calls `rule-sequencer.ts` — rules applied in deterministic ascending sequence (FR-026, FR-030)
- Blocking warnings (missing contract, duplicate payslip) prevent Validate and Mark Paid (FR-031, FR-032)
- Non-blocking warnings (missing bank details, zero worked days) are stored and shown but do not block (FR-031)
- State transitions are one-way: Draft → Computed → Validated → Paid — no rollback (FR-029)
- Paid payrun fields are frozen — historical payroll remains queryable and explainable (FR-033)
- Bulk email reports per-recipient success/failure — provider failure does not silently mark all as sent (FR-037)
- Finalized or paid payroll batches are preserved as historical records (§B6)

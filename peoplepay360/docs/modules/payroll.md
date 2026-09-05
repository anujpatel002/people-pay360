# Module: payroll

## SRS References
FR-027 (Wizard Step 1), FR-028 (Wizard Step 2), FR-029 (State Machine), FR-030 (Computation), FR-031 (Warnings), FR-032 (Validation), FR-033 (Mark Paid), FR-034 (Payslip List), FR-035 (Payslip Detail), FR-036 (PDF), FR-037 (Bulk Email)

## Overview
Transactional module that creates Payruns and computes Payslips. A Payslip is always a child of a Payrun — they share one computation pass. Depends on `contracts` (active-contract resolver), `working-schedules`, `attendance`, `time-off`, and `payroll-config` (rule-sequencer). Finalized/paid records are retained as immutable history.

## Payrun State Machine (SRS §FR-029)
```
Draft → Computed → Validated → Paid
```
Transitions are one-way. No rollback after Paid.

---

## Frontend — `client/src/features/payroll/`

### Components
| File | Responsibility |
|------|---------------|
| `components/PayrunWizardStep1.tsx` | Scope form — Salary Structure (required), Period Start/End (required), employee type/company filters; Continue does NOT create a Payrun record (FR-027) |
| `components/PayrunWizardStep2.tsx` | Employee selection — search, checkboxes, Back, Create Payrun; at least one employee required (FR-028) |
| `components/WarningBanner.tsx` | Displays blocking and non-blocking warnings (missing contract, missing bank details, duplicate payslip) before and after compute (FR-031) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/PayrunListPage.tsx` | All payruns — Period, Status, Total Gross, Total Net, Warnings count; NEW opens wizard (FR-029) |
| `pages/PayrunProcessingPage.tsx` | State machine UI — COMPUTE / VALIDATE / MARK PAID / SEND PAYSLIPS action buttons; warning summary; payslip sub-list (FR-029) |
| `pages/PayslipListPage.tsx` | Payslips for a payrun — Employee, Warning, Period, Basic, Gross, Net, Structure, Status (FR-034) |
| `pages/PayslipDetailPage.tsx` | Full breakdown — Employee, Structure, Payrun, Period, Status, Worked Days, rule-level lines (Basic/Allowances/Gross/Deductions/Net); COMPUTE, MARK PAID, PRINT PAYSLIP (FR-035) |

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
| `services/payslip-pdf.client.ts` | Triggers PDF endpoint, handles blob download for PRINT PAYSLIP (FR-036) |

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
| `services/payslip-computation.service.ts` | Core engine — calls `active-contract.resolver.ts`, calls `rule-sequencer.ts`, pulls attendance + time-off data, evaluates rules in sequence, produces PayslipLine records; sample: Basic ₹50,000 + Allowances ₹30,000 = Gross ₹80,000 − Deductions ₹5,000 = Net ₹75,000 (FR-035) |
| `services/payslip-pdf.service.ts` | Renders payslip data into HTML template → PDF buffer; per-item failure is retryable (FR-036) |
| `services/payslip-mailer.service.ts` | Attaches PDF per employee, sends via configured SMTP; records per-recipient success/failure; provider failure does not mark all as sent (FR-037, SRS §9.1) |
| `services/warning-detector.service.ts` | Pre-compute checks — missing contract (blocking), missing bank details (non-blocking), duplicate payslip (blocking), zero worked days (non-blocking); exposes machine-readable warning codes + human messages (SRS §17) |

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

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/payroll/payruns` | HR Payroll User+ | All payruns |
| POST | `/api/payroll/payruns` | HR Payroll User | Create payrun with selected employees |
| POST | `/api/payroll/payruns/:id/compute` | HR Payroll User | Compute all payslips |
| POST | `/api/payroll/payruns/:id/validate` | HR Payroll Manager | Validate — blocked if blocking warnings unresolved |
| POST | `/api/payroll/payruns/:id/mark-paid` | HR Payroll Manager | Mark paid + freeze historical fields |
| POST | `/api/payroll/payruns/:id/send` | HR Payroll Manager | Bulk email payslips — returns per-recipient result |
| GET | `/api/payroll/payruns/:id/payslips` | HR Payroll User+ | Payslips for a payrun |
| GET | `/api/payroll/payslips/:id` | HR Payroll User+ / Employee (own) | Single payslip with line items |
| GET | `/api/payroll/payslips/:id/pdf` | HR Payroll User+ / Employee (own) | Download PDF |

---

## Key Rules (SRS §FR-027–037)
- Wizard Continue (Step 1 → Step 2) does NOT create a Payrun record — only Create Payrun on Step 2 does (FR-027)
- `payslip-computation.service.ts` calls `active-contract.resolver.ts` — never reimplements period-based contract logic (FR-010, FR-030)
- `payslip-computation.service.ts` calls `rule-sequencer.ts` — rules applied in deterministic ascending sequence (FR-026, FR-030)
- Computed payslip values are traceable to the selected structure and applicable contract — not hardcoded (FR-030 acceptance criteria)
- Blocking warnings (missing contract, duplicate payslip) prevent Validate and Mark Paid (FR-031, FR-032)
- Non-blocking warnings (missing bank details, zero worked days) are stored and shown but do not block (FR-031)
- State transitions are one-way: Draft → Computed → Validated → Paid — no rollback (FR-029)
- Paid payrun fields are frozen — historical payroll remains queryable and explainable (FR-033, SRS §8.1)
- Bulk email reports per-recipient success/failure — provider failure does not silently mark all as sent (FR-037, SRS §9.1)
- PDF generation failure identifies the affected payslip and allows retry (SRS §9.1)

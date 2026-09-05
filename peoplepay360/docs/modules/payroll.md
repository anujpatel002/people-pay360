# Module: payroll

## Overview
Transactional module that creates Payruns and computes Payslips. A Payslip is always a child of a Payrun — they share one computation pass and live in the same module. Depends on `contracts` (active-contract resolver), `working-schedules`, `attendance`, `time-off`, and `payroll-config` (rule-sequencer).

---

## Frontend — `client/src/features/payroll/`

### Components
| File | Responsibility |
|------|---------------|
| `components/PayrunWizardStep1.tsx` | Select pay period, salary structure, employee scope |
| `components/PayrunWizardStep2.tsx` | Review employee list + estimated totals before confirming |
| `components/WarningBanner.tsx` | Displays anomaly warnings (missing attendance, no active contract) before processing |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/PayrunListPage.tsx` | All payruns — period, status, total amount, action buttons |
| `pages/PayrunProcessingPage.tsx` | Step-by-step state machine UI: Draft → Computed → Validated → Paid |
| `pages/PayslipListPage.tsx` | All payslips within a payrun — employee, gross, deductions, net |
| `pages/PayslipDetailPage.tsx` | Full payslip breakdown — line items per rule, PDF download button |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/usePayrunWizard.ts` | Multi-step wizard state — step navigation, form values, validation |
| `hooks/usePayslip.ts` | Fetches single payslip with full line-item breakdown |

### Services
| File | Responsibility |
|------|---------------|
| `services/payrun.service.ts` | `getPayruns()`, `createPayrun()`, `computePayrun()`, `validatePayrun()`, `markPaid()` |
| `services/payslip.service.ts` | `getPayslips(payrunId)`, `getPayslip(id)` |
| `services/payslip-pdf.client.ts` | Triggers PDF generation endpoint, handles blob download |

### Types
| File | Responsibility |
|------|---------------|
| `types/payrun.types.ts` | `Payrun`, `PayrunStatus`, `PayrunFormValues` interfaces |
| `types/payslip.types.ts` | `Payslip`, `PayslipLine`, `PayslipSummary` interfaces |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/usePayrunWizard.test.ts` | Hook tests — step transitions, validation |
| `tests/payrun.service.test.ts` | Mocked API call assertions |

---

## Backend — `server/src/modules/payroll/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/payrun.controller.ts` | Payrun CRUD + state transition handlers |
| `controllers/payslip.controller.ts` | Payslip list, detail, PDF, email handlers |

### Services
| File | Responsibility |
|------|---------------|
| `services/payrun.service.ts` | Payrun lifecycle — create, trigger computation, validate, mark paid |
| `services/payslip-computation.service.ts` | Core engine — pulls active contract, schedule, attendance, time-off; applies sequenced salary rules; produces payslip line items |
| `services/payslip-pdf.service.ts` | Renders payslip HTML template → PDF buffer |
| `services/payslip-mailer.service.ts` | Attaches PDF and sends email to employee |
| `services/warning-detector.service.ts` | Pre-computation checks — missing attendance, no active contract, zero worked days |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/payrun.repository.ts` | DB queries for payruns table |
| `repositories/payslip.repository.ts` | DB queries for payslips and payslip_lines tables |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/payroll.routes.ts` | Mounts all payrun + payslip handlers on `/api/payroll` |

### Validators
| File | Responsibility |
|------|---------------|
| `validators/payrun.validator.ts` | Zod schema — periodStart, periodEnd, structureId required; periodEnd after periodStart |

### Models
| File | Responsibility |
|------|---------------|
| `models/payrun.model.ts` | Schema — id, name, periodStart, periodEnd, structureId, status, totalGross, totalNet, timestamps |
| `models/payslip.model.ts` | Schema — id, payrunId, employeeId, contractId, gross, deductions, net, status, timestamps |
| `models/payslip-line.model.ts` | Schema — id, payslipId, ruleCode, ruleName, category, amount |

### Types
| File | Responsibility |
|------|---------------|
| `types/payrun.types.ts` | Server-side interfaces for payrun entity and status enum |
| `types/payslip.types.ts` | Server-side interfaces for payslip, line items, computation input/output |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/payslip-computation.service.test.ts` | Unit — rule application, formula evaluation, deduction ordering |
| `tests/warning-detector.service.test.ts` | Unit — each warning condition in isolation |
| `tests/payroll.integration.test.ts` | Integration — full payrun creation → compute → validate → mark paid flow |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/payroll/payruns` | HR Payroll User+ | All payruns |
| POST | `/api/payroll/payruns` | HR Payroll User | Create payrun |
| POST | `/api/payroll/payruns/:id/compute` | HR Payroll User | Compute all payslips |
| POST | `/api/payroll/payruns/:id/validate` | HR Payroll Manager | Validate payrun |
| POST | `/api/payroll/payruns/:id/mark-paid` | HR Payroll Manager | Mark as paid |
| GET | `/api/payroll/payruns/:id/payslips` | HR Payroll User+ | Payslips for a payrun |
| GET | `/api/payroll/payslips/:id` | HR Payroll User+ / Employee (own) | Single payslip detail |
| GET | `/api/payroll/payslips/:id/pdf` | HR Payroll User+ / Employee (own) | Download PDF |
| POST | `/api/payroll/payslips/:id/send` | HR Payroll Manager | Email payslip to employee |

---

## Key Rules
- `payslip-computation.service.ts` calls `active-contract.resolver.ts` from `contracts` — never reimplements that logic
- `payslip-computation.service.ts` calls `rule-sequencer.ts` from `payroll-config` — rules applied in sequence order
- State transitions are one-way: Draft → Computed → Validated → Paid — no rollback
- A payrun cannot be computed if `warning-detector` finds blocking issues (missing contracts)
- Non-blocking warnings (missing attendance days) are stored and shown to user but do not block computation
- PDF generation is synchronous for single payslip, should be queued for bulk send

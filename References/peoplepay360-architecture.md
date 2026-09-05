# PeoplePay360 — Feature-Based Architecture Plan

## A. Existing Architecture Summary

`old.txt` does not contain an existing codebase — it's your methodology prompt (the rules for how to design the structure), not source files. There is no prior folder structure, module, or code to inventory. This is a **greenfield build**: the plan below is designed from scratch, but still follows every rule in `old.txt` (feature-based, no `utils/` dumping ground, no over-engineering, etc.) so it stays consistent with your intended process going forward.

The two real inputs are:
- **Problem Statement** — `PeoplePay360_HR___Payroll.pdf`
- **UI reference** — `HRMS_OXP_-_24_hours.svg`, an Excalidraw screen-flow mockup confirming the navigation (Employees → Contracts/Attendance/Time Off, Kanban+List+Form views, smart-button counts, Payroll top-level menu) and matching the PDF's module breakdown.

## B. Feature List

Derived from the PDF's modules (A1–A7, B1–B9) and roles section:

1. **auth** — login, session, role-based access (Employee / HR Manager / HR Payroll User / HR Payroll Manager / Admin)
2. **users** — Admin: user management, role assignment, permissions (distinct from `employees`, which is HR master data — a user account and an employee record are different concerns)
3. **employees** — employee master data, Kanban/List/Form, work details, smart-button related-record navigation
4. **contracts** — historical contract records, active-contract detection, period-based selection
5. **working-schedules** — weekly pattern (day/start/end/break), auto-computed weekly hours
6. **attendance** — check-in/out, worked hours, exceptions, manual corrections
7. **time-off** — types, allocations, requests, approval workflow, balance deduction
8. **payroll-config** — Salary Structures + Salary Rules (sequencing, computation methods, categories)
9. **payroll** — Payruns (creation wizard, processing: compute/validate/mark paid/send) + Payslips (computation breakdown, PDF, email) — kept as one feature since Payslips are always children of a Payrun and share the same computation service
10. **dashboard** — cross-module KPIs, charts, alerts (the one deliberate cross-feature aggregator — see Architecture Decisions)

## C. Feature Dependency Map

```text
auth ──▶ users (admin manages accounts/roles)
  │
  ▼
employees ──▶ contracts ──▶ working-schedules
  │                              │
  ▼                              ▼
attendance ◀──────────────── (schedule defines expected hours)
  │
  ▼
time-off (types → allocations → requests, deducts from allocations)
  │
  ▼
payroll-config (salary structures + rules — independent config, no employee dependency)
  │
  ▼
payroll (payruns select employees+structure+period, pull active contract,
          schedule, attendance, time-off data → compute payslips → PDF/email)
  │
  ▼
dashboard (reads aggregated data from employees, contracts, attendance,
           time-off, payroll — read-only, no module depends on dashboard)
```

## D. Proposed Folder Structure

```text
peoplepay360/
├── electron/
│   ├── main/
│   │   ├── index.ts
│   │   ├── windows/
│   │   └── services/
│   ├── preload/
│   │   ├── index.ts
│   │   └── bridges/
│   ├── ipc/
│   │   ├── handlers/
│   │   └── channels/
│   └── config/
│
├── client/
│   └── src/
│       ├── app/
│       │   ├── App.tsx
│       │   ├── providers/
│       │   ├── routes/
│       │   └── config/
│       │
│       ├── features/
│       │   ├── auth/
│       │   │   ├── pages/            (Login)
│       │   │   ├── hooks/
│       │   │   ├── services/
│       │   │   ├── store/
│       │   │   └── tests/
│       │   │
│       │   ├── users/                (Admin only)
│       │   │   ├── components/
│       │   │   ├── pages/
│       │   │   ├── hooks/
│       │   │   ├── services/
│       │   │   └── tests/
│       │   │
│       │   ├── employees/
│       │   │   ├── components/       (EmployeeCard, SmartButtons)
│       │   │   ├── pages/            (EmployeeKanban, EmployeeList, EmployeeForm)
│       │   │   ├── hooks/            (useEmployees, useEmployee)
│       │   │   ├── services/
│       │   │   ├── types/
│       │   │   └── tests/
│       │   │
│       │   ├── contracts/
│       │   │   ├── components/       (ActiveContractBadge)
│       │   │   ├── pages/            (ContractList, ContractForm)
│       │   │   ├── hooks/
│       │   │   ├── services/
│       │   │   └── tests/
│       │   │
│       │   ├── working-schedules/
│       │   │   ├── components/       (WeeklyPatternEditor)
│       │   │   ├── pages/
│       │   │   ├── hooks/
│       │   │   ├── services/
│       │   │   └── tests/
│       │   │
│       │   ├── attendance/
│       │   │   ├── components/
│       │   │   ├── pages/            (AttendanceList, AttendanceForm)
│       │   │   ├── hooks/
│       │   │   ├── services/
│       │   │   └── tests/
│       │   │
│       │   ├── time-off/
│       │   │   ├── components/
│       │   │   ├── pages/            (RequestList, RequestForm, AllocationList, TypeConfig)
│       │   │   ├── hooks/
│       │   │   ├── services/
│       │   │   └── tests/
│       │   │
│       │   ├── payroll-config/
│       │   │   ├── components/       (RuleSequenceEditor)
│       │   │   ├── pages/            (SalaryStructureList/Form, SalaryRuleList/Form)
│       │   │   ├── hooks/
│       │   │   ├── services/
│       │   │   └── tests/
│       │   │
│       │   ├── payroll/
│       │   │   ├── components/       (PayrunWizardStep1, PayrunWizardStep2, WarningBanner)
│       │   │   ├── pages/            (PayrunList, PayrunProcessing, PayslipList, PayslipDetail)
│       │   │   ├── hooks/            (usePayrunWizard, usePayslip)
│       │   │   ├── services/         (payrun.service.ts, payslip.service.ts, payslip-pdf.client.ts)
│       │   │   ├── types/
│       │   │   └── tests/
│       │   │
│       │   └── dashboard/
│       │       ├── components/       (KpiCard, SalaryByDeptChart, TrendChart, AlertList)
│       │       ├── pages/            (DashboardPage)
│       │       ├── hooks/
│       │       ├── services/
│       │       └── tests/
│       │
│       ├── shared/
│       │   ├── components/           (Button, Table, StatusBadge, EmptyState — genuinely reused)
│       │   ├── hooks/                (useDebounce, usePagination)
│       │   ├── utilities/            (formatCurrency, formatDate)
│       │   ├── constants/            (roles.ts)
│       │   ├── types/                (api.types.ts)
│       │   └── services/             (httpClient.ts)
│       │
│       ├── layouts/                  (MainLayout with top nav: Employees/Contracts/Attendance/Time Off/Payroll/Reports)
│       ├── assets/
│       └── tests/

├── server/
│   └── src/
│       ├── config/
│       ├── database/
│       │   ├── connection/
│       │   ├── migrations/
│       │   └── seed/
│       │
│       ├── modules/
│       │   ├── auth/
│       │   │   ├── controllers/ services/ routes/ validators/ tests/
│       │   ├── users/
│       │   │   ├── controllers/ services/ repositories/ routes/ models/ tests/
│       │   ├── employees/
│       │   │   ├── controllers/ services/ repositories/ routes/ validators/ models/ types/ tests/
│       │   ├── contracts/
│       │   │   ├── controllers/ services/ repositories/ routes/ validators/ models/ tests/
│       │   │   (services/active-contract.resolver.ts — period-based active contract logic)
│       │   ├── working-schedules/
│       │   │   ├── controllers/ services/ repositories/ routes/ models/ tests/
│       │   │   (services/weekly-hours.calculator.ts)
│       │   ├── attendance/
│       │   │   ├── controllers/ services/ repositories/ routes/ validators/ models/ tests/
│       │   ├── time-off/
│       │   │   ├── controllers/ services/ repositories/ routes/ validators/ models/ tests/
│       │   │   (services/allocation-balance.service.ts)
│       │   ├── payroll-config/
│       │   │   ├── controllers/ services/ repositories/ routes/ models/ tests/
│       │   │   (structures & rules; services/rule-sequencer.ts)
│       │   ├── payroll/
│       │   │   ├── controllers/ services/ repositories/ routes/ validators/ models/ types/ tests/
│       │   │   (services/payrun.service.ts, payslip-computation.service.ts,
│       │   │    payslip-pdf.service.ts, payslip-mailer.service.ts, warning-detector.service.ts)
│       │   └── dashboard/
│       │       ├── controllers/ services/ routes/ tests/
│       │       (services/dashboard-aggregator.service.ts — read-only queries
│       │        across employees/contracts/attendance/time-off/payroll repos)
│       │
│       ├── middleware/               (auth.middleware.ts, role-guard.middleware.ts, error-handler.ts)
│       ├── shared/
│       │   ├── errors/
│       │   ├── utilities/
│       │   ├── constants/
│       │   └── types/
│       ├── app.ts
│       └── server.ts

├── database/
│   ├── migrations/
│   ├── seed/
│   ├── schema/
│   └── scripts/

├── docs/
│   └── file-responsibility.md
├── tests/
│   └── e2e/
├── docker/
├── docker-compose.yml
└── README.md
```

## E. Migration Plan

Not applicable in the traditional sense — there's no prior codebase to move code out of. Treatment instead:

- **Nothing remains unchanged** (nothing existed).
- **Nothing moves.**
- **Everything is newly created**, following the structure above.
- If you *do* have an existing repo you didn't upload, send it and I'll redo this section properly (map its files into the feature folders, flag what's reusable vs. what gets rewritten) before anything gets touched.

## F. Architecture Decisions

- **`payroll-config` split from `payroll`**: Salary Structures/Rules are configuration (edited rarely, by HR Payroll Manager) while Payruns/Payslips are transactional (created every pay period). Different lifecycles, different permission levels (per the PDF's role table) → separate modules, with `payroll` depending on `payroll-config` (never the reverse).
- **Payruns + Payslips share one `payroll` module** rather than splitting further: a Payslip cannot exist without a parent Payrun, they're computed by the same service in one pass, and splitting them would force two modules to share one computation service — a cross-feature dependency worse than keeping them together.
- **`dashboard` is the one sanctioned cross-feature reader**: every other module only talks to modules below it in the dependency map. The dashboard is the explicit exception in `old.txt` §9's decision rule ("used by multiple unrelated features → shared/aggregation layer") — it reads via each module's repository/service interfaces, never touches another module's DB tables directly, and nothing depends on it back.
- **`employees` vs `users`**: an employee (HR master data — department, manager, schedule) and a user account (login, role) are different entities per the role table (an Employee role sees only their own record; Admin manages all accounts). Kept separate so payroll logic never accidentally touches auth code.
- **Active-contract resolution lives in `contracts/services/active-contract.resolver.ts`**, not in `payroll`, since "payroll uses only the period-applicable contract" is a contract-domain rule the PDF states explicitly — `payroll` calls it rather than reimplementing it.
- **No `common/` or generic `utils/`** at the server root — cross-cutting error types and formatting live in `server/src/shared/`, used only when genuinely needed by 2+ unrelated modules.

---

## Next Step

Per `old.txt` §16, actual folder/file creation should follow only after this plan is confirmed. Want me to scaffold the real directory tree (with placeholder files, `package.json`s, and a starter `docs/file-responsibility.md`) as a downloadable project skeleton, or adjust the feature list/structure first?

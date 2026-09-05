# File Responsibility Map

## electron/

| File | Responsibility |
|------|---------------|
| `electron/main/index.ts` | Electron main process entry — creates BrowserWindow, registers IPC handlers |
| `electron/main/windows/` | Window factory functions (main window, splash, etc.) |
| `electron/main/services/` | Main-process-only services (auto-updater, tray, native menus) |
| `electron/preload/index.ts` | Preload script — exposes safe IPC bridges to renderer via contextBridge |
| `electron/preload/bridges/` | One file per IPC domain (e.g. `auth.bridge.ts`, `payroll.bridge.ts`) |
| `electron/ipc/handlers/` | IPC handler registration per feature (e.g. `auth.handler.ts`) |
| `electron/ipc/channels/` | Typed channel name constants shared between main and preload |
| `electron/config/` | Electron-specific config (window dimensions, deep-link schemes) |

---

## client/src/app/

| File | Responsibility |
|------|---------------|
| `app/App.tsx` | Root component — mounts providers and router |
| `app/providers/` | Global context providers (QueryClient, AuthProvider, ThemeProvider) |
| `app/routes/` | Route definitions and protected-route wrappers |
| `app/config/` | App-wide constants (API base URL, pagination defaults) |

---

## client/src/features/

### auth/
| File | Responsibility |
|------|---------------|
| `pages/` | LoginPage |
| `hooks/` | `useLogin`, `useLogout`, `useCurrentUser` |
| `services/` | `auth.service.ts` — login/logout/refresh API calls |
| `store/` | Auth slice (token, current user, role) |
| `tests/` | Unit tests for hooks and service |

### users/
| File | Responsibility |
|------|---------------|
| `components/` | UserTable, RoleSelector |
| `pages/` | UserListPage, UserFormPage |
| `hooks/` | `useUsers`, `useUser` |
| `services/` | `users.service.ts` — CRUD API calls |
| `tests/` | Unit tests |

### employees/
| File | Responsibility |
|------|---------------|
| `components/` | EmployeeCard, SmartButtons (contract/attendance/time-off counts) |
| `pages/` | EmployeeKanbanPage, EmployeeListPage, EmployeeFormPage |
| `hooks/` | `useEmployees`, `useEmployee` |
| `services/` | `employees.service.ts` |
| `types/` | `employee.types.ts` |
| `tests/` | Unit tests |

### contracts/
| File | Responsibility |
|------|---------------|
| `components/` | ActiveContractBadge |
| `pages/` | ContractListPage, ContractFormPage |
| `hooks/` | `useContracts`, `useActiveContract` |
| `services/` | `contracts.service.ts` |
| `tests/` | Unit tests |

### working-schedules/
| File | Responsibility |
|------|---------------|
| `components/` | WeeklyPatternEditor |
| `pages/` | ScheduleListPage, ScheduleFormPage |
| `hooks/` | `useSchedules`, `useSchedule` |
| `services/` | `working-schedules.service.ts` |
| `tests/` | Unit tests |

### attendance/
| File | Responsibility |
|------|---------------|
| `components/` | AttendanceStatusBadge, ExceptionFlag |
| `pages/` | AttendanceListPage, AttendanceFormPage |
| `hooks/` | `useAttendance` |
| `services/` | `attendance.service.ts` |
| `tests/` | Unit tests |

### time-off/
| File | Responsibility |
|------|---------------|
| `components/` | BalanceIndicator, ApprovalActions |
| `pages/` | RequestListPage, RequestFormPage, AllocationListPage, TypeConfigPage |
| `hooks/` | `useTimeOffRequests`, `useAllocations` |
| `services/` | `time-off.service.ts` |
| `tests/` | Unit tests |

### payroll-config/
| File | Responsibility |
|------|---------------|
| `components/` | RuleSequenceEditor |
| `pages/` | SalaryStructureListPage, SalaryStructureFormPage, SalaryRuleListPage, SalaryRuleFormPage |
| `hooks/` | `useSalaryStructures`, `useSalaryRules` |
| `services/` | `payroll-config.service.ts` |
| `tests/` | Unit tests |

### payroll/
| File | Responsibility |
|------|---------------|
| `components/` | PayrunWizardStep1, PayrunWizardStep2, WarningBanner |
| `pages/` | PayrunListPage, PayrunProcessingPage, PayslipListPage, PayslipDetailPage |
| `hooks/` | `usePayrunWizard`, `usePayslip` |
| `services/` | `payrun.service.ts`, `payslip.service.ts`, `payslip-pdf.client.ts` |
| `types/` | `payrun.types.ts`, `payslip.types.ts` |
| `tests/` | Unit tests |

### dashboard/
| File | Responsibility |
|------|---------------|
| `components/` | KpiCard, SalaryByDeptChart, TrendChart, AlertList |
| `pages/` | DashboardPage |
| `hooks/` | `useDashboardKpis` |
| `services/` | `dashboard.service.ts` |
| `tests/` | Unit tests |

---

## client/src/shared/

| File | Responsibility |
|------|---------------|
| `components/` | Button, Table, StatusBadge, EmptyState — UI primitives used by 2+ features |
| `hooks/` | `useDebounce`, `usePagination` |
| `utilities/` | `formatCurrency.ts`, `formatDate.ts` |
| `constants/` | `roles.ts` — role name constants |
| `types/` | `api.types.ts` — shared response/error shapes |
| `services/` | `httpClient.ts` — Axios instance with interceptors |

---

## client/src/layouts/

| File | Responsibility |
|------|---------------|
| `MainLayout.tsx` | Top nav (Employees / Contracts / Attendance / Time Off / Payroll / Reports) + outlet |

---

## server/src/

| File | Responsibility |
|------|---------------|
| `app.ts` | Express app setup — middleware registration, module router mounting |
| `server.ts` | HTTP server bootstrap, graceful shutdown |

### config/
| File | Responsibility |
|------|---------------|
| `env.ts` | Typed env var loader |
| `database.ts` | DB connection config |

### database/
| File | Responsibility |
|------|---------------|
| `connection/` | DB client singleton |
| `migrations/` | Ordered schema migration files |
| `seed/` | Dev/test seed scripts |

### middleware/
| File | Responsibility |
|------|---------------|
| `auth.middleware.ts` | JWT verification, attaches `req.user` |
| `role-guard.middleware.ts` | Role-based access enforcement |
| `error-handler.ts` | Centralised error response formatter |

---

## server/src/modules/

### auth/
| File | Responsibility |
|------|---------------|
| `controllers/` | Login, logout, refresh-token request handlers |
| `services/` | Token generation, password hashing, session logic |
| `routes/` | `/api/auth` route definitions |
| `validators/` | Login request schema validation |
| `tests/` | Unit + integration tests |

### users/
| File | Responsibility |
|------|---------------|
| `controllers/` | CRUD handlers for user accounts |
| `services/` | Business logic for user management and role assignment |
| `repositories/` | DB queries for users table |
| `routes/` | `/api/users` route definitions |
| `models/` | User model/schema definition |
| `tests/` | Unit + integration tests |

### employees/
| File | Responsibility |
|------|---------------|
| `controllers/` | CRUD + smart-button count handlers |
| `services/` | Employee business logic |
| `repositories/` | DB queries for employees table |
| `routes/` | `/api/employees` route definitions |
| `validators/` | Employee create/update schema validation |
| `models/` | Employee model/schema definition |
| `types/` | Shared TypeScript types for this module |
| `tests/` | Unit + integration tests |

### contracts/
| File | Responsibility |
|------|---------------|
| `controllers/` | CRUD handlers |
| `services/active-contract.resolver.ts` | Period-based active contract resolution logic |
| `repositories/` | DB queries for contracts table |
| `routes/` | `/api/contracts` route definitions |
| `validators/` | Contract schema validation |
| `models/` | Contract model/schema definition |
| `tests/` | Unit + integration tests |

### working-schedules/
| File | Responsibility |
|------|---------------|
| `controllers/` | CRUD handlers |
| `services/weekly-hours.calculator.ts` | Auto-computes total weekly hours from day patterns |
| `repositories/` | DB queries |
| `routes/` | `/api/working-schedules` route definitions |
| `models/` | Schedule model/schema definition |
| `tests/` | Unit + integration tests |

### attendance/
| File | Responsibility |
|------|---------------|
| `controllers/` | Check-in/out, list, correction handlers |
| `services/` | Worked-hours calculation, exception detection |
| `repositories/` | DB queries for attendance table |
| `routes/` | `/api/attendance` route definitions |
| `validators/` | Attendance record schema validation |
| `models/` | Attendance model/schema definition |
| `tests/` | Unit + integration tests |

### time-off/
| File | Responsibility |
|------|---------------|
| `controllers/` | Type config, allocation, request, approval handlers |
| `services/allocation-balance.service.ts` | Tracks and deducts leave balances |
| `repositories/` | DB queries for time-off tables |
| `routes/` | `/api/time-off` route definitions |
| `validators/` | Request/allocation schema validation |
| `models/` | TimeOffType, Allocation, Request model definitions |
| `tests/` | Unit + integration tests |

### payroll-config/
| File | Responsibility |
|------|---------------|
| `controllers/` | Salary structure and rule CRUD handlers |
| `services/rule-sequencer.ts` | Orders salary rules by sequence number for computation |
| `repositories/` | DB queries for structures and rules tables |
| `routes/` | `/api/payroll-config` route definitions |
| `models/` | SalaryStructure, SalaryRule model definitions |
| `tests/` | Unit + integration tests |

### payroll/
| File | Responsibility |
|------|---------------|
| `controllers/` | Payrun creation, state transitions, payslip retrieval handlers |
| `services/payrun.service.ts` | Payrun lifecycle (create → compute → validate → mark paid) |
| `services/payslip-computation.service.ts` | Applies salary rules to produce payslip line items |
| `services/payslip-pdf.service.ts` | Generates PDF payslip |
| `services/payslip-mailer.service.ts` | Emails payslip PDF to employee |
| `services/warning-detector.service.ts` | Flags anomalies before payrun is confirmed |
| `repositories/` | DB queries for payruns and payslips tables |
| `routes/` | `/api/payroll` route definitions |
| `validators/` | Payrun creation schema validation |
| `models/` | Payrun, Payslip model definitions |
| `types/` | Shared TypeScript types for payroll module |
| `tests/` | Unit + integration tests |

### dashboard/
| File | Responsibility |
|------|---------------|
| `controllers/` | KPI and chart data handlers |
| `services/dashboard-aggregator.service.ts` | Read-only queries across employees/contracts/attendance/time-off/payroll repos |
| `routes/` | `/api/dashboard` route definitions |
| `tests/` | Unit + integration tests |

---

## server/src/shared/

| File | Responsibility |
|------|---------------|
| `errors/` | Custom error classes (AppError, NotFoundError, ValidationError) |
| `utilities/` | Pure helpers used by 2+ modules (e.g. `paginate.ts`, `dateRange.ts`) |
| `constants/` | Server-wide constants (role names, status enums) |
| `types/` | Shared TypeScript interfaces (PaginatedResult, RequestWithUser) |

---

## database/

| File | Responsibility |
|------|---------------|
| `migrations/` | Versioned SQL/ORM migration files — run in order to build schema |
| `seed/` | Dev and test seed data scripts |
| `schema/` | Source-of-truth schema definitions (e.g. Prisma schema or ERD SQL) |
| `scripts/` | One-off DB utility scripts (reset, backup, anonymise) |

---

## top-level

| File | Responsibility |
|------|---------------|
| `docker/` | Dockerfiles for client, server, and any sidecar services |
| `docker-compose.yml` | Local dev stack (app + DB + mail catcher) |
| `tests/e2e/` | End-to-end tests (Playwright / Cypress) covering full user flows |
| `docs/` | Architecture docs, ADRs, this file |
| `README.md` | Project overview, setup instructions, dev commands |

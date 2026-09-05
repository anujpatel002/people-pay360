# Module: dashboard

## SRS References
FR-038 (Live Filters), FR-039 (KPI Cards), FR-040 (Salary Analytics), FR-041 (Payroll Alerts), FR-042 (Attendance Overview), FR-043 (Time Off Overview), FR-044 (Department Overview)

## Overview
Read-only cross-module aggregator. All dashboard values are derived from live operational records — never hardcoded or static (SRS §1.3, §9.1). Provides filters for Period, Department, Employee Type, and Company that recompute all widgets. Nothing depends on dashboard — it is the terminal node in the dependency graph. Depends on `auth` and reads from all other module repositories.

---

## Frontend — `client/src/features/dashboard/`

### Components
| File | Responsibility |
|------|---------------|
| `components/KpiCard.tsx` | Single metric tile — label, value, optional comparison/trend indicator; handles zero denominator gracefully (FR-039) |
| `components/SalaryByDeptChart.tsx` | Bar chart — total net pay grouped by department from actual payslip data (FR-040) |
| `components/TrendChart.tsx` | Line chart — monthly net salary totals for last N payruns (FR-040) |
| `components/AlertList.tsx` | Actionable alert list — missing bank details, duplicate payslips, unvalidated drafts, expiring contracts (FR-041) |
| `components/AttendanceOverview.tsx` | Summary tiles — Present, Late, Absent, Overtime, missing check-outs, manual edits, coverage % (FR-042) |
| `components/TimeOffOverview.tsx` | Table — Approved Days, Pending Requests, Remaining Balance by Type; N/A for non-allocation types (FR-043) |
| `components/DepartmentOverview.tsx` | Table — Department, Headcount, Monthly Salary Expenditure (FR-044) |
| `components/DashboardFilters.tsx` | Filter bar — Period, Department, Employee Type, Company; changes recompute all widgets (FR-038) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/DashboardPage.tsx` | Composes DashboardFilters + all KPI/chart/alert/overview components; single page layout |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useDashboardData.ts` | Fetches full dashboard payload (KPIs + charts + alerts + overviews) in one call; re-fetches on filter change |

### Services
| File | Responsibility |
|------|---------------|
| `services/dashboard.service.ts` | `getDashboardData(filters)` — single endpoint call; returns structured payload; aggregation failure surfaced as error, never substituted with static fallback (SRS §9.1) |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/DashboardPage.test.tsx` | Render — KPI cards present, charts present, alert list, filter controls; filter change triggers re-fetch |
| `tests/dashboard.service.test.ts` | Mocked API — filter params passed correctly, error state handled |

---

## Backend — `server/src/modules/dashboard/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/dashboard.controller.ts` | Single GET handler — receives filter params, calls aggregator, returns shaped response |

### Services
| File | Responsibility |
|------|---------------|
| `services/dashboard-aggregator.service.ts` | Runs read-only queries across employee, contract, attendance, time-off, and payroll repositories; assembles all KPI, chart, alert, and overview data; imports only repository interfaces — never another module's service or controller (SRS §NFR-025) |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/dashboard.routes.ts` | `/api/dashboard` — HR Manager+ only |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/dashboard-aggregator.service.test.ts` | Unit — each KPI calculation with mocked repositories; zero-denominator handling; missing department → Unassigned (FR-040) |
| `tests/dashboard.integration.test.ts` | Integration — full aggregation against seeded test DB; filter changes produce different results |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard?period=&department=&employeeType=&company=` | HR Manager+ | Full dashboard payload — KPIs, charts, alerts, overviews |

---

## KPI Reference (SRS §FR-039–044)

| KPI | Source | FR |
|-----|--------|----|
| Total Net Salary Paid | payroll — validated/paid payruns | FR-039 |
| Payslips Generated | payroll — payslip count | FR-039 |
| Average Salary | payroll — net / headcount | FR-039 |
| Approved Time Off Days | time-off — approved requests | FR-039 |
| Attendance Health % | attendance — present / expected | FR-039 |
| Salary Cost by Department | payroll + employees | FR-040 |
| Monthly Net Salary Trend | payroll — last 6 payruns | FR-040 |
| Missing Bank Details | payroll — warning codes | FR-041 |
| Duplicate Payslips | payroll — warning codes | FR-041 |
| Unvalidated Draft Payruns | payroll — Draft/Computed status | FR-041 |
| Expiring Contracts (30 days) | contracts — endDate window | FR-041 |
| Present / Late / Absent / Overtime | attendance — status counts | FR-042 |
| Missing Check-Outs | attendance — open sessions | FR-042 |
| Manual Edits | attendance — isManualEntry count | FR-042 |
| Pending Time Off Requests | time-off — pending status | FR-043 |
| Remaining Balance by Type | time-off — allocations | FR-043 |
| Department Headcount + Salary | employees + payroll | FR-044 |

---

## Key Rules (SRS §FR-038–044)
- All values derived from live operational records — aggregation failure surfaces as error, never substituted with hardcoded fallback (SRS §9.1, FR-038)
- Filter changes recompute all relevant widgets — no stale data presented as live (FR-038)
- `dashboard-aggregator.service.ts` imports only repository interfaces — never another module's service or controller (SRS §NFR-025)
- All queries are read-only — no writes, no state changes
- Missing department handled as "Unassigned" — not silently dropped from charts (FR-040)
- Non-allocation leave types show N/A for balance — not zero (FR-043)
- Zero denominator for averages/percentages handled gracefully — no division-by-zero crash (FR-039)
- Response is a single shaped object to minimise round trips — one endpoint, one payload
- Employee role must not reach this endpoint — HR Manager+ only (SRS §3)

# Module: dashboard

## Overview
Read-only cross-module aggregator. Displays KPIs, charts, and alerts by querying data from employees, contracts, attendance, time-off, and payroll repositories. Nothing depends on dashboard — it is the terminal node in the dependency graph.

---

## Frontend — `client/src/features/dashboard/`

### Components
| File | Responsibility |
|------|---------------|
| `components/KpiCard.tsx` | Single metric tile — label, value, trend indicator (up/down/neutral) |
| `components/SalaryByDeptChart.tsx` | Bar chart — total payroll cost grouped by department |
| `components/TrendChart.tsx` | Line chart — monthly payroll or headcount trend |
| `components/AlertList.tsx` | List of actionable alerts (pending approvals, missing attendance, expiring contracts) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/DashboardPage.tsx` | Composes all KPI cards, charts, and alert list into the main dashboard layout |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useDashboardKpis.ts` | Fetches all KPI + chart + alert data in one call |

### Services
| File | Responsibility |
|------|---------------|
| `services/dashboard.service.ts` | `getDashboardData()` — single endpoint call, returns structured KPI/chart/alert payload |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/DashboardPage.test.tsx` | Render tests — KPI cards, chart presence, alert list |
| `tests/dashboard.service.test.ts` | Mocked API call assertions |

---

## Backend — `server/src/modules/dashboard/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/dashboard.controller.ts` | Single GET handler — calls aggregator, returns shaped response |

### Services
| File | Responsibility |
|------|---------------|
| `services/dashboard-aggregator.service.ts` | Runs read-only queries across employees, contracts, attendance, time-off, payroll repositories — assembles KPI, chart, and alert data |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/dashboard.routes.ts` | Mounts handler on `/api/dashboard` |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/dashboard-aggregator.service.test.ts` | Unit — each KPI calculation with mocked repositories |
| `tests/dashboard.integration.test.ts` | Integration — full aggregation against seeded test DB |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard` | HR Manager+ | All KPIs, chart data, and alerts in one response |

---

## KPI Reference

| KPI | Source Module | Description |
|-----|--------------|-------------|
| Total Employees | employees | Count of active employees |
| New Hires (month) | employees | Employees with hireDate in current month |
| Expiring Contracts | contracts | Contracts with endDate within 30 days |
| Pending Time-Off | time-off | Requests in `pending` status |
| Attendance Rate | attendance | Present days / expected days (current month) |
| Last Payrun Total | payroll | Net total of most recent validated payrun |
| Salary by Department | payroll + employees | Aggregated net pay grouped by department |
| Monthly Payroll Trend | payroll | Net totals of last 6 payruns |

---

## Key Rules
- `dashboard-aggregator.service.ts` imports only repository interfaces from other modules — never imports another module's service or controller
- All queries are read-only — no writes, no state changes
- Response is a single shaped object (not multiple endpoints) to minimise round trips
- Role-based data filtering applies — an Employee role should not reach this endpoint (HR Manager+ only)
- Results should be cached (e.g. 5-minute TTL) to avoid re-running heavy aggregation queries on every page load

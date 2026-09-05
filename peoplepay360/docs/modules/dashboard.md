# Module: dashboard

## References
FR-038 (Live Filters), FR-039 (KPI Cards), FR-040 (Salary Analytics), FR-041 (Payroll Alerts), FR-042 (Attendance Overview), FR-043 (Time Off Overview), FR-044 (Department Overview)
Hackathon Spec §A7 (Reporting & Dashboard Configuration), §B9 (Payroll Dashboard)

## Overview
Read-only cross-module aggregator. All dashboard values are derived from live operational records — never hardcoded or static (§A7, §B9). Provides filters for Period, Department, Employee Type, and Company that recompute all widgets. Helps Payroll and HR users understand payments, staffing impact, leave patterns, attendance quality, and payroll warnings for the selected filters. Nothing depends on dashboard — it is the terminal node in the dependency graph. Depends on `auth` and reads from all other module repositories.

---

## Frontend — `client/src/features/dashboard/`

### Components
| File | Responsibility |
|------|---------------|
| `components/KpiCard.tsx` | Single metric tile — label, value, optional comparison/trend indicator; handles zero denominator gracefully (FR-039, §B9) |
| `components/SalaryByDeptChart.tsx` | Bar chart — total net pay grouped by department from actual payslip data (FR-040, §B9) |
| `components/TrendChart.tsx` | Line chart — monthly net salary totals for last N payruns (FR-040, §B9) |
| `components/AlertList.tsx` | Actionable alert list — missing bank details, duplicate payslips, unvalidated drafts, expiring contracts (FR-041, §B9) |
| `components/AttendanceOverview.tsx` | Summary tiles — Present, Late, Absent, Overtime, missing check-outs, manual edits, coverage % (FR-042, §B9) |
| `components/TimeOffOverview.tsx` | Table — Approved Days, Pending Requests, Remaining Balance by Type; N/A for non-allocation types (FR-043, §B9) |
| `components/DepartmentOverview.tsx` | Table — Department, Headcount, Monthly Salary Expenditure (FR-044, §B9) |
| `components/DashboardFilters.tsx` | Filter bar — Period, Department, Employee Type, Company; changes recompute all widgets (FR-038, §A7) |

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
| `services/dashboard.service.ts` | `getDashboardData(filters)` — single endpoint call; returns structured payload; aggregation failure surfaced as error, never substituted with static fallback |

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
| `services/dashboard-aggregator.service.ts` | Runs read-only queries across employee, contract, attendance, time-off, and payroll repositories; assembles all KPI, chart, alert, and overview data; imports only repository interfaces — never another module's service or controller |

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

---

### GET `/api/dashboard`
**Auth:** HR Manager+

**Query Params:** `?period=2024-03&department=Engineering&employeeType=full-time&company=Acme Corp`

**Response `200`:**
```json
{
  "filters": {
    "period": "2024-03",
    "department": "Engineering",
    "employeeType": "full-time",
    "company": "Acme Corp"
  },
  "kpis": {
    "totalNetSalaryPaid": 2850000,
    "payslipsGenerated": 38,
    "averageSalary": 75000,
    "approvedTimeOffDays": 47,
    "attendanceHealthPercent": 94.2
  },
  "salaryByDepartment": [
    { "department": "Engineering", "totalNet": 1200000, "headcount": 16 },
    { "department": "Sales", "totalNet": 850000, "headcount": 11 },
    { "department": "HR", "totalNet": 450000, "headcount": 6 },
    { "department": "Unassigned", "totalNet": 350000, "headcount": 5 }
  ],
  "monthlySalaryTrend": [
    { "period": "2023-10", "totalNet": 2700000 },
    { "period": "2023-11", "totalNet": 2720000 },
    { "period": "2023-12", "totalNet": 2780000 },
    { "period": "2024-01", "totalNet": 2800000 },
    { "period": "2024-02", "totalNet": 2830000 },
    { "period": "2024-03", "totalNet": 2850000 }
  ],
  "alerts": [
    {
      "type": "MISSING_BANK_DETAILS",
      "count": 3,
      "message": "3 employees are missing bank details",
      "blocking": false
    },
    {
      "type": "DUPLICATE_PAYSLIP",
      "count": 1,
      "message": "1 duplicate payslip detected in March 2024 run",
      "blocking": true
    },
    {
      "type": "UNVALIDATED_PAYRUNS",
      "count": 1,
      "message": "1 payrun is in Draft or Computed status",
      "blocking": false
    },
    {
      "type": "EXPIRING_CONTRACTS",
      "count": 2,
      "message": "2 contracts expiring within 30 days",
      "blocking": false
    }
  ],
  "attendanceOverview": {
    "present": 820,
    "late": 34,
    "absent": 12,
    "overtime": 58,
    "missingCheckOuts": 5,
    "manualEdits": 9,
    "coveragePercent": 94.2
  },
  "timeOffOverview": {
    "approvedDays": 47,
    "pendingRequests": 8,
    "balancesByType": [
      { "typeId": "tot_01", "typeName": "Annual Leave", "totalRemaining": 312 },
      { "typeId": "tot_02", "typeName": "Sick Leave", "totalRemaining": null }
    ]
  },
  "departmentOverview": [
    { "department": "Engineering", "headcount": 16, "monthlySalary": 1200000 },
    { "department": "Sales", "headcount": 11, "monthlySalary": 850000 },
    { "department": "HR", "headcount": 6, "monthlySalary": 450000 },
    { "department": "Unassigned", "headcount": 5, "monthlySalary": 350000 }
  ]
}
```

**Response `403`:**
```json
{ "error": "Insufficient permissions to access dashboard" }
```

**Response `500`:**
```json
{ "error": "Dashboard aggregation failed: payroll repository unavailable" }
```

---

## KPI Reference (§B9, FR-039–044)

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

## Key Rules (§A7, §B9, FR-038–044)
- The Payroll Dashboard integrates data from HR and Payroll modules, displaying live metrics derived from actual system records (§A7)
- Flexible filtering by Period and Department allows analysis of salary costs, attendance, and leave patterns (§A7)
- Employee Type filters enable focused analysis, restricting dashboard data to specific groups like full-time or contract staff (§A7)
- KPI cards display: Total Net Salary Paid, Payslips Generated, Average Salary, Approved Time Off, and Attendance Health (§B9)
- Charts plot Salary Cost by Department and Monthly Net Salary Trends using historical data (§B9)
- Operational alerts surface payroll statuses, missing required information, duplicate payslips, and contract attention items (§B9)
- Attendance Overview shows: Present, Late, Absent, Overtime, missing check-outs, manual edits, and attendance coverage (§B9)
- Department breakdown combines headcount with total salary expenditure (§B9)
- All values derived from live operational records — aggregation failure surfaces as error, never substituted with hardcoded fallback (§A7, §B9)
- Filter changes recompute all relevant widgets — no stale data presented as live (FR-038)
- `dashboard-aggregator.service.ts` imports only repository interfaces — never another module's service or controller
- All queries are read-only — no writes, no state changes
- Missing department handled as "Unassigned" — not silently dropped from charts (FR-040)
- Non-allocation leave types show N/A for balance — not zero (FR-043)
- Zero denominator for averages/percentages handled gracefully — no division-by-zero crash (FR-039)
- Response is a single shaped object to minimise round trips — one endpoint, one payload
- Employee role must not reach this endpoint — HR Manager+ only (§3)

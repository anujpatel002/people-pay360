# Module: attendance

## References
FR-014 (Attendance List), FR-015 (Quick Check-In/Out Widget), FR-016 (Worked Hours + Overtime), FR-017 (Authorized Correction)
Hackathon Spec §B3 (Attendance List & Form)

## Overview
Captures employee check-in/check-out, computes worked hours and overtime against the assigned working schedule, flags exceptions, and supports authorized manual corrections with full audit traceability. Accessible globally from the main navigation or directly from an individual Employee Form. Provides a quick widget for rapid employee self-entry. Depends on `employees` and `working-schedules`. `payroll` reads attendance records via repository for payslip computation. Attendance data remains available for Payroll Dashboard insights.

---

## Frontend — `client/src/features/attendance/`

### Components
| File | Responsibility |
|------|---------------|
| `components/AttendanceStatusBadge.tsx` | Present / Late / Absent / Overtime / Corrected status badge — uses text + icon, not color alone |
| `components/ExceptionFlag.tsx` | Inline warning icon + tooltip for anomalies (missing punch, overtime) |
| `components/CheckInWidget.tsx` | Quick widget — shows Check In when no active session; Check Out + elapsed time when checked in; green indicator after check-in (FR-015) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/AttendanceListPage.tsx` | Global list — Check In, Check Out, Worked Hours, Status columns; search, date filter, employee filter, Today context; accessible from main menu or from Employee Form (FR-014, §B3) |
| `pages/AttendanceFormPage.tsx` | Detail / correction form — timestamps, worked hours, overtime, status, correction reason; EDIT restricted to authorized users (FR-017, §B3) |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useAttendance.ts` | Fetches attendance records with filter params (employeeId, dateRange, status) |
| `hooks/useCheckInOut.ts` | Manages quick widget state — active session detection, check-in/out actions, elapsed time ticker |

### Services
| File | Responsibility |
|------|---------------|
| `services/attendance.service.ts` | `getAttendance(filters)`, `getRecord(id)`, `checkIn()`, `checkOut()`, `correctRecord(id, correction)` |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/useAttendance.test.ts` | Hook tests — filter combinations, exception display |
| `tests/useCheckInOut.test.ts` | Widget — no active session → Check In shown; after check-in → Check Out + elapsed; duplicate check-in blocked |
| `tests/attendance.service.test.ts` | Mocked API calls |

---

## Backend — `server/src/modules/attendance/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/attendance.controller.ts` | List, get, check-in, check-out, correct handlers |

### Services
| File | Responsibility |
|------|---------------|
| `services/attendance.service.ts` | Orchestrates record lifecycle; calls worked-hours and exception services; enforces single open session per employee |
| `services/worked-hours.service.ts` | Computes `workedMinutes` = checkOut − checkIn; handles overnight crossing; sample: 09:05–18:10 ≈ 9.08h (FR-016) |
| `services/exception-detector.service.ts` | Compares workedMinutes against schedule expected hours — sets status: Present / Late / Absent / Overtime; records correction metadata on manual edit (FR-016, FR-017) |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/attendance.repository.ts` | findByEmployee, findByDateRange, findOpenSession (no checkOut), findExceptions, create, update |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/attendance.routes.ts` | `/api/attendance` — list/get: HR Manager+; check-in/out: Employee+; correct: HR Manager |

### Validators
| File | Responsibility |
|------|---------------|
| `validators/attendance.validator.ts` | Zod — checkIn required for check-in; checkOut must be after checkIn; correction requires non-empty reason; timestamps non-negative duration |

### Models
| File | Responsibility |
|------|---------------|
| `models/attendance.model.ts` | Schema — id, employeeId (FK), date, checkIn (datetime), checkOut (datetime, nullable), workedMinutes (stored), overtimeMinutes (stored), status (Present/Late/Absent/Overtime/Corrected), correctionReason, correctedBy, correctedAt, isManualEntry, timestamps |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/worked-hours.service.test.ts` | Unit — standard day, overnight shift, missing checkout (null), zero duration |
| `tests/exception-detector.service.test.ts` | Unit — on-time, late threshold, absent (no record), overtime, correction metadata |
| `tests/attendance.integration.test.ts` | Integration — check-in → check-out flow, duplicate open session rejection, correction flow, audit trail |

---

## API Endpoints

---

### GET `/api/attendance`
**Auth:** HR Manager+

**Query Params:** `?employeeId=emp_01&dateFrom=2024-03-01&dateTo=2024-03-31&status=Late&page=1&limit=20`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "att_01",
      "employeeId": "emp_01",
      "employeeName": "John Smith",
      "date": "2024-03-05",
      "checkIn": "2024-03-05T09:15:00Z",
      "checkOut": "2024-03-05T18:05:00Z",
      "workedMinutes": 530,
      "overtimeMinutes": 0,
      "status": "Late",
      "isManualEntry": false,
      "correctionReason": null,
      "correctedBy": null,
      "correctedAt": null
    }
  ],
  "total": 22,
  "page": 1,
  "limit": 20
}
```

---

### GET `/api/attendance/:id`
**Auth:** HR Manager+

**Response `200`:**
```json
{
  "id": "att_01",
  "employeeId": "emp_01",
  "employeeName": "John Smith",
  "date": "2024-03-05",
  "checkIn": "2024-03-05T09:15:00Z",
  "checkOut": "2024-03-05T18:05:00Z",
  "workedMinutes": 530,
  "overtimeMinutes": 0,
  "status": "Late",
  "isManualEntry": false,
  "correctionReason": null,
  "correctedBy": null,
  "correctedAt": null,
  "createdAt": "2024-03-05T09:15:00Z",
  "updatedAt": "2024-03-05T18:05:00Z"
}
```

**Response `404`:**
```json
{ "error": "Attendance record not found" }
```

---

### POST `/api/attendance/check-in`
**Auth:** Employee+

**Request Body:** _(none — employee resolved from JWT)_

**Response `201`:**
```json
{
  "id": "att_02",
  "employeeId": "emp_01",
  "date": "2024-03-06",
  "checkIn": "2024-03-06T08:58:00Z",
  "checkOut": null,
  "status": "Present",
  "isManualEntry": false
}
```

**Response `409`:**
```json
{ "error": "Employee already has an open check-in session" }
```

---

### POST `/api/attendance/check-out`
**Auth:** Employee+

**Request Body:** _(none — employee resolved from JWT)_

**Response `200`:**
```json
{
  "id": "att_02",
  "employeeId": "emp_01",
  "date": "2024-03-06",
  "checkIn": "2024-03-06T08:58:00Z",
  "checkOut": "2024-03-06T18:02:00Z",
  "workedMinutes": 544,
  "overtimeMinutes": 64,
  "status": "Overtime"
}
```

**Response `404`:**
```json
{ "error": "No open check-in session found for this employee" }
```

---

### PUT `/api/attendance/:id/correct`
**Auth:** HR Manager

**Request Body:**
```json
{
  "checkIn": "2024-03-05T09:00:00Z",
  "checkOut": "2024-03-05T18:00:00Z",
  "correctionReason": "System clock error on terminal"
}
```

**Response `200`:**
```json
{
  "id": "att_01",
  "employeeId": "emp_01",
  "date": "2024-03-05",
  "checkIn": "2024-03-05T09:00:00Z",
  "checkOut": "2024-03-05T18:00:00Z",
  "workedMinutes": 540,
  "overtimeMinutes": 60,
  "status": "Corrected",
  "isManualEntry": true,
  "correctionReason": "System clock error on terminal",
  "correctedBy": "u_05",
  "correctedAt": "2024-03-06T10:00:00Z"
}
```

**Response `403`:**
```json
{ "error": "Insufficient permissions to correct attendance" }
```

**Response `422`:**
```json
{ "error": "correctionReason is required" }
```

---

## Key Rules (§B3, FR-014–017)
- Attendance is accessible globally from the main menu or directly from an individual Employee Form (§B3)
- List view displays Check In, Check Out, Worked Hours, and Status for quick review of entries and exceptions (§B3)
- Attendance Form provides detailed records and supports manual corrections restricted to authorized users (§B3)
- Attendance data remains available for reporting and Payroll Dashboard insights (§B3)
- An employee can have only one open check-in (no checkOut) at a time — duplicate open session is rejected (FR-015)
- `workedMinutes` and `overtimeMinutes` are computed and stored on check-out, not recalculated on every read (FR-016)
- Exception detection runs after every check-out and every correction — status field always reflects latest calculation (FR-016)
- Corrected records are distinguishable from system-generated records via `isManualEntry`, `correctedBy`, `correctedAt` fields (FR-017)
- Unauthorized users cannot edit attendance records — 403 returned server-side (FR-017)
- Missing check-out must be clearly visible in the list — not silently hidden (FR-014)
- `payroll` reads attendance records via repository — this module does not push data to payroll
- Correction after a paid payrun is allowed but payrun is not automatically recomputed (FR-017 edge case)

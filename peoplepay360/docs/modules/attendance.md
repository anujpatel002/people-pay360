# Module: attendance

## SRS References
FR-014 (Attendance List), FR-015 (Quick Check-In/Out Widget), FR-016 (Worked Hours + Overtime), FR-017 (Authorized Correction)

## Overview
Captures employee check-in/check-out, computes worked hours and overtime against the assigned working schedule, flags exceptions, and supports authorized manual corrections with full audit traceability. Provides a quick widget for rapid employee self-entry. Depends on `employees` and `working-schedules`. `payroll` reads attendance records via repository for payslip computation.

---

## Frontend — `client/src/features/attendance/`

### Components
| File | Responsibility |
|------|---------------|
| `components/AttendanceStatusBadge.tsx` | Present / Late / Absent / Overtime / Corrected status badge — uses text + icon, not color alone (SRS §5.1) |
| `components/ExceptionFlag.tsx` | Inline warning icon + tooltip for anomalies (missing punch, overtime) |
| `components/CheckInWidget.tsx` | Quick widget — shows Check In when no active session; Check Out + elapsed time when checked in; green indicator after check-in (FR-015) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/AttendanceListPage.tsx` | Global list — Check In, Check Out, Worked Hours, Status columns; search, date filter, employee filter, Today context (FR-014) |
| `pages/AttendanceFormPage.tsx` | Detail / correction form — timestamps, worked hours, overtime, status, correction reason; EDIT for authorized users (FR-017) |

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
| `services/worked-hours.service.ts` | Computes `workedMinutes` = checkOut − checkIn; handles overnight crossing; sample: 09:05–18:10 ≈ 9.08h (FR-016 acceptance criteria) |
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
| `models/attendance.model.ts` | Schema — id, employeeId (FK), date, checkIn (datetime), checkOut (datetime, nullable), workedMinutes (stored), overtime Minutes (stored), status (Present/Late/Absent/Overtime/Corrected), correctionReason, correctedBy, correctedAt, isManualEntry, timestamps |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/worked-hours.service.test.ts` | Unit — standard day, overnight shift, missing checkout (null), zero duration |
| `tests/exception-detector.service.test.ts` | Unit — on-time, late threshold, absent (no record), overtime, correction metadata |
| `tests/attendance.integration.test.ts` | Integration — check-in → check-out flow, duplicate open session rejection, correction flow, audit trail |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/attendance` | HR Manager+ | Filtered attendance list |
| GET | `/api/attendance/:id` | HR Manager+ | Single record detail |
| POST | `/api/attendance/check-in` | Employee+ | Record check-in for current user |
| POST | `/api/attendance/check-out` | Employee+ | Close open session, compute worked hours |
| PUT | `/api/attendance/:id/correct` | HR Manager | Manual correction with reason — recalculates derived values |

---

## Key Rules (SRS §FR-014–017)
- An employee can have only one open check-in (no checkOut) at a time — duplicate open session is rejected (FR-015)
- `workedMinutes` and `overtimeMinutes` are computed and stored on check-out, not recalculated on every read (FR-016)
- Exception detection runs after every check-out and every correction — status field always reflects latest calculation (FR-016)
- Corrected records are distinguishable from system-generated records via `isManualEntry`, `correctedBy`, `correctedAt` fields (FR-017)
- Unauthorized users cannot edit attendance records — 403 returned server-side (FR-017)
- Missing check-out must be clearly visible in the list — not silently hidden (FR-014)
- `payroll` reads attendance records via repository — this module does not push data to payroll
- Correction after a paid payrun is an edge case noted in SRS — correction is allowed but payrun is not automatically recomputed (FR-017 edge case)

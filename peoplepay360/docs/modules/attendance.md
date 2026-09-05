# Module: attendance

## Overview
Records employee check-in/out, computes worked hours, flags exceptions (late, absent, overtime), and supports manual corrections. Depends on `employees` and `working-schedules` (schedule defines expected hours against which actuals are compared).

---

## Frontend — `client/src/features/attendance/`

### Components
| File | Responsibility |
|------|---------------|
| `components/AttendanceStatusBadge.tsx` | Present / Late / Absent / Corrected badge |
| `components/ExceptionFlag.tsx` | Inline warning icon + tooltip for anomalies |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/AttendanceListPage.tsx` | Filterable table by employee, date range, status |
| `pages/AttendanceFormPage.tsx` | Manual check-in/out entry or correction with reason field |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useAttendance.ts` | Fetches attendance records with filter params (employeeId, dateRange, status) |

### Services
| File | Responsibility |
|------|---------------|
| `services/attendance.service.ts` | `getAttendance(filters)`, `getRecord(id)`, `createRecord()`, `correctRecord()` |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/useAttendance.test.ts` | Hook tests — filter combinations, exception flagging |
| `tests/attendance.service.test.ts` | Mocked API call assertions |

---

## Backend — `server/src/modules/attendance/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/attendance.controller.ts` | List, get, check-in, check-out, correct handlers |

### Services
| File | Responsibility |
|------|---------------|
| `services/attendance.service.ts` | Orchestrates record creation, calls worked-hours and exception services |
| `services/worked-hours.service.ts` | Computes `workedMinutes` from checkIn/checkOut timestamps |
| `services/exception-detector.service.ts` | Compares worked hours against schedule — flags late, absent, overtime |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/attendance.repository.ts` | DB queries — findByEmployee, findByDateRange, findExceptions, create, update |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/attendance.routes.ts` | Mounts handlers on `/api/attendance` |

### Validators
| File | Responsibility |
|------|---------------|
| `validators/attendance.validator.ts` | Zod schema — checkIn required, checkOut after checkIn, correction requires reason |

### Models
| File | Responsibility |
|------|---------------|
| `models/attendance.model.ts` | Schema — id, employeeId, date, checkIn, checkOut, workedMinutes, status, correctionReason, timestamps |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/worked-hours.service.test.ts` | Unit — normal day, overnight shift, missing checkout |
| `tests/exception-detector.service.test.ts` | Unit — late threshold, absent detection, overtime |
| `tests/attendance.integration.test.ts` | Integration — check-in/out flow, correction flow |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/attendance` | HR Manager+ | Filtered attendance list |
| GET | `/api/attendance/:id` | HR Manager+ | Single record |
| POST | `/api/attendance/check-in` | Employee+ | Record check-in |
| POST | `/api/attendance/check-out` | Employee+ | Record check-out |
| PUT | `/api/attendance/:id/correct` | HR Manager | Manual correction with reason |

---

## Key Rules
- An employee can only have one open check-in (no check-out) at a time — enforce at service level
- `workedMinutes` is computed and stored on check-out, not recalculated on every read
- Exception detection runs after every check-out and correction — results stored in `status` field
- `payroll` reads attendance records directly via repository — attendance module does not push data to payroll

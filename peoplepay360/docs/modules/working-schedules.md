# Module: working-schedules

## SRS References
FR-011 (Schedule List), FR-012 (Schedule Form + Weekly Pattern), FR-013 (Schedule Assignment)

## Overview
Defines reusable weekly working patterns (day, start time, end time, break duration). Automatically derives total weekly hours from the configured day rows. Assigned to employees and contracts; consumed by `attendance` for expected-hours comparison and by `payroll` via the active contract's `scheduleId`. Depends on `auth`.

---

## Frontend — `client/src/features/working-schedules/`

### Components
| File | Responsibility |
|------|---------------|
| `components/WeeklyPatternEditor.tsx` | Day-by-day grid — toggle day active, set start/end times, break minutes; displays auto-computed Total Weekly Hours in real time (FR-012) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/ScheduleListPage.tsx` | List — Schedule Name, Calendar/Type, Days/Week, Hours/Week, Company, Status; New Schedule, search, filter (FR-011) |
| `pages/ScheduleFormPage.tsx` | Create / edit — name, company, timezone, day rows via WeeklyPatternEditor, Total Weekly Hours (FR-012) |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useSchedules.ts` | Fetches all schedules for list view and for Employee/Contract form selectors |
| `hooks/useSchedule.ts` | Fetches single schedule by ID for edit form |

### Services
| File | Responsibility |
|------|---------------|
| `services/working-schedules.service.ts` | `getSchedules()`, `getSchedule(id)`, `createSchedule()`, `updateSchedule()` |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/WeeklyPatternEditor.test.tsx` | Component — toggle days, time input validation, real-time weekly hours computation display |
| `tests/working-schedules.service.test.ts` | Mocked API — CRUD calls |

---

## Backend — `server/src/modules/working-schedules/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/working-schedules.controller.ts` | List, get, create, update handlers |

### Services
| File | Responsibility |
|------|---------------|
| `services/working-schedules.service.ts` | Orchestrates CRUD; calls `weekly-hours.calculator.ts` before persist; validates no duplicate day entries; blocks delete if referenced |
| `services/weekly-hours.calculator.ts` | Pure function — for each active day: `hours = (end - start) - breakMinutes`; sums all active days → `totalWeeklyHours`; sample: 9–18 with 60 min break × 5 days = 40h (FR-012 acceptance criteria) |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/working-schedules.repository.ts` | findAll, findById, create, update, isReferencedByEmployeeOrContract (for delete guard) |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/working-schedules.routes.ts` | `/api/working-schedules` — read: HR Manager+; write: HR Manager |

### Models
| File | Responsibility |
|------|---------------|
| `models/working-schedule.model.ts` | Schema — id, name, company, timezone, weeklyHours (stored computed value), days (JSON array of day patterns), isActive, timestamps |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/weekly-hours.calculator.test.ts` | Unit — 5-day standard (40h), 4-day week, overnight shift, half-day, zero active days, break > shift duration (validation error) |
| `tests/working-schedules.integration.test.ts` | Integration — CRUD, delete-guard when referenced by employee/contract |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/working-schedules` | HR Manager+ | All schedules (for list + selectors) |
| GET | `/api/working-schedules/:id` | HR Manager+ | Single schedule with day pattern |
| POST | `/api/working-schedules` | HR Manager | Create schedule |
| PUT | `/api/working-schedules/:id` | HR Manager | Update schedule |
| DELETE | `/api/working-schedules/:id` | HR Manager | Delete — blocked with 409 if referenced |

---

## Day Pattern Shape
```ts
{
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
  active: boolean,
  start: 'HH:mm',
  end: 'HH:mm',
  breakMinutes: number
}
```

## Key Rules (SRS §FR-011–013)
- `weekly-hours.calculator.ts` is a pure function with zero DB dependency — deterministic and independently testable (FR-012)
- `weeklyHours` is stored on save, not recomputed on every read — payroll and attendance can reference it without recalculating
- End time must be after start time for same-day schedules; break must be non-negative and less than shift duration (FR-012 validation)
- Duplicate day entries in the same schedule are rejected (FR-012 validation)
- A schedule cannot be deleted if any employee or contract references it — return 409 Conflict (FR-013)
- Schedule field appears on both Employee and Contract forms — contract-level assignment overrides employee-level for payroll purposes (FR-013)
- Overnight shifts and DST/timezone edge cases are noted as open questions in SRS §FR-012

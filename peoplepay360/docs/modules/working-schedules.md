# Module: working-schedules

## References
FR-011 (Schedule List), FR-012 (Schedule Form + Weekly Pattern), FR-013 (Schedule Assignment)
Hackathon Spec §A3 (Working Schedule Setup)

## Overview
Defines reusable weekly working patterns (day, start time, end time, break duration). Automatically derives total weekly hours from the configured day rows — not entered manually. Assigned to employees or contracts to standardize attendance and payroll expectations. Consumed by `attendance` for expected-hours comparison and by `payroll` via the active contract's `scheduleId`. Depends on `auth`.

---

## Frontend — `client/src/features/working-schedules/`

### Components
| File | Responsibility |
|------|---------------|
| `components/WeeklyPatternEditor.tsx` | Day-by-day grid — toggle day active, set start/end times, break minutes; displays auto-computed Total Weekly Hours in real time (FR-012, §A3) |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/ScheduleListPage.tsx` | List — Schedule Name, Type, Days/Week, Weekly Hours, Company, Status; New Schedule, search, filter (FR-011, §A3) |
| `pages/ScheduleFormPage.tsx` | Create / edit — name, company, timezone, day rows via WeeklyPatternEditor, Total Weekly Hours auto-calculated (FR-012, §A3) |

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
| `services/weekly-hours.calculator.ts` | Pure function — for each active day: `hours = (end - start) - breakMinutes`; sums all active days → `totalWeeklyHours`; sample: 9–18 with 60 min break × 5 days = 40h (FR-012) |

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

---

### GET `/api/working-schedules`
**Auth:** HR Manager+

**Query Params:** `?search=standard&isActive=true`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "sch_01",
      "name": "Standard 40h",
      "company": "Acme Corp",
      "timezone": "America/New_York",
      "weeklyHours": 40,
      "isActive": true,
      "days": [
        { "day": "monday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
        { "day": "tuesday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
        { "day": "wednesday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
        { "day": "thursday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
        { "day": "friday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
        { "day": "saturday", "active": false, "start": null, "end": null, "breakMinutes": 0 },
        { "day": "sunday", "active": false, "start": null, "end": null, "breakMinutes": 0 }
      ],
      "createdAt": "2023-01-01T08:00:00Z"
    }
  ],
  "total": 5
}
```

---

### GET `/api/working-schedules/:id`
**Auth:** HR Manager+

**Response `200`:**
```json
{
  "id": "sch_01",
  "name": "Standard 40h",
  "company": "Acme Corp",
  "timezone": "America/New_York",
  "weeklyHours": 40,
  "isActive": true,
  "days": [
    { "day": "monday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
    { "day": "tuesday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
    { "day": "wednesday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
    { "day": "thursday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
    { "day": "friday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
    { "day": "saturday", "active": false, "start": null, "end": null, "breakMinutes": 0 },
    { "day": "sunday", "active": false, "start": null, "end": null, "breakMinutes": 0 }
  ],
  "createdAt": "2023-01-01T08:00:00Z",
  "updatedAt": "2024-01-10T10:00:00Z"
}
```

**Response `404`:**
```json
{ "error": "Schedule not found" }
```

---

### POST `/api/working-schedules`
**Auth:** HR Manager

**Request Body:**
```json
{
  "name": "Standard 40h",
  "company": "Acme Corp",
  "timezone": "America/New_York",
  "days": [
    { "day": "monday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
    { "day": "tuesday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
    { "day": "wednesday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
    { "day": "thursday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
    { "day": "friday", "active": true, "start": "09:00", "end": "18:00", "breakMinutes": 60 },
    { "day": "saturday", "active": false, "start": null, "end": null, "breakMinutes": 0 },
    { "day": "sunday", "active": false, "start": null, "end": null, "breakMinutes": 0 }
  ]
}
```

**Response `201`:**
```json
{
  "id": "sch_01",
  "name": "Standard 40h",
  "company": "Acme Corp",
  "timezone": "America/New_York",
  "weeklyHours": 40,
  "isActive": true,
  "createdAt": "2023-01-01T08:00:00Z"
}
```

**Response `422`:**
```json
{ "error": "End time must be after start time for active days" }
```

---

### PUT `/api/working-schedules/:id`
**Auth:** HR Manager

**Request Body:** _(all fields optional)_
```json
{
  "name": "Flexible 35h",
  "days": [
    { "day": "monday", "active": true, "start": "09:00", "end": "16:00", "breakMinutes": 30 },
    { "day": "tuesday", "active": true, "start": "09:00", "end": "16:00", "breakMinutes": 30 },
    { "day": "wednesday", "active": true, "start": "09:00", "end": "16:00", "breakMinutes": 30 },
    { "day": "thursday", "active": true, "start": "09:00", "end": "16:00", "breakMinutes": 30 },
    { "day": "friday", "active": true, "start": "09:00", "end": "16:00", "breakMinutes": 30 },
    { "day": "saturday", "active": false, "start": null, "end": null, "breakMinutes": 0 },
    { "day": "sunday", "active": false, "start": null, "end": null, "breakMinutes": 0 }
  ]
}
```

**Response `200`:**
```json
{
  "id": "sch_01",
  "name": "Flexible 35h",
  "weeklyHours": 32.5,
  "updatedAt": "2024-03-10T11:00:00Z"
}
```

---

### DELETE `/api/working-schedules/:id`
**Auth:** HR Manager

**Request Body:** _(none)_

**Response `200`:**
```json
{ "message": "Schedule deleted", "id": "sch_01" }
```

**Response `409`:**
```json
{ "error": "Schedule is referenced by one or more employees or contracts" }
```

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

## Key Rules (§A3, FR-011–013)
- List view shows key metrics: name, type, and weekly hours (§A3)
- Form view defines the weekly pattern using Day, Start Time, End Time, and Break (§A3)
- Total weekly hours are calculated automatically from the defined schedule — not entered manually (§A3)
- Schedules are assigned to employees or contracts to standardize attendance and payroll expectations (§A3)
- `weekly-hours.calculator.ts` is a pure function with zero DB dependency — deterministic and independently testable (FR-012)
- `weeklyHours` is stored on save, not recomputed on every read — payroll and attendance can reference it without recalculating
- End time must be after start time for same-day schedules; break must be non-negative and less than shift duration (FR-012 validation)
- Duplicate day entries in the same schedule are rejected (FR-012 validation)
- A schedule cannot be deleted if any employee or contract references it — return 409 Conflict (FR-013)
- Contract-level schedule assignment overrides employee-level for payroll purposes (FR-013)

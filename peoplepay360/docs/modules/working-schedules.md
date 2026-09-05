# Module: working-schedules

## Overview
Defines weekly work patterns (days, start/end times, break duration). Auto-computes total weekly hours. Used by `attendance` to determine expected hours and by `payroll` via the active contract's `scheduleId`. Depends on `employees`.

---

## Frontend — `client/src/features/working-schedules/`

### Components
| File | Responsibility |
|------|---------------|
| `components/WeeklyPatternEditor.tsx` | Day-by-day grid — toggle day active, set start/end/break times, shows computed weekly hours |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/ScheduleListPage.tsx` | All schedules — name, weekly hours, number of employees assigned |
| `pages/ScheduleFormPage.tsx` | Create / edit schedule using WeeklyPatternEditor |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useSchedules.ts` | Fetches all schedules for list/select |
| `hooks/useSchedule.ts` | Fetches single schedule by ID |

### Services
| File | Responsibility |
|------|---------------|
| `services/working-schedules.service.ts` | `getSchedules()`, `getSchedule(id)`, `createSchedule()`, `updateSchedule()` |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/WeeklyPatternEditor.test.tsx` | Component tests — toggle days, time inputs, computed hours display |
| `tests/working-schedules.service.test.ts` | Mocked API call assertions |

---

## Backend — `server/src/modules/working-schedules/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/working-schedules.controller.ts` | CRUD handlers |

### Services
| File | Responsibility |
|------|---------------|
| `services/working-schedules.service.ts` | Orchestrates CRUD, calls calculator before save |
| `services/weekly-hours.calculator.ts` | Pure function — sums (end - start - break) across active days to produce total weekly hours |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/working-schedules.repository.ts` | DB queries — findAll, findById, create, update |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/working-schedules.routes.ts` | Mounts handlers on `/api/working-schedules` |

### Models
| File | Responsibility |
|------|---------------|
| `models/working-schedule.model.ts` | Schema — id, name, weeklyHours, days (JSON array of day patterns), timestamps |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/weekly-hours.calculator.test.ts` | Unit — various day combinations, break deduction, zero-day edge case |
| `tests/working-schedules.integration.test.ts` | Integration — CRUD against test DB |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/working-schedules` | HR Manager+ | All schedules |
| GET | `/api/working-schedules/:id` | HR Manager+ | Single schedule |
| POST | `/api/working-schedules` | HR Manager | Create schedule |
| PUT | `/api/working-schedules/:id` | HR Manager | Update schedule |

---

## Key Rules
- `weekly-hours.calculator.ts` is a pure function with no DB dependency — easy to unit test in isolation
- `weeklyHours` is always stored (not computed on read) so payroll can reference it without recalculating
- A schedule cannot be deleted if any employee or contract references it — return 409 Conflict
- Day pattern shape: `{ day: 'monday', active: boolean, start: 'HH:mm', end: 'HH:mm', breakMinutes: number }`

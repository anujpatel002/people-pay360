# Module Priority & Team Assignment

## Dependency Order (build sequence)

```
auth → users → employees → contracts → working-schedules
                                              ↓
                                         attendance
                                              ↓
                                          time-off
                                              ↓
                                      payroll-config
                                              ↓
                                           payroll
                                              ↓
                                          dashboard
```

---

## Assignment

| Priority | Module | Teammate |
|----------|--------|----------|
| 1 | **auth** | Teammate A |
| 2 | **users** | Teammate B |
| 3 | **employees** | Teammate C |
| 4 | **contracts** | Teammate A |
| 5 | **working-schedules** | Teammate B |
| 6 | **attendance** | Teammate C |
| 7 | **time-off** | Teammate A |
| 8 | **payroll-config** | Teammate B |
| 9 | **payroll** | Teammate C |
| 10 | **dashboard** | Teammate A |

---

## Per-Teammate Summary

### Teammate A — auth · contracts · time-off · dashboard
- Starts immediately with `auth` (no dependencies)
- `contracts` unblocks after Teammate C finishes `employees`
- `time-off` unblocks after Teammate C finishes `attendance`
- `dashboard` is last — read-only aggregator, unblocks after all modules are done

### Teammate B — users · working-schedules · payroll-config
- Starts with `users` right after `auth` is done
- `working-schedules` unblocks after Teammate A finishes `contracts`
- `payroll-config` unblocks after Teammate A finishes `time-off`

### Teammate C — employees · attendance · payroll
- Starts with `employees` right after `auth` is done (parallel with Teammate B)
- `attendance` unblocks after Teammate B finishes `working-schedules`
- `payroll` unblocks after Teammate B finishes `payroll-config`

---

## Timeline Overview

| Teammate | Week 1 | Week 2 | Week 3 | Week 4 |
|----------|--------|--------|--------|--------|
| A | auth | contracts | time-off | dashboard |
| B | users | working-schedules | payroll-config | — |
| C | employees | attendance | payroll | — |

---

## Rules

- No teammate picks up their next module until the blocking dependency is merged
- Each module must include both client (`client/src/features/<module>`) and server (`server/src/modules/<module>`) work
- `shared/` components and `shared/` server utilities are contributed by whoever first needs them — add, don't duplicate
- `database/migrations` are owned by whoever is building that module's models

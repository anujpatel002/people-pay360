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
| 1 | **auth** | Anuj Patel |
| 2 | **users** | Ahmedabbas Momin |
| 3 | **employees** | Tirth Mantri |
| 4 | **contracts** | Anuj Patel |
| 5 | **working-schedules** | Ahmedabbas Momin |
| 6 | **attendance** | Tirth Mantri |
| 7 | **time-off** | Anuj Patel |
| 8 | **payroll-config** | Ahmedabbas Momin |
| 9 | **payroll** | Tirth Mantri |
| 10 | **dashboard** | Anuj Patel |

---

## Per-Teammate Summary

### Anuj Patel — auth · contracts · time-off · dashboard
- Starts immediately with `auth` (no dependencies)
- `contracts` unblocks after Tirth Mantri finishes `employees`
- `time-off` unblocks after Tirth Mantri finishes `attendance`
- `dashboard` is last — read-only aggregator, unblocks after all modules are done

### Ahmedabbas Momin — users · working-schedules · payroll-config
- Starts with `users` right after `auth` is done
- `working-schedules` unblocks after Anuj Patel finishes `contracts`
- `payroll-config` unblocks after Anuj Patel finishes `time-off`

### Tirth Mantri — employees · attendance · payroll
- Starts with `employees` right after `auth` is done (parallel with Ahmedabbas Momin)
- `attendance` unblocks after Ahmedabbas Momin finishes `working-schedules`
- `payroll` unblocks after Ahmedabbas Momin finishes `payroll-config`

---

## Rules

- No teammate picks up their next module until the blocking dependency is merged
- Each module must include both client (`client/src/features/<module>`) and server (`server/src/modules/<module>`) work
- `shared/` components and `shared/` server utilities are contributed by whoever first needs them — add, don't duplicate
- `database/migrations` are owned by whoever is building that module's models

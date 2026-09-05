# Module: users

## SRS References
FR-003 (Administrator User Management)

## Overview
Admin-only module for creating and editing application user accounts, linking each account to an employee record, and assigning access roles. A user account (login identity) is explicitly distinct from an Employee record (HR master data) per SRS §1.6. Depends on `auth` for session; `employees` must exist before a user can be linked.

---

## Frontend — `client/src/features/users/`

### Components
| File | Responsibility |
|------|---------------|
| `components/UserTable.tsx` | Paginated list of all users — name, work email, linked employee, role badge, active status, action buttons |
| `components/RoleSelector.tsx` | Dropdown constrained to valid roles from `shared/constants/roles.ts` — prevents self-elevation |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/UserListPage.tsx` | User Management list — NEW, search, role filter, row selection (FR-003) |
| `pages/UserFormPage.tsx` | Create / Edit User form — employee link (required), work email, role(s), account status |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useUsers.ts` | Fetches paginated user list with search + role filter params |
| `hooks/useUser.ts` | Fetches single user by ID for edit form pre-population |

### Services
| File | Responsibility |
|------|---------------|
| `services/users.service.ts` | `getUsers(filters)`, `getUser(id)`, `createUser()`, `updateUser()`, `deactivateUser()` |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/useUsers.test.ts` | Hook tests — fetch, role filter, pagination state |
| `tests/users.service.test.ts` | Mocked API — create, update, deactivate calls |

---

## Backend — `server/src/modules/users/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/users.controller.ts` | List, get, create, update, deactivate handlers — delegates to service |

### Services
| File | Responsibility |
|------|---------------|
| `services/users.service.ts` | Role validation against allowed enum, duplicate email check, employee-link validation, self-elevation prevention, account activation/deactivation |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/users.repository.ts` | findAll (with filters), findById, findByEmail, create, update, softDelete |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/users.routes.ts` | `/api/users` — all routes behind `auth.middleware` + `role-guard([Admin])` |

### Models
| File | Responsibility |
|------|---------------|
| `models/user.model.ts` | Schema — id, employeeId (FK, required), name, workEmail (unique), passwordHash, role, isActive, timestamps |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/users.service.test.ts` | Unit — duplicate email rejection, invalid role rejection, self-elevation block, deactivating last admin |
| `tests/users.integration.test.ts` | Integration — full CRUD + role assignment against test DB |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users` | Admin | Paginated user list with search + role filter |
| GET | `/api/users/:id` | Admin | Single user |
| POST | `/api/users` | Admin | Create user linked to employee |
| PUT | `/api/users/:id` | Admin | Update user / change role / toggle active |
| DELETE | `/api/users/:id` | Admin | Soft-deactivate user (`isActive = false`) |

---

## Key Rules (SRS §FR-003)
- Employee link is required on every user account — a user cannot exist without a linked employee (FR-003)
- Work email must be unique across all user accounts
- Role must be one of the five canonical roles in `shared/constants/roles.ts` (SRS §3)
- Admin cannot elevate their own role or deactivate the last active Admin account
- Deactivation is soft (`isActive = false`) — hard delete is not supported; historical payroll/audit references remain intact
- Password is hashed by `auth/services/password.service.ts` — this module never handles raw passwords
- Permissions take effect on the next authorization evaluation after role change (FR-003 postcondition)

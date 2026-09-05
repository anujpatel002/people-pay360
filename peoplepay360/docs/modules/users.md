# Module: users

## References
FR-003 (Administrator User Management)
Hackathon Spec §3 (User Roles), §B1 (Main Navigation — Admin access)

## Overview
Admin-only module for creating and editing application user accounts, linking each account to an employee record, and assigning access roles. A user account (login identity) is explicitly distinct from an Employee record (HR master data). Depends on `auth`; `employees` must exist before a user can be linked.

---

## Frontend — `client/src/features/users/`

### Components
| File | Responsibility |
|------|---------------|
| `components/UserTable.tsx` | Paginated list of all users — name, work email, linked employee, role badge, active status, action buttons |
| `components/RoleSelector.tsx` | Dropdown constrained to the five canonical roles (§3) — prevents self-elevation |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/UserListPage.tsx` | User Management list — NEW, search, role filter, row selection (FR-003) |
| `pages/UserFormPage.tsx` | Create / Edit User form — employee link (required), work email, role, account status |

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

---

### GET `/api/users`
**Auth:** Admin

**Query Params:** `?search=jane&role=HR Manager&page=1&limit=20`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "u_01",
      "name": "Jane Doe",
      "workEmail": "jane.doe@company.com",
      "role": "HR Manager",
      "isActive": true,
      "employeeId": "emp_01",
      "employeeName": "Jane Doe",
      "createdAt": "2024-01-15T09:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

### GET `/api/users/:id`
**Auth:** Admin

**Response `200`:**
```json
{
  "id": "u_01",
  "name": "Jane Doe",
  "workEmail": "jane.doe@company.com",
  "role": "HR Manager",
  "isActive": true,
  "employeeId": "emp_01",
  "employeeName": "Jane Doe",
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-03-10T11:00:00Z"
}
```

**Response `404`:**
```json
{ "error": "User not found" }
```

---

### POST `/api/users`
**Auth:** Admin

**Request Body:**
```json
{
  "name": "Jane Doe",
  "workEmail": "jane.doe@company.com",
  "password": "InitialPass123",
  "role": "HR Manager",
  "employeeId": "emp_01"
}
```

**Response `201`:**
```json
{
  "id": "u_01",
  "name": "Jane Doe",
  "workEmail": "jane.doe@company.com",
  "role": "HR Manager",
  "isActive": true,
  "employeeId": "emp_01",
  "createdAt": "2024-01-15T09:00:00Z"
}
```

**Response `409`:**
```json
{ "error": "Email already in use" }
```

**Response `422`:**
```json
{ "error": "employeeId is required" }
```

---

### PUT `/api/users/:id`
**Auth:** Admin

**Request Body:** _(all fields optional)_
```json
{
  "name": "Jane Smith",
  "role": "HR Payroll User",
  "isActive": false
}
```

**Response `200`:**
```json
{
  "id": "u_01",
  "name": "Jane Smith",
  "workEmail": "jane.doe@company.com",
  "role": "HR Payroll User",
  "isActive": false,
  "employeeId": "emp_01",
  "updatedAt": "2024-03-10T11:00:00Z"
}
```

**Response `403`:**
```json
{ "error": "Cannot elevate own role" }
```

---

### DELETE `/api/users/:id`
**Auth:** Admin

**Request Body:** _(none)_

**Response `200`:**
```json
{ "message": "User deactivated", "id": "u_01" }
```

**Response `403`:**
```json
{ "error": "Cannot deactivate the last active Admin" }
```

---

## Key Rules
- Employee link is required on every user account — a user cannot exist without a linked employee (FR-003)
- Work email must be unique across all user accounts
- Role must be one of the five canonical roles: Employee, HR Manager, HR Payroll User, HR Payroll Manager, Admin (§3)
- Admin cannot elevate their own role or deactivate the last active Admin account
- Deactivation is soft (`isActive = false`) — hard delete is not supported; historical payroll/audit references remain intact
- Password is hashed by `auth/services/password.service.ts` — this module never handles raw passwords
- Permissions take effect on the next authorization evaluation after role change (FR-003 postcondition)

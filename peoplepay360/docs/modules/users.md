# Module: users

## Overview
Admin-only module for managing user accounts and role assignments. Distinct from `employees` — a user account is a login identity, an employee record is HR master data. Depends on `auth` for the current session.

---

## Frontend — `client/src/features/users/`

### Components
| File | Responsibility |
|------|---------------|
| `components/UserTable.tsx` | Paginated table of all users with role badge and action buttons |
| `components/RoleSelector.tsx` | Dropdown to assign/change a user's role |

### Pages
| File | Responsibility |
|------|---------------|
| `pages/UserListPage.tsx` | Lists all users, search + filter by role, links to form |
| `pages/UserFormPage.tsx` | Create / edit user — name, email, role, active status |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useUsers.ts` | Fetches paginated user list, exposes search/filter params |
| `hooks/useUser.ts` | Fetches single user by ID for edit form |

### Services
| File | Responsibility |
|------|---------------|
| `services/users.service.ts` | `getUsers()`, `getUser(id)`, `createUser()`, `updateUser()`, `deleteUser()` |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/useUsers.test.ts` | Hook tests — fetch, filter, pagination |
| `tests/users.service.test.ts` | Mocked API call assertions |

---

## Backend — `server/src/modules/users/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/users.controller.ts` | CRUD handlers — list, get, create, update, delete |

### Services
| File | Responsibility |
|------|---------------|
| `services/users.service.ts` | Business logic — role validation, duplicate email check, account activation |

### Repositories
| File | Responsibility |
|------|---------------|
| `repositories/users.repository.ts` | All DB queries for users table — findAll, findById, findByEmail, create, update, delete |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/users.routes.ts` | Mounts handlers on `/api/users`, applies `auth.middleware` + `role-guard(Admin)` |

### Models
| File | Responsibility |
|------|---------------|
| `models/user.model.ts` | User schema — id, name, email, passwordHash, role, isActive, timestamps |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/users.service.test.ts` | Unit — role validation, duplicate email |
| `tests/users.integration.test.ts` | Integration — full CRUD against test DB |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users` | Admin | Paginated user list |
| GET | `/api/users/:id` | Admin | Single user |
| POST | `/api/users` | Admin | Create user |
| PUT | `/api/users/:id` | Admin | Update user / change role |
| DELETE | `/api/users/:id` | Admin | Deactivate user |

---

## Key Rules
- All routes are Admin-only via `role-guard` middleware
- Passwords are hashed by `auth/services/password.service.ts` — users module never handles raw passwords directly
- Deleting a user is a soft delete (sets `isActive = false`), not a hard delete
- A user's role must be one of the constants defined in `shared/constants/roles.ts`

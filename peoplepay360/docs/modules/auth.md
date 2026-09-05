# Module: auth

## SRS References
FR-001 (User Sign-In), FR-002 (Role-Based Navigation), FR-003 (Administrator User Management — provisioning side)

## Overview
Authenticates users via work email + password, establishes a role-filtered session, and enforces least-privilege access at both UI and service layers. All other modules consume the resolved `req.user` and role permissions that this module produces. No other module depends on auth internals.

## Roles (SRS §3)
| Role | Access Level |
|------|-------------|
| Employee | Own records only |
| HR Manager | HR operational data |
| HR Payroll User | Payroll read + compute |
| HR Payroll Manager | Full payroll + config |
| Admin | User management + all modules |

---

## Frontend — `client/src/features/auth/`

### Pages
| File | Responsibility |
|------|---------------|
| `pages/LoginPage.tsx` | Work Email + Password form, Forgot password? link, Sign In button (FR-001). Shows non-sensitive error on invalid credentials without clearing the form |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useLogin.ts` | Submits credentials, stores token + role in auth store, redirects to role-filtered workspace |
| `hooks/useLogout.ts` | Clears store + httpOnly cookie, redirects to login |
| `hooks/useCurrentUser.ts` | Returns `{ user, role, isAuthenticated }` from store — consumed by route guards and nav |

### Services
| File | Responsibility |
|------|---------------|
| `services/auth.service.ts` | `login(email, password)`, `logout()`, `refreshToken()` — raw API calls via `shared/services/httpClient.ts` |

### Store
| File | Responsibility |
|------|---------------|
| `store/auth.slice.ts` | Holds `accessToken`, `user`, `role`, `isAuthenticated` — access token in memory only, never localStorage |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/useLogin.test.ts` | Valid credentials → redirect; invalid → error retained on form; inactive account → clear error |
| `tests/auth.service.test.ts` | Mocked API — login, logout, refresh token calls |

---

## Backend — `server/src/modules/auth/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/auth.controller.ts` | POST /login, POST /logout, POST /refresh — validates input, delegates to service, returns tokens |

### Services
| File | Responsibility |
|------|---------------|
| `services/auth.service.ts` | Validates credentials against user record, checks `isActive`, loads role permissions, issues tokens |
| `services/token.service.ts` | Signs JWT access token (15 min TTL) and refresh token (7 day TTL), verifies and rotates |
| `services/password.service.ts` | bcrypt hash on user creation, bcrypt compare on login — called by users module on create |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/auth.routes.ts` | Public routes on `/api/auth` — no auth middleware applied here |

### Validators
| File | Responsibility |
|------|---------------|
| `validators/login.validator.ts` | Zod — email format required, password min 8 chars; rejects before controller |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/auth.service.test.ts` | Unit — valid login, inactive account blocked, wrong password, token generation |
| `tests/auth.integration.test.ts` | Integration — full login → refresh → logout flow against test DB |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | Validates credentials; returns access token + sets refresh cookie |
| POST | `/api/auth/logout` | Bearer | Invalidates refresh token server-side |
| POST | `/api/auth/refresh` | Refresh cookie | Issues new access token |

---

## Key Rules (SRS §FR-001, FR-002)
- Invalid credentials or inactive account → clear non-sensitive error, form retained (FR-001)
- Role is embedded in JWT payload — no extra DB call per request (FR-002)
- Access token in memory only; refresh token in httpOnly cookie — renderer never touches raw token storage
- Unauthorized API calls return 401/403 without leaking data — renderer-side permission checks are UX only, not authoritative (SRS §2.3.1)
- `auth.middleware.ts` and `role-guard.middleware.ts` in `server/src/middleware/` own per-request enforcement — this module only issues and validates tokens
- Session expiry, disabled user, and multiple role records are handled at service level (FR-001 edge cases)

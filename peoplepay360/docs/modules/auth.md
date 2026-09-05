# Module: auth

## Overview
Handles login, session management, JWT tokens, and role-based access. No other module depends on auth internals — all other modules consume the token and `req.user` that auth produces.

---

## Frontend — `client/src/features/auth/`

### Pages
| File | Responsibility |
|------|---------------|
| `pages/LoginPage.tsx` | Email + password form, calls `useLogin`, redirects to dashboard on success |

### Hooks
| File | Responsibility |
|------|---------------|
| `hooks/useLogin.ts` | Calls auth service, stores token in auth store, handles error state |
| `hooks/useLogout.ts` | Clears store + token, redirects to login |
| `hooks/useCurrentUser.ts` | Returns current user + role from store |

### Services
| File | Responsibility |
|------|---------------|
| `services/auth.service.ts` | `login(email, password)`, `logout()`, `refreshToken()` — raw API calls via httpClient |

### Store
| File | Responsibility |
|------|---------------|
| `store/auth.slice.ts` | Zustand/Redux slice — holds `token`, `user`, `role`, `isAuthenticated` |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/useLogin.test.ts` | Tests login success, wrong credentials, network error |
| `tests/auth.service.test.ts` | Mocked API call assertions |

---

## Backend — `server/src/modules/auth/`

### Controllers
| File | Responsibility |
|------|---------------|
| `controllers/auth.controller.ts` | `POST /login`, `POST /logout`, `POST /refresh` — delegates to service |

### Services
| File | Responsibility |
|------|---------------|
| `services/auth.service.ts` | Validates credentials, issues JWT access + refresh tokens |
| `services/token.service.ts` | Signs, verifies, and rotates JWT tokens |
| `services/password.service.ts` | bcrypt hash and compare |

### Routes
| File | Responsibility |
|------|---------------|
| `routes/auth.routes.ts` | Mounts controller handlers on `/api/auth` |

### Validators
| File | Responsibility |
|------|---------------|
| `validators/login.validator.ts` | Zod schema — email required, password min 8 chars |

### Tests
| File | Responsibility |
|------|---------------|
| `tests/auth.service.test.ts` | Unit — token generation, password hashing |
| `tests/auth.integration.test.ts` | Integration — full login/logout/refresh flow against test DB |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | Returns access + refresh tokens |
| POST | `/api/auth/logout` | Bearer | Invalidates refresh token |
| POST | `/api/auth/refresh` | Refresh token | Issues new access token |

---

## Key Rules
- Access token TTL: 15 minutes. Refresh token TTL: 7 days
- Refresh token stored in httpOnly cookie, access token in memory (auth store)
- `auth.middleware.ts` verifies access token on every protected route — owned by `server/src/middleware/`, not this module
- Role is embedded in the JWT payload — no extra DB call per request

# PRD.md — Product Requirements Document
## Finance Portfolio Tracker — Fintech Internship Assessment

---

## 1. Product Overview

Finance Portfolio Tracker is a web application that allows individual users to register, authenticate, and manage a personal investment portfolio. Each user can create, view, edit, and delete investment records, and view real-time computed analytics (total invested, current value, profit/loss, return percentage) across their entire portfolio.

The product is a **CRUD SaaS application** styled as a calm institutional fintech tool. It is not a real-time trading platform — all data is user-entered. The assessment grading rubric rewards correctness, code structure, security, fresh-clone reproducibility, and bonus items.

---

## 2. Goals & Success Criteria

| Goal | Measurable Success |
|---|---|
| Functional completeness | All 9 API endpoints implemented and reachable |
| Security | No cross-user data access possible; passwords hashed; JWT enforced |
| Design quality | UI matches Coinbase institutional design spec |
| Deployability | Fresh clone → README steps → running app with zero undocumented manual fixes |
| Bonus items | Pagination, unit tests, Clean Architecture all implemented |
| Deadline | Submitted before 4:00 PM on Day 2 |

---

## 3. Users & Personas

**Single persona: Individual Investor**
- Wants to track investments (stocks, crypto, mutual funds, etc.)
- Needs clear profit/loss visibility at a glance
- Values security — their financial data must be private
- Not a developer; expects a polished, trustworthy UI

---

## 4. Functional Requirements

### 4.1 Authentication

| ID | Requirement | Priority |
|---|---|---|
| AUTH-01 | User can register with name, email, password | Must Have |
| AUTH-02 | Passwords hashed with bcrypt (salt 10) before storage | Must Have |
| AUTH-03 | User can log in with email + password, receives JWT access token | Must Have |
| AUTH-04 | JWT payload contains `{ userId, email }`, expires in 1 hour | Must Have |
| AUTH-05 | Password is never returned in any API response | Must Have |
| AUTH-06 | Duplicate email registration returns 409 Conflict | Must Have |
| AUTH-07 | Invalid login credentials return 401 Unauthorized | Must Have |
| AUTH-08 | All `/investments` and `/portfolio` routes require valid JWT | Must Have |
| AUTH-09 | Token stored in httpOnly cookie (preferred) or localStorage (documented fallback) | Should Have |

### 4.2 Investment Management

| ID | Requirement | Priority |
|---|---|---|
| INV-01 | Authenticated user can create an investment record | Must Have |
| INV-02 | Investment fields: name, type, investedAmount, currentValue, purchaseDate | Must Have |
| INV-03 | Authenticated user can list their own investments (paginated) | Must Have |
| INV-04 | List supports filtering by `investmentType` and name `search` (ILIKE) | Must Have |
| INV-05 | List response includes `{ data[], meta{ total, page, limit, totalPages } }` | Must Have |
| INV-06 | Default page=1, limit=10, max limit=50 | Must Have |
| INV-07 | Authenticated user can retrieve a single investment by ID | Must Have |
| INV-08 | Attempting to retrieve another user's investment returns 404 (not 403) | Must Have |
| INV-09 | Authenticated user can update any of their investment fields | Must Have |
| INV-10 | Authenticated user can delete an investment (204 No Content) | Must Have |
| INV-11 | All investment queries include `WHERE userId = :currentUserId` in the service layer | Must Have |
| INV-12 | Malformed request bodies are rejected with 400 before reaching service layer | Must Have |

### 4.3 Portfolio Summary

| ID | Requirement | Priority |
|---|---|---|
| PORT-01 | `GET /portfolio/summary` returns computed stats across all user investments | Must Have |
| PORT-02 | Response shape: `{ totalInvested, currentValue, profit, profitPercentage }` | Must Have |
| PORT-03 | `profitPercentage = (profit / totalInvested) * 100`, rounded to 2 decimals | Must Have |
| PORT-04 | Zero total invested → `profitPercentage = 0` (no NaN/Infinity) | Must Have |
| PORT-05 | Summary is computed from ALL user investments (not paginated) | Must Have |

### 4.4 Frontend

| ID | Requirement | Priority |
|---|---|---|
| FE-01 | Login page with email/password form, error display, redirect on success | Must Have |
| FE-02 | Register page with name/email/password form, redirect to login on success | Must Have |
| FE-03 | Investments page with table of all investments | Must Have |
| FE-04 | "Add Investment" button opens a dialog with the create form | Must Have |
| FE-05 | Each table row has Edit and Delete actions | Must Have |
| FE-06 | Delete action shows confirmation AlertDialog before executing | Must Have |
| FE-07 | Portfolio summary stat cards shown above the investment table | Must Have |
| FE-08 | Pagination controls wired to backend paginated response | Must Have |
| FE-09 | Search bar and investment type filter wired to backend query params | Must Have |
| FE-10 | Unauthenticated users hitting `/investments` are redirected to `/login` | Must Have |
| FE-11 | Profit/loss values color-coded green (#05b169) positive, red (#cf202f) negative | Must Have |
| FE-12 | All financial numbers rendered in JetBrains Mono font | Must Have |
| FE-13 | Responsive layout (mobile collapses table columns, dialogs become sheets) | Should Have |

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Security | bcrypt password hashing, JWT auth, user-scoped data, no password in responses |
| Performance | Portfolio summary computed in a single aggregate DB query, not N+1 |
| Reliability | TypeORM migrations only (no synchronize), Neon pooled connection for deploy |
| Code Quality | NestJS Clean Architecture (Controller → Service → Repository), class-validator DTOs |
| Testability | 3 unit test files on services; Jest mocks for TypeORM repositories |
| Documentation | README with setup, env vars, API docs, migrations, known limitations, live links |

---

## 6. API Requirements (Full Contract)

### POST /auth/register
```
Request:  { name: string, email: string, password: string }
Response: 201 { id, name, email, createdAt } (no password field)
Errors:   409 if email already exists
          400 if validation fails
```

### POST /auth/login
```
Request:  { email: string, password: string }
Response: 200 { accessToken: string, user: { id, name, email } }
Errors:   401 if credentials invalid
```

### GET /investments
```
Auth:     Bearer JWT required
Query:    page (default 1), limit (default 10, max 50),
          investmentType (optional), search (optional ILIKE on name)
Response: 200 {
  data: Investment[],
  meta: { total: number, page: number, limit: number, totalPages: number }
}
```

### POST /investments
```
Auth:     Bearer JWT required
Request:  { investmentName, investmentType, investedAmount, currentValue, purchaseDate }
Response: 201 Investment
Errors:   400 validation fail
```

### GET /investments/:id
```
Auth:     Bearer JWT required
Response: 200 Investment
Errors:   404 if not found OR not owned by requester
```

### PUT /investments/:id
```
Auth:     Bearer JWT required
Request:  { investmentName?, investmentType?, investedAmount?, currentValue?, purchaseDate? }
Response: 200 updated Investment
Errors:   404 if not found or not owned
          400 if validation fails
```

### DELETE /investments/:id
```
Auth:     Bearer JWT required
Response: 204 No Content
Errors:   404 if not found or not owned
```

### GET /portfolio/summary
```
Auth:     Bearer JWT required
Response: 200 {
  totalInvested: number,
  currentValue: number,
  profit: number,
  profitPercentage: number  (2 decimal places, 0 if totalInvested = 0)
}
```

---

## 7. Database Schema

### users table
| Column | Type | Constraint |
|---|---|---|
| id | uuid | PK, default uuid_generate_v4() |
| name | varchar | not null |
| email | varchar | unique, not null |
| password | varchar | not null (bcrypt hash) |
| createdAt | timestamp | default now() |
| updatedAt | timestamp | default now(), auto-update |

### investments table
| Column | Type | Constraint |
|---|---|---|
| id | uuid | PK |
| userId | uuid | FK → users.id, not null, indexed |
| investmentName | varchar | not null |
| investmentType | varchar | not null |
| investedAmount | numeric(14,2) | not null |
| currentValue | numeric(14,2) | not null |
| purchaseDate | date | not null |
| createdAt | timestamp | default now() |
| updatedAt | timestamp | default now(), auto-update |

---

## 8. Architecture Requirements

### Backend Module Structure
```
app.module.ts
├── AuthModule
│   ├── AuthController (routing + validation)
│   ├── AuthService (business logic: register, login, token sign)
│   └── JwtStrategy + JwtAuthGuard
├── UsersModule
│   ├── UsersService (findByEmail, createUser)
│   └── User entity
├── InvestmentsModule
│   ├── InvestmentsController (routing, guard, DTOs)
│   ├── InvestmentsService (CRUD + pagination + ownership)
│   └── Investment entity
├── PortfolioModule
│   ├── PortfolioController (routing, guard)
│   └── PortfolioService (aggregate calculations)
└── CommonModule
    ├── GlobalExceptionFilter
    ├── TransformInterceptor (standardized response envelope)
    └── PaginationDto
```

### Unit Tests Required
1. `investments.service.spec.ts` — pagination math, ownership scoping
2. `portfolio.service.spec.ts` — profit calc, zero-invested edge case
3. `auth.service.spec.ts` — bcrypt verify, duplicate email handling

---

## 9. Deployment Requirements

| Target | Platform | Config |
|---|---|---|
| Backend | Render or Railway (Docker) | `DATABASE_URL` (Neon pooled), `JWT_SECRET`, `PORT` |
| Frontend | Vercel | `NEXT_PUBLIC_API_URL` (deployed backend URL) |
| Database | Neon PostgreSQL | Pooled connection string (`-pooler` hostname) |

**CORS:** NestJS backend must explicitly allow the deployed Vercel frontend origin. No wildcard.

---

## 10. Known Limitations (Documented Tradeoffs)

| Limitation | Reason | Mitigation |
|---|---|---|
| JWT-only, no refresh tokens | Time constraint | 1hr expiry stated in README; user must re-login after expiry |
| localStorage token (if httpOnly cookie not implemented) | Simpler frontend implementation | Documented in README as known XSS risk; httpOnly cookie recommended path noted |
| No real-time price data | Out of scope | All values are user-entered; noted in README |
| No email verification | Out of scope for assessment | Noted in README |
| Single-tenant architecture | Simple CRUD scope | Noted; multi-tenant would add schema isolation |

---

## 11. Definition of Done

- [ ] Fresh clone → README → runs locally with zero undocumented steps
- [ ] Register → login → add/edit/delete investment → summary updates correctly (E2E manual test)
- [ ] User A cannot access User B's investments
- [ ] Pagination returns correct `meta.totalPages` for 15+ seeded investments
- [ ] `npm run test` passes in `/backend`
- [ ] Migrations run against fresh Neon DB without errors
- [ ] Backend deployed and reachable via HTTPS
- [ ] Frontend on Vercel calls deployed backend (CORS confirmed working)
- [ ] README complete: setup, env vars, API docs, migrations, known limitations, live links
- [ ] GitHub repo public or shared with reviewer

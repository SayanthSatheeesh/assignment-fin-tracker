# TASK.md — Atomic Task List
## Finance Portfolio Tracker — Execution Checklist

> Fine-grained tasks. Mark `[x]` when done. Sequential within phases; phases 2+3 and 5+6 can run in parallel.

---

## PHASE 0: Planning (Pre-build)

- [x] Read DESIGN-coinbase.md in full
- [x] Create BRAIN.md
- [x] Create UI-UX.md
- [x] Create PRD.md
- [x] Create PROGRESS.md
- [x] Create TASK.md
- [x] Create WEBFLOW.md

---

## PHASE 1: Repository & Infrastructure (Blocking — do first)

### 1.1 Monorepo Scaffold
- [x] Create `finance-portfolio-tracker/` root directory
- [x] `git init` at root
- [x] Create `AGENTS.md` at root (copy from spec appendix)
- [x] Create `.gemini/antigravity/brain/decisions.md` (copy seed content from spec)
- [x] Create `.gitignore` (covers node_modules, .env, dist, .next)

### 1.2 Docker Compose (local dev)
- [x] Write `docker-compose.yml`:
  - `postgres` service: `postgres:16-alpine`, port 5432, volume for persistence
  - `backend` service: build from `./backend`, depends on postgres, env_file
  - Optional `frontend` service: build from `./frontend`
- [ ] Verify `docker compose up -d postgres` works

### 1.3 Backend Bootstrap
- [ ] `cd backend && nest new . --package-manager npm --strict`
- [ ] Install deps: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`, `typeorm`, `pg`, `@nestjs/typeorm`, `class-validator`, `class-transformer`, `@nestjs/config`
- [ ] Install dev deps: `@types/bcrypt`, `@types/passport-jwt`
- [ ] Configure `nest-cli.json` with `entryFile: "main"`
- [ ] Write `backend/.env.example`:
  ```
  DATABASE_URL=postgres://user:pass@localhost:5432/portfolio
  JWT_SECRET=your-secret-here
  PORT=3000
  FRONTEND_URL=http://localhost:3001
  ```
- [ ] Configure `ConfigModule.forRoot()` in `app.module.ts`
- [ ] Configure TypeORM in `app.module.ts` (migrations: true, synchronize: false, pooled Neon when deployed)
- [ ] Add migration scripts to `package.json`:
  - `"migration:generate": "typeorm migration:generate"`
  - `"migration:run": "typeorm migration:run"`
  - `"migration:revert": "typeorm migration:revert"`
- [ ] Run `npm run start:dev` — verify clean boot

### 1.4 Database Entities
- [ ] Create `src/users/entities/user.entity.ts`:
  - `id` uuid PK
  - `name` varchar not null
  - `email` varchar unique not null
  - `password` varchar not null, `select: false`
  - `createdAt`, `updatedAt` timestamps
- [ ] Create `src/investments/entities/investment.entity.ts`:
  - `id` uuid PK
  - `userId` uuid FK → users.id, indexed
  - `investmentName` varchar not null
  - `investmentType` varchar not null
  - `investedAmount` numeric(14,2) not null
  - `currentValue` numeric(14,2) not null
  - `purchaseDate` date not null
  - `createdAt`, `updatedAt` timestamps
- [ ] Generate initial migration: `npm run migration:generate -- src/migrations/InitSchema`
- [ ] Run migration against local DB: `npm run migration:run`
- [ ] Run migration against Neon: set `DATABASE_URL` to Neon pooled string, re-run

### 1.5 Frontend Bootstrap
- [ ] `cd frontend && npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"`
- [ ] Move to `src/` layout if not default
- [ ] Initialize shadcn/ui: `npx shadcn@latest init`
  - Style: Default | Base color: Neutral | CSS variables: Yes
- [ ] Add required shadcn components:
  - `button`, `input`, `form`, `table`, `dialog`, `alert-dialog`, `badge`, `card`, `separator`
- [ ] Install `@hookform/resolvers`, `react-hook-form`, `zod`
- [ ] Install `next/font` or configure Google Fonts for Inter + JetBrains Mono
- [ ] Configure `tailwind.config.ts` with Coinbase design tokens (see UI-UX.md §1)
- [ ] Add CSS custom properties to `globals.css`
- [ ] Write `frontend/.env.example`:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3000
  ```
- [ ] Verify `npm run dev` boots at port 3001 (or 3000 if backend not running)

---

## PHASE 2: Backend — Auth Module

### 2.1 Module Setup
- [ ] Create `src/auth/auth.module.ts`
- [ ] Create `src/users/users.module.ts` (export `UsersService`)
- [ ] Register `UsersModule` in `app.module.ts`
- [ ] Register `AuthModule` in `app.module.ts`

### 2.2 Users Service
- [ ] Create `src/users/entities/user.entity.ts` (if not done in Phase 1)
- [ ] Create `src/users/users.service.ts`:
  - `findByEmail(email)` — returns user WITH password (select override)
  - `findById(id)` — returns user without password
  - `create({ name, email, hashedPassword })` — returns saved user

### 2.3 Auth DTOs
- [ ] Create `src/auth/dto/register.dto.ts`:
  - `@IsString() @IsNotEmpty() name`
  - `@IsEmail() email`
  - `@IsString() @MinLength(6) password`
- [ ] Create `src/auth/dto/login.dto.ts`:
  - `@IsEmail() email`
  - `@IsString() @IsNotEmpty() password`

### 2.4 Auth Service
- [ ] Create `src/auth/auth.service.ts`:
  - `register(dto)`: check duplicate email (409), bcrypt hash (rounds=10), call usersService.create, return user without password
  - `login(dto)`: find user, bcrypt compare (401 if fail), sign JWT `{ userId, email }` exp 1h, return `{ accessToken, user }`
  - `validateUser(payload)`: used by JWT strategy

### 2.5 JWT Setup
- [ ] Create `src/auth/strategies/jwt.strategy.ts`:
  - `ExtractJwt.fromAuthHeaderAsBearerToken()`
  - Validate payload, return `{ userId, email }`
- [ ] Create `src/auth/guards/jwt-auth.guard.ts`:
  - Extends `AuthGuard('jwt')`
- [ ] Create `src/auth/decorators/current-user.decorator.ts`:
  - `createParamDecorator` extracting `req.user`
- [ ] Register `JwtModule.registerAsync` in `auth.module.ts` using `ConfigService`

### 2.6 Auth Controller
- [ ] Create `src/auth/auth.controller.ts`:
  - `POST /auth/register` → 201
  - `POST /auth/login` → 200

### 2.7 Auth Tests
- [ ] Create `src/auth/auth.service.spec.ts`:
  - Mock `UsersService` and `JwtService`
  - Test: register with duplicate email throws ConflictException
  - Test: register hashes password (verify bcrypt.hash called)
  - Test: login with wrong password throws UnauthorizedException
  - Test: login with correct credentials returns accessToken
- [ ] `npm run test -- --testPathPattern=auth` passes

---

## PHASE 3: Backend — Investments Module

### 3.1 Common Layer
- [ ] Create `src/common/pagination/pagination.dto.ts`:
  - `@Type(() => Number) @IsOptional() @IsInt() @Min(1) page` default 1
  - `@Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(50) limit` default 10
- [ ] Create `src/common/filters/http-exception.filter.ts` (global exception filter)
- [ ] Create `src/common/interceptors/transform.interceptor.ts` (wrap responses)
- [ ] Register both globally in `main.ts`

### 3.2 Investment DTOs
- [ ] Create `src/investments/dto/create-investment.dto.ts`:
  - `@IsString() @IsNotEmpty() investmentName`
  - `@IsString() @IsNotEmpty() investmentType`
  - `@IsNumber() @IsPositive() investedAmount`
  - `@IsNumber() @IsPositive() currentValue`
  - `@IsDateString() purchaseDate`
- [ ] Create `src/investments/dto/update-investment.dto.ts` (PartialType of CreateInvestmentDto)
- [ ] Create `src/investments/dto/query-investment.dto.ts` (extends PaginationDto + investmentType? + search?)

### 3.3 Investments Service
- [ ] Create `src/investments/investments.service.ts`:
  - `create(userId, dto)` — always sets userId from token, never from request body
  - `findAll(userId, query)` — paginated, ILIKE search, type filter, returns `{ data, meta }`
  - `findOne(userId, id)` — 404 if not found OR userId mismatch
  - `update(userId, id, dto)` — findOne first (triggers ownership check), then save
  - `remove(userId, id)` — findOne first, then delete, return void (204)

### 3.4 Investments Controller
- [ ] Create `src/investments/investments.controller.ts`:
  - `@UseGuards(JwtAuthGuard)` at class level
  - `@CurrentUser()` on all methods
  - POST `/investments` → 201
  - GET `/investments` → 200 with paginated meta
  - GET `/investments/:id` → 200
  - PUT `/investments/:id` → 200
  - DELETE `/investments/:id` → 204

### 3.5 Investments Tests
- [ ] Create `src/investments/investments.service.spec.ts`:
  - Mock `Repository<Investment>` via `getRepositoryToken`
  - Test: `create` always passes userId from argument (not body)
  - Test: `findAll` offset = (page-1) * limit
  - Test: `findAll` totalPages = Math.ceil(total / limit)
  - Test: `findOne` returns 404 when userId doesn't match record
- [ ] `npm run test -- --testPathPattern=investments` passes

---

## PHASE 4: Backend — Portfolio Module + Final Tests

### 4.1 Portfolio Service
- [ ] Create `src/portfolio/portfolio.service.ts`:
  - `getSummary(userId)`:
    - Single SQL aggregate query: `SELECT SUM(investedAmount), SUM(currentValue) FROM investments WHERE userId = :userId`
    - Compute: `profit = currentValue - totalInvested`
    - Compute: `profitPercentage = totalInvested === 0 ? 0 : parseFloat(((profit / totalInvested) * 100).toFixed(2))`
    - Return `{ totalInvested, currentValue, profit, profitPercentage }`

### 4.2 Portfolio Controller
- [ ] Create `src/portfolio/portfolio.controller.ts`:
  - `@UseGuards(JwtAuthGuard)` at class level
  - GET `/portfolio/summary` → 200

### 4.3 Portfolio Tests
- [ ] Create `src/portfolio/portfolio.service.spec.ts`:
  - Mock repository
  - Test: `getSummary` returns correct profit when invested > 0
  - Test: `getSummary` returns profitPercentage = 0 when totalInvested = 0 (no NaN)
  - Test: `getSummary` rounds profitPercentage to 2 decimals
  - Test: `getSummary` correctly handles negative profit (loss)

### 4.4 Backend Integration Check
- [ ] All 3 spec files pass: `npm run test`
- [ ] `npm run lint` passes with zero errors
- [ ] Manual test all 9 endpoints via curl or Postman
- [ ] Verify cross-user isolation: User A token cannot GET/PUT/DELETE User B's investment

---

## PHASE 5: Frontend — Auth Pages

### 5.1 Shared Infrastructure
- [ ] Create `src/lib/api-client.ts`:
  - Base URL from `process.env.NEXT_PUBLIC_API_URL`
  - Attaches `Authorization: Bearer <token>` from cookie/localStorage
  - Typed response helpers: `apiGet`, `apiPost`, `apiPut`, `apiDelete`
- [ ] Create `src/lib/auth-context.tsx`:
  - `AuthProvider` with `user`, `token`, `login()`, `logout()` state
  - Persist token to localStorage (or httpOnly cookie via `/api/auth/*` route handler)
- [ ] Update `src/app/layout.tsx`:
  - Load Inter + JetBrains Mono (next/font)
  - Wrap with `<AuthProvider>`
  - Set `<html lang="en">` and meta tags
- [ ] Create `src/middleware.ts` for route protection:
  - Unauthenticated → redirect `/investments` to `/login`
  - Authenticated → redirect `/login`, `/register` to `/investments`

### 5.2 Login Page
- [ ] Create `src/app/login/page.tsx`:
  - Dark hero band full-bleed (`bg-surface-dark min-h-screen`)
  - Centered card (`bg-surface-dark-elevated rounded-xl p-10 w-[400px]`)
  - Logo wordmark top
  - "Welcome back" heading (Inter 400 32px white)
  - Subtext (Inter 14px on-dark-soft)
  - shadcn Form with email + password inputs (dark input spec)
  - Primary pill button "Sign In" (full width)
  - Inline error display on failure
  - "Don't have an account? Register" link

### 5.3 Register Page
- [ ] Create `src/app/register/page.tsx`:
  - Same dark hero layout
  - Card with: Logo, "Create account" heading, name + email + password fields
  - "Create Account" primary pill button
  - Redirect to `/login` on success
  - Inline error display

### 5.4 Root Redirect
- [ ] Create `src/app/page.tsx`:
  - Server component that reads auth state
  - `redirect('/investments')` if authenticated
  - `redirect('/login')` if not

---

## PHASE 6: Frontend — Investments Page

### 6.1 Types
- [ ] Create `src/types/investment.ts`:
  - `Investment` interface matching entity
  - `PaginatedResponse<T>` generic
  - `PortfolioSummary` interface

### 6.2 Components
- [ ] Create `src/components/portfolio-summary-card.tsx`:
  - Props: `{ totalInvested, currentValue, profit, profitPercentage }`
  - 4 stat cards in flex row
  - All values in `font-mono`
  - Profit value: `text-semantic-up` if ≥ 0, `text-semantic-down` if < 0

- [ ] Create `src/components/investment-table.tsx`:
  - shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
  - Columns: Name, Type (badge), Invested, Current Val, Profit/Loss, Date, Actions
  - Profit/Loss cell: color-coded, font-mono
  - Actions: Edit icon button, Delete icon button
  - Props: `investments`, `onEdit`, `onDelete`

- [ ] Create `src/components/investment-form.tsx`:
  - shadcn `Dialog` (or `Drawer` on mobile)
  - shadcn `Form` + react-hook-form + zod schema
  - Fields: Name, Type, Invested Amount, Current Value, Purchase Date
  - `mode: "create" | "edit"`, `initialValues?` for edit prefill
  - Submit calls `onSubmit(data)`

- [ ] Create `src/components/pagination-controls.tsx`:
  - Previous / Next + page numbers (secondary pill buttons)
  - Active page: primary blue pill
  - Props: `{ page, totalPages, onPageChange }`

### 6.3 Investments Page Assembly
- [ ] Create `src/app/investments/page.tsx`:
  - Fetch `GET /portfolio/summary` → render `<PortfolioSummaryCard />`
  - Fetch `GET /investments` with query params (page, limit, type, search)
  - Toolbar: Title | search pill | type filter | Add button
  - `<InvestmentTable>` with data
  - `<PaginationControls>` below table
  - Add dialog: opens `InvestmentForm` in create mode → POST → refetch
  - Edit dialog: opens `InvestmentForm` in edit mode with row data → PUT → refetch
  - Delete: AlertDialog → DELETE → refetch
  - All state managed with `useState` + `useEffect` or React Query

---

## PHASE 7: Validation & Polish

- [ ] Test Login → redirects to /investments
- [ ] Test Register → redirects to /login → login works
- [ ] Add investment → appears in table → summary updates
- [ ] Edit investment → table row updates
- [ ] Delete investment → row removed, summary updates
- [ ] Search by name → filters table
- [ ] Filter by type → filters table
- [ ] Pagination → correct pages with 15+ records
- [ ] Two-user isolation test (manual): User A's investments not visible to User B
- [ ] All numbers render in JetBrains Mono
- [ ] Profit/loss: green for positive, red for negative (text only)
- [ ] Mobile: table readable, dialog is bottom sheet
- [ ] `npm run build` in frontend — zero errors

---

## PHASE 8: Docker

- [ ] Write `backend/Dockerfile`:
  ```dockerfile
  FROM node:20-alpine AS deps
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci

  FROM node:20-alpine AS build
  WORKDIR /app
  COPY --from=deps /app/node_modules ./node_modules
  COPY . .
  RUN npm run build

  FROM node:20-alpine AS runtime
  WORKDIR /app
  COPY --from=build /app/dist ./dist
  COPY --from=build /app/node_modules ./node_modules
  EXPOSE 3000
  CMD ["node", "dist/main"]
  ```
- [ ] Write `frontend/Dockerfile` (Next.js standalone output)
- [ ] `docker build -t portfolio-backend ./backend` succeeds
- [ ] `docker build -t portfolio-frontend ./frontend` succeeds
- [ ] `docker compose up` brings up full stack locally

---

## PHASE 9: Deployment

### 9.1 Backend (Render or Railway)
- [ ] Connect repo to Render/Railway
- [ ] Set environment variables:
  - `DATABASE_URL` — Neon pooled connection string
  - `JWT_SECRET` — strong random secret (32+ chars)
  - `PORT` — 3000
  - `FRONTEND_URL` — Vercel deployed URL
- [ ] Confirm build succeeds on platform
- [ ] Run migrations via deploy hook or manual `npm run migration:run`
- [ ] Test `GET /health` or `GET /` returns 200
- [ ] Copy backend URL

### 9.2 Frontend (Vercel)
- [ ] Import GitHub repo in Vercel
- [ ] Set `NEXT_PUBLIC_API_URL` to deployed backend URL
- [ ] Deploy
- [ ] Test login from live URL → CORS works
- [ ] Full E2E smoke test on live URLs

### 9.3 Smoke Test Checklist
- [ ] Register a new user on live site
- [ ] Login with that user
- [ ] Add 15 investments
- [ ] Verify pagination shows correct `totalPages`
- [ ] Edit an investment
- [ ] Delete an investment
- [ ] Portfolio summary updates correctly
- [ ] Second account cannot see first account's data

---

## PHASE 10: README & Submission

- [ ] Write `README.md`:
  - Section 1: Project overview (1 paragraph)
  - Section 2: Local setup (step by step, fresh clone assumed)
  - Section 3: Environment variables (full list, backend + frontend)
  - Section 4: API documentation table (all 9 endpoints)
  - Section 5: Migration instructions (`npm run migration:run`)
  - Section 6: Known limitations (JWT-only, localStorage vs cookie, no real-time prices)
  - Section 7: Live deployment links
- [ ] GitHub repo: set to public
- [ ] Final check: all Phase 1–9 tasks checked ✅
- [ ] Submit before 4:00 PM deadline ✅

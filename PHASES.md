# PHASES.md — Macro-Detailed Phase Execution Manual
## Finance Portfolio Tracker — Full Stack Fintech Assessment

> **How to use this document:** Every phase is self-contained. Each sub-section covers *why* the step exists, *exactly what* to produce (with full code snippets where it matters), and *how to verify* it before moving on. Do not skip verification gates — they prevent cascading failures in later phases.

---

## Phase Map Overview

```
PHASE 0  → Planning docs (DONE)
PHASE 1  → Repo scaffold + DB entities + migrations          [BLOCKING — nothing else starts until done]
PHASE 2  → Backend: Auth module                              [starts after Phase 1]
PHASE 3  → Backend: Investments module                       [starts after Phase 2]
PHASE 4  → Backend: Portfolio module + all unit tests        [starts after Phase 3]
PHASE 5  → Frontend: Scaffold + design tokens + auth pages   [can start parallel with Phase 2]
PHASE 6  → Frontend: Investments page + all components       [starts after Phase 5 + Phase 4]
PHASE 7  → Integration: E2E validation + polish              [starts after Phase 6]
PHASE 8  → Docker: Dockerfiles + compose                     [starts after Phase 7]
PHASE 9  → Deployment: Render/Railway + Vercel               [starts after Phase 8]
PHASE 10 → README + submission                               [final gate]
```

**Parallelizable:** Phases 2+5 can run side-by-side (backend auth + frontend scaffold).  
**Sequential gates:** Phase 1 must be 100% done before Phase 2. Phase 4 must be done before Phase 6.

---

---

# PHASE 0 — Planning & Context Loading
**Status:** ✅ Complete  
**Duration:** 30 min  
**Blocking:** Yes — no code before this is done

## Goal
Lock in the design system, architecture, and API contract so every subsequent phase builds toward the same target. Zero ambiguity = zero rework.

## Deliverables (all created)
| File | Purpose |
|---|---|
| `BRAIN.md` | Master context — tokens, stack, security rules, decisions |
| `UI-UX.md` | Full design spec — every page, every component, every color |
| `PRD.md` | Product requirements — all 9 API routes, schema, architecture |
| `PROGRESS.md` | Live build tracker |
| `TASK.md` | Atomic checklist |
| `WEBFLOW.md` | Screen flows + ASCII wireframes |
| `PHASES.md` | This document |

## Verification Gate ✅
- All 7 planning docs exist and are readable
- Design tokens from `DESIGN-coinbase.md` are mapped in `UI-UX.md`
- All 9 API endpoints are defined in `PRD.md` with exact request/response shapes
- **Proceed to Phase 1**

---

---

# PHASE 1 — Repository Scaffold, Database Entities & Migrations
**Status:** ⬜ Not started  
**Duration:** ~2 hours  
**Blocking:** Yes — all backend and frontend work depends on entities + migrations existing

## Goal
Create the complete monorepo skeleton. Define TypeORM entities. Generate and run migrations against both local Postgres and Neon. Bootstrap both NestJS and Next.js apps to a clean `npm run start:dev` / `npm run dev` state.

---

## 1.1 — Root Monorepo Structure

### Commands
```bash
# From your workspace root (c:\vibe-codee\assignment_samay or wherever)
mkdir finance-portfolio-tracker
cd finance-portfolio-tracker
git init
```

### Files to create at root level

**`.gitignore`** (root):
```
node_modules/
dist/
.next/
.env
*.env.local
.DS_Store
coverage/
```

**`AGENTS.md`** (copy exactly from spec appendix):
```markdown
# Agent Rules — Finance Portfolio Tracker

- Monorepo: `backend/` (NestJS + TypeORM + Postgres/Neon), `frontend/` (Next.js App Router + shadcn/ui).
- Never set `synchronize: true` on the TypeORM connection — migrations only.
- Every investments/portfolio query MUST be scoped to the authenticated user's id. No exceptions.
- Controllers stay thin: validation + routing only. Business logic lives in services.
- Use class-validator DTOs for all request bodies.
- JWT only, 1-hour expiry, no refresh token flow (documented tradeoff, not a bug).
- Use the pooled Neon connection string for any deployed environment.
- Run `npm run lint` and `npm run test` in backend/ before considering a module "done".
- Record any non-obvious architectural decision in .gemini/antigravity/brain/decisions.md as you go.
```

**`.gemini/antigravity/brain/decisions.md`** (create folder path):
```markdown
# Architectural Decisions Log

- 2026-07-20: Backend = NestJS + TypeORM + Neon Postgres. Frontend = Next.js App Router + shadcn/ui. Monorepo.
- 2026-07-20: JWT-only auth, no refresh tokens — deadline-driven scope decision, documented in README as a known limitation.
- 2026-07-20: Deploy split — frontend on Vercel, backend on Render/Railway — because Vercel does not support long-running NestJS servers.
- 2026-07-20: Neon pooled connection string required for deployed backend to avoid exhausting connection limits under TypeORM's default pool.
```

**`docker-compose.yml`** (full content):
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: portfolio_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: portfolio_user
      POSTGRES_PASSWORD: portfolio_pass
      POSTGRES_DB: portfolio_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U portfolio_user -d portfolio_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: portfolio_backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://portfolio_user:portfolio_pass@postgres:5432/portfolio_db
      JWT_SECRET: local_dev_secret_change_in_prod
      PORT: 3000
      FRONTEND_URL: http://localhost:3001
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: portfolio_frontend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Verification
```bash
docker compose up -d postgres
docker compose ps   # postgres should show "healthy"
```

---

## 1.2 — Backend: NestJS Bootstrap

### Commands
```bash
cd finance-portfolio-tracker
npm install -g @nestjs/cli   # if not installed
nest new backend --package-manager npm --strict
cd backend
```

### Install all production dependencies
```bash
npm install \
  @nestjs/config \
  @nestjs/jwt \
  @nestjs/passport \
  @nestjs/typeorm \
  passport \
  passport-jwt \
  bcrypt \
  typeorm \
  pg \
  class-validator \
  class-transformer \
  reflect-metadata
```

### Install dev dependencies
```bash
npm install -D \
  @types/bcrypt \
  @types/passport-jwt \
  @types/pg
```

### `backend/.env.example` (full file)
```env
# Database
DATABASE_URL=postgres://portfolio_user:portfolio_pass@localhost:5432/portfolio_db

# Auth
JWT_SECRET=replace_with_strong_random_secret_min_32_chars

# Server
PORT=3000

# CORS
FRONTEND_URL=http://localhost:3001
```

### `backend/.env` (local dev — copy from .env.example, never commit)
Same as above with real values filled in.

### `backend/nest-cli.json`
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "plugins": ["@nestjs/swagger"]
  }
}
```

### `backend/tsconfig.json` — ensure strict mode
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### `backend/package.json` — add migration scripts to `scripts` block
```json
{
  "scripts": {
    "build": "nest build",
    "start": "node dist/main",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/config/typeorm.config.ts",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d src/config/typeorm.config.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/config/typeorm.config.ts",
    "migration:show": "typeorm-ts-node-commonjs migration:show -d src/config/typeorm.config.ts"
  }
}
```

### `backend/src/config/typeorm.config.ts` (standalone DataSource for CLI)
```typescript
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', '..', 'migrations', '*.{ts,js}')],
  synchronize: false,   // NEVER true
  logging: process.env.NODE_ENV === 'development',
});

export default AppDataSource;
```

### `backend/src/app.module.ts` (full initial content)
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: config.get<string>('DATABASE_URL')?.includes('neon.tech')
          ? { rejectUnauthorized: false }
          : false,
        entities: [join(__dirname, '**', '*.entity.{ts,js}')],
        migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
        synchronize: false,  // NEVER change this
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class AppModule {}
```

### `backend/src/main.ts` (full content)
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,         // auto-transform types (string → number for query params)
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
```

### Verification
```bash
npm run start:dev
# Should print: Backend running on http://localhost:3000
# GET http://localhost:3000 should return 404 (no root route yet — that's fine)
```

---

## 1.3 — Database: TypeORM Entities

### `backend/src/users/entities/user.entity.ts`
```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Investment } from '../../investments/entities/investment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', nullable: false, select: false })
  @Exclude()
  password: string;

  @OneToMany(() => Investment, (investment) => investment.user)
  investments: Investment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

> **Why `select: false`?** TypeORM will never include `password` in query results unless explicitly requested with `addSelect('user.password')`. The `@Exclude()` decorator is a second layer of protection via `class-transformer` serialization. Both are needed.

### `backend/src/investments/entities/investment.entity.ts`
```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne,
  JoinColumn, Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('investments')
@Index(['userId'])   // explicit index — every query filters by userId
export class Investment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, (user) => user.investments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', nullable: false })
  investmentName: string;

  @Column({ type: 'varchar', nullable: false })
  investmentType: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: false })
  investedAmount: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: false })
  currentValue: number;

  @Column({ type: 'date', nullable: false })
  purchaseDate: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

> **Why `@Index(['userId'])`?** The two most frequent queries — `findAll` and `getSummary` — both have `WHERE userId = ?`. Without an index this is a full table scan as the table grows. The index makes these O(log n) instead of O(n).

---

## 1.4 — Migrations

### Generate the initial migration
```bash
cd backend

# Ensure your local .env has DATABASE_URL pointing to local postgres
npm run migration:generate -- migrations/InitSchema
```

This creates `migrations/[timestamp]-InitSchema.ts`. Review it — it should contain:
- `CREATE TABLE users` with all 6 columns
- `CREATE TABLE investments` with all 9 columns
- `CREATE INDEX IDX_... ON investments(userId)`
- A foreign key from `investments.userId` → `users.id`
- `uuid-ossp` extension call if using `uuid_generate_v4()` default

### Run migration against local DB
```bash
npm run migration:run
# Output: "Migration InitSchema has been executed successfully."
```

### Run migration against Neon (production)
```bash
# Temporarily set DATABASE_URL to Neon pooled connection string
DATABASE_URL=postgres://[user]:[pass]@[region]-pooler.neon.tech/[dbname]?sslmode=require npm run migration:run
```

> **Neon gotcha:** The pooled hostname contains `-pooler` in it (e.g., `ep-xxx-pooler.us-east-2.aws.neon.tech`). The direct hostname (without `-pooler`) has a low connection limit that TypeORM's default connection pool will exhaust immediately. Always use the pooled string.

### Verification
```bash
# Connect to local DB
psql postgres://portfolio_user:portfolio_pass@localhost:5432/portfolio_db

\dt          # should show: users, investments, migrations
\d users     # verify columns + constraints
\d investments  # verify columns + FK + index
```

---

## 1.5 — Frontend: Next.js Bootstrap

### Commands
```bash
cd finance-portfolio-tracker
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint
cd frontend
```

### Initialize shadcn/ui
```bash
npx shadcn@latest init
# Prompts:
#   Style:       Default
#   Base color:  Neutral
#   CSS vars:    Yes
```

### Add all required shadcn components (single command)
```bash
npx shadcn@latest add button input form label \
  table dialog alert-dialog badge card separator \
  toast skeleton drawer
```

### Install form + validation libraries
```bash
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react   # icons — used for Edit, Delete, Search icons
```

### `frontend/.env.example`
```env
# Backend API base URL (no trailing slash)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Configure fonts in `frontend/src/app/layout.tsx`
```tsx
import { Inter } from 'next/font/google';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata = {
  title: 'Finance Portfolio Tracker',
  description: 'Track your investment portfolio with clarity.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
```

### `frontend/tailwind.config.ts` — full Coinbase token config
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:             '#0052ff',
        'primary-active':    '#003ecc',
        'primary-disabled':  '#a8b8cc',
        ink:                 '#0a0b0d',
        'body-text':         '#5b616e',
        muted:               '#7c828a',
        'muted-soft':        '#a8acb3',
        hairline:            '#dee1e6',
        'hairline-soft':     '#eef0f3',
        canvas:              '#ffffff',
        'surface-soft':      '#f7f7f7',
        'surface-strong':    '#eef0f3',
        'surface-dark':      '#0a0b0d',
        'surface-dark-elevated': '#16181c',
        'on-dark':           '#ffffff',
        'on-dark-soft':      '#a8acb3',
        'semantic-up':       '#05b169',
        'semantic-down':     '#cf202f',
        'accent-yellow':     '#f4b000',
      },
      borderRadius: {
        xs:   '4px',
        sm:   '8px',
        md:   '12px',
        lg:   '16px',
        xl:   '24px',
        pill: '100px',
        full: '9999px',
      },
      fontFamily: {
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        body:    ['var(--font-inter)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-mega': ['80px', { lineHeight: '1.0', letterSpacing: '-2px' }],
        'display-xl':   ['64px', { lineHeight: '1.0', letterSpacing: '-1.6px' }],
        'display-lg':   ['52px', { lineHeight: '1.0', letterSpacing: '-1.3px' }],
        'display-md':   ['44px', { lineHeight: '1.09', letterSpacing: '-1px' }],
        'display-sm':   ['36px', { lineHeight: '1.11', letterSpacing: '-0.5px' }],
        'title-lg':     ['32px', { lineHeight: '1.13', letterSpacing: '-0.4px' }],
        'title-md':     ['18px', { lineHeight: '1.33', letterSpacing: '0' }],
        'title-sm':     ['16px', { lineHeight: '1.25', letterSpacing: '0' }],
        'body-md':      ['16px', { lineHeight: '1.5', letterSpacing: '0' }],
        'body-sm':      ['14px', { lineHeight: '1.5', letterSpacing: '0' }],
        'caption':      ['13px', { lineHeight: '1.5', letterSpacing: '0' }],
        'num':          ['18px', { lineHeight: '1.4', letterSpacing: '0' }],
      },
      spacing: {
        section: '96px',
        card:    '32px',
      },
      boxShadow: {
        card: '0 4px 12px rgba(0, 0, 0, 0.04)',
        dark: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
```

### `frontend/src/app/globals.css` — CSS custom properties (append after shadcn base)
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --color-primary:               #0052ff;
  --color-primary-active:        #003ecc;
  --color-ink:                   #0a0b0d;
  --color-body:                  #5b616e;
  --color-muted:                 #7c828a;
  --color-hairline:              #dee1e6;
  --color-canvas:                #ffffff;
  --color-surface-soft:          #f7f7f7;
  --color-surface-strong:        #eef0f3;
  --color-surface-dark:          #0a0b0d;
  --color-surface-dark-elevated: #16181c;
  --color-on-dark:               #ffffff;
  --color-on-dark-soft:          #a8acb3;
  --color-semantic-up:           #05b169;
  --color-semantic-down:         #cf202f;
}

/* Reusable class shortcuts */
.num {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.profit-up   { color: #05b169; }
.profit-down { color: #cf202f; }
```

### Verification
```bash
npm run dev
# Should open at http://localhost:3001
# Default Next.js page renders
# No TypeScript or Tailwind errors in console
```

## Phase 1 Verification Gate ✅
Before proceeding to Phase 2, confirm ALL of:
- [ ] `docker compose up -d postgres` → postgres healthy
- [ ] `backend/npm run start:dev` → "Backend running on http://localhost:3000" with no errors
- [ ] `backend/npm run migration:run` → migration applied, `\dt` shows both tables
- [ ] `frontend/npm run dev` → renders at http://localhost:3001 with no errors
- [ ] `backend/.env` exists (not committed), `frontend/.env.local` exists (not committed)

---

---

# PHASE 2 — Backend: Auth Module
**Status:** ⬜ Not started  
**Duration:** ~1.5 hours  
**Dependencies:** Phase 1 complete (entities exist, DB migrated)  
**Parallelizable with:** Phase 5 (frontend scaffold)

## Goal
Implement register, login, JWT issuance, and the JwtAuthGuard. The `@CurrentUser()` decorator must be available for Phases 3 and 4. All logic must be unit-testable and the test file must pass before Phase 3 begins.

---

## 2.1 — Common Infrastructure (runs first in main.ts)

### `backend/src/common/filters/http-exception.filter.ts`
```typescript
import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message: typeof message === 'object' ? message : { error: message },
      timestamp: new Date().toISOString(),
    });
  }
}
```

### `backend/src/common/interceptors/transform.interceptor.ts`
```typescript
import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

> **Note:** Paginated responses (`{ data[], meta{} }`) from InvestmentsService are returned as-is — the transform interceptor wraps them in `{ data: { data[], meta{} } }`. This is acceptable for a CRUD assessment. Alternatively, skip the transform interceptor on paginated routes using a custom decorator.

### Register in `backend/src/main.ts` (add after CORS setup)
```typescript
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// inside bootstrap():
app.useGlobalFilters(new GlobalExceptionFilter());
app.useGlobalInterceptors(new TransformInterceptor());
```

---

## 2.2 — Users Module

### `backend/src/users/users.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    // addSelect to override select:false on password column
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(data: {
    name: string;
    email: string;
    hashedPassword: string;
  }): Promise<User> {
    const user = this.userRepository.create({
      name: data.name,
      email: data.email,
      password: data.hashedPassword,
    });
    return this.userRepository.save(user);
  }
}
```

### `backend/src/users/users.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

---

## 2.3 — Auth DTOs

### `backend/src/auth/dto/register.dto.ts`
```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100)
  name: string;

  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(100)
  password: string;
}
```

### `backend/src/auth/dto/login.dto.ts`
```typescript
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
```

---

## 2.4 — JWT Strategy & Guard

### `backend/src/auth/strategies/jwt.strategy.ts`
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<{ userId: string; email: string }> {
    if (!payload.userId || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return { userId: payload.userId, email: payload.email };
  }
}
```

### `backend/src/auth/guards/jwt-auth.guard.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### `backend/src/auth/decorators/current-user.decorator.ts`
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): { userId: string; email: string } => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

---

## 2.5 — Auth Service

### `backend/src/auth/auth.service.ts`
```typescript
import {
  Injectable, ConflictException, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      hashedPassword,
    });

    // Return user without password (password is select:false on entity,
    // and we never set it on the returned object here)
    const { ...safeUser } = user;
    return safeUser;
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { userId: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}
```

> **Security note:** Both "user not found" and "wrong password" throw the same `UnauthorizedException` with the same message. This prevents user enumeration via timing or message differences.

---

## 2.6 — Auth Module & Controller

### `backend/src/auth/auth.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
```

### `backend/src/auth/auth.controller.ts`
```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

---

## 2.7 — Auth Unit Tests

### `backend/src/auth/auth.service.spec.ts`
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'uuid-1',
  name: 'Test User',
  email: 'test@test.com',
  password: '$2b$10$hashedpassword',
};

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('throws ConflictException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      await expect(
        service.register({ name: 'Test', email: 'test@test.com', password: 'pass123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('hashes password before saving', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      const bcryptSpy = jest.spyOn(bcrypt, 'hash');

      await service.register({ name: 'Test', email: 'new@test.com', password: 'pass123' });

      expect(bcryptSpy).toHaveBeenCalledWith('pass123', 10);
    });

    it('returns user without password field', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        name: 'Test', email: 'new@test.com', password: 'pass123',
      });

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'noone@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password does not match', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns accessToken and safe user on valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login({ email: 'test@test.com', password: 'pass123' });

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toMatchObject({ id: 'uuid-1', email: 'test@test.com' });
    });
  });
});
```

### Run tests
```bash
npm run test -- --testPathPattern=auth
# All 5 tests should pass
```

## Phase 2 Verification Gate ✅
- [ ] `POST /auth/register` with valid body → 201, user returned (no password)
- [ ] `POST /auth/register` with duplicate email → 409
- [ ] `POST /auth/login` with valid creds → 200 `{ accessToken, user }`
- [ ] `POST /auth/login` with wrong password → 401
- [ ] `npm run test -- --testPathPattern=auth` → all pass
- [ ] `npm run lint` → zero errors

---

---

# PHASE 3 — Backend: Investments Module
**Status:** ⬜ Not started  
**Duration:** ~2 hours  
**Dependencies:** Phase 2 complete (JwtAuthGuard + CurrentUser available)

## Goal
Implement all 5 CRUD endpoints. Every query is scoped to `userId`. Pagination, ILIKE search, and type filter all work. Ownership violations return 404 (not 403). Unit tests pass.

---

## 3.1 — Pagination DTO (Common)

### `backend/src/common/pagination/pagination.dto.ts`
```typescript
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}
```

---

## 3.2 — Investment DTOs

### `backend/src/investments/dto/create-investment.dto.ts`
```typescript
import {
  IsString, IsNotEmpty, IsNumber, IsPositive,
  IsDateString, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvestmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  investmentName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  investmentType: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  investedAmount: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  currentValue: number;

  @IsDateString()
  purchaseDate: string;
}
```

### `backend/src/investments/dto/update-investment.dto.ts`
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateInvestmentDto } from './create-investment.dto';

export class UpdateInvestmentDto extends PartialType(CreateInvestmentDto) {}
```

### `backend/src/investments/dto/query-investment.dto.ts`
```typescript
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/pagination/pagination.dto';

export class QueryInvestmentDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  investmentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
```

---

## 3.3 — Investments Service

### `backend/src/investments/investments.service.ts`
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investment } from './entities/investment.entity';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { QueryInvestmentDto } from './dto/query-investment.dto';

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectRepository(Investment)
    private readonly investmentRepository: Repository<Investment>,
  ) {}

  async create(userId: string, dto: CreateInvestmentDto): Promise<Investment> {
    const investment = this.investmentRepository.create({ ...dto, userId });
    return this.investmentRepository.save(investment);
  }

  async findAll(userId: string, query: QueryInvestmentDto) {
    const { page, limit, investmentType, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.investmentRepository
      .createQueryBuilder('investment')
      .where('investment.userId = :userId', { userId })
      .orderBy('investment.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (investmentType) {
      qb.andWhere('investment.investmentType ILIKE :type', {
        type: `%${investmentType}%`,
      });
    }

    if (search) {
      qb.andWhere('investment.investmentName ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages },
    };
  }

  async findOne(userId: string, id: string): Promise<Investment> {
    const investment = await this.investmentRepository.findOne({
      where: { id, userId },   // both conditions — no separate ownership check needed
    });

    if (!investment) {
      // 404 whether it doesn't exist OR belongs to another user — no information leak
      throw new NotFoundException('Investment not found');
    }

    return investment;
  }

  async update(userId: string, id: string, dto: UpdateInvestmentDto): Promise<Investment> {
    const investment = await this.findOne(userId, id);  // ownership enforced here
    Object.assign(investment, dto);
    return this.investmentRepository.save(investment);
  }

  async remove(userId: string, id: string): Promise<void> {
    const investment = await this.findOne(userId, id);  // ownership enforced here
    await this.investmentRepository.remove(investment);
  }
}
```

---

## 3.4 — Investments Controller

### `backend/src/investments/investments.controller.ts`
```typescript
import {
  Controller, Get, Post, Put, Delete, Param, Body,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { QueryInvestmentDto } from './dto/query-investment.dto';

@Controller('investments')
@UseGuards(JwtAuthGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateInvestmentDto,
  ) {
    return this.investmentsService.create(user.userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: { userId: string },
    @Query() query: QueryInvestmentDto,
  ) {
    return this.investmentsService.findAll(user.userId, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.investmentsService.findOne(user.userId, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateInvestmentDto,
  ) {
    return this.investmentsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.investmentsService.remove(user.userId, id);
  }
}
```

---

## 3.5 — Investments Unit Tests

### `backend/src/investments/investments.service.spec.ts`
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { Investment } from './entities/investment.entity';

const mockInvestment = {
  id: 'inv-1', userId: 'user-1',
  investmentName: 'Apple Inc', investmentType: 'Stocks',
  investedAmount: 10000, currentValue: 12000, purchaseDate: '2024-01-01',
};

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
};

describe('InvestmentsService', () => {
  let service: InvestmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentsService,
        { provide: getRepositoryToken(Investment), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<InvestmentsService>(InvestmentsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('always uses userId from argument, not from dto', async () => {
      mockRepo.create.mockReturnValue({ ...mockInvestment });
      mockRepo.save.mockResolvedValue(mockInvestment);
      const dto = { investmentName: 'Apple', investmentType: 'Stocks',
        investedAmount: 1000, currentValue: 1200, purchaseDate: '2024-01-01' };

      await service.create('user-1', dto);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
      );
    });
  });

  describe('findAll — pagination math', () => {
    const makeQb = (total: number, data: any[]) => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([data, total]),
    });

    it('calculates correct offset: (page-1) * limit', async () => {
      const qb = makeQb(30, []);
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll('user-1', { page: 3, limit: 10 });

      expect(qb.skip).toHaveBeenCalledWith(20);  // (3-1)*10 = 20
    });

    it('calculates totalPages = ceil(total / limit)', async () => {
      const qb = makeQb(25, []);
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll('user-1', { page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(3);  // ceil(25/10) = 3
    });

    it('returns totalPages = 0 when no investments', async () => {
      const qb = makeQb(0, []);
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll('user-1', { page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findOne — ownership enforcement', () => {
    it('returns investment when userId matches', async () => {
      mockRepo.findOne.mockResolvedValue(mockInvestment);
      const result = await service.findOne('user-1', 'inv-1');
      expect(result).toEqual(mockInvestment);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'inv-1', userId: 'user-1' },
      });
    });

    it('throws NotFoundException when userId does not match (no info leak)', async () => {
      mockRepo.findOne.mockResolvedValue(null);  // same result as "not exists"
      await expect(service.findOne('attacker-id', 'inv-1'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
```

## Phase 3 Verification Gate ✅
- [ ] `POST /investments` (with JWT) → 201, investment created with correct userId
- [ ] `GET /investments?page=1&limit=5` → returns `{ data[], meta{ total, page:1, limit:5, totalPages } }`
- [ ] `GET /investments/:id` (different user JWT) → 404
- [ ] `PUT /investments/:id` (different user JWT) → 404
- [ ] `DELETE /investments/:id` → 204
- [ ] `npm run test -- --testPathPattern=investments` → all pass

---

---

# PHASE 4 — Backend: Portfolio Module + Full Test Suite
**Status:** ⬜ Not started  
**Duration:** ~1 hour  
**Dependencies:** Phase 3 complete

## Goal
Portfolio summary endpoint returns correct computed stats. All 3 spec files green. Lint passes. Backend is complete and ready for frontend integration.

---

## 4.1 — Portfolio Service

### `backend/src/portfolio/portfolio.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investment } from '../investments/entities/investment.entity';

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
}

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Investment)
    private readonly investmentRepository: Repository<Investment>,
  ) {}

  async getSummary(userId: string): Promise<PortfolioSummary> {
    const result = await this.investmentRepository
      .createQueryBuilder('investment')
      .select('SUM(investment.investedAmount)', 'totalInvested')
      .addSelect('SUM(investment.currentValue)', 'currentValue')
      .where('investment.userId = :userId', { userId })
      .getRawOne<{ totalInvested: string | null; currentValue: string | null }>();

    // PostgreSQL returns numeric SUM as string; parse to float
    const totalInvested = parseFloat(result?.totalInvested ?? '0') || 0;
    const currentValue  = parseFloat(result?.currentValue ?? '0') || 0;
    const profit        = parseFloat((currentValue - totalInvested).toFixed(2));

    const profitPercentage =
      totalInvested === 0
        ? 0
        : parseFloat(((profit / totalInvested) * 100).toFixed(2));

    return { totalInvested, currentValue, profit, profitPercentage };
  }
}
```

> **Why `parseFloat(result?.totalInvested ?? '0') || 0`?** PostgreSQL's `SUM()` on `numeric` columns returns a string. If no rows match (new user), `SUM()` returns `null`. Double guard: nullish coalescing → `'0'`, then `|| 0` catches `NaN` from `parseFloat('')`.

---

## 4.2 — Portfolio Controller & Module

### `backend/src/portfolio/portfolio.controller.ts`
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: { userId: string }) {
    return this.portfolioService.getSummary(user.userId);
  }
}
```

---

## 4.3 — Portfolio Unit Tests

### `backend/src/portfolio/portfolio.service.spec.ts`
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PortfolioService } from './portfolio.service';
import { Investment } from '../investments/entities/investment.entity';

const makeQb = (totalInvested: string | null, currentValue: string | null) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue({ totalInvested, currentValue }),
});

const mockRepo = { createQueryBuilder: jest.fn() };

describe('PortfolioService', () => {
  let service: PortfolioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: getRepositoryToken(Investment), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<PortfolioService>(PortfolioService);
    jest.clearAllMocks();
  });

  it('calculates correct profit and profitPercentage', async () => {
    mockRepo.createQueryBuilder.mockReturnValue(makeQb('50000', '62000'));
    const result = await service.getSummary('user-1');

    expect(result.profit).toBe(12000);
    expect(result.profitPercentage).toBe(24);
  });

  it('returns profitPercentage = 0 (not NaN) when totalInvested = 0', async () => {
    mockRepo.createQueryBuilder.mockReturnValue(makeQb(null, null));
    const result = await service.getSummary('user-1');

    expect(result.totalInvested).toBe(0);
    expect(result.profitPercentage).toBe(0);
    expect(Number.isNaN(result.profitPercentage)).toBe(false);
  });

  it('rounds profitPercentage to 2 decimal places', async () => {
    mockRepo.createQueryBuilder.mockReturnValue(makeQb('30000', '40001'));
    const result = await service.getSummary('user-1');

    expect(result.profitPercentage.toString()).toMatch(/^\d+\.\d{1,2}$/);
  });

  it('handles negative profit (loss scenario)', async () => {
    mockRepo.createQueryBuilder.mockReturnValue(makeQb('10000', '8000'));
    const result = await service.getSummary('user-1');

    expect(result.profit).toBe(-2000);
    expect(result.profitPercentage).toBe(-20);
  });
});
```

## 4.4 — Final Backend Verification Gate ✅
```bash
npm run test          # All 3 spec files, all tests green
npm run lint          # Zero errors
npm run build         # dist/ produced without TypeScript errors
```

Manual API tests:
- [ ] `GET /portfolio/summary` (fresh user, no investments) → `{ totalInvested: 0, currentValue: 0, profit: 0, profitPercentage: 0 }`
- [ ] Add 3 investments, re-check summary → numbers are correct
- [ ] `GET /portfolio/summary` (User B token) → only User B's data
- [ ] **Backend is feature-complete. Tag git: `git tag v1-backend-complete`**

---

---

# PHASE 5 — Frontend: Scaffold, Design Tokens & Auth Pages
**Status:** ⬜ Not started  
**Duration:** ~1.5 hours  
**Dependencies:** Phase 1 (frontend bootstrapped), Phase 2 (API contract known)  
**Parallelizable with:** Phase 2 + 3

## Goal
Auth pages match the Coinbase dark-hero design exactly. Token is stored and available for all subsequent API calls. Route protection works. The API client is typed and reusable by Phase 6.

---

## 5.1 — Shared Infrastructure

### `frontend/src/lib/api-client.ts`
```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message ?? `HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
```

### `frontend/src/lib/auth-context.tsx`
```tsx
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser { id: string; name: string; email: string; }

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser  = localStorage.getItem('auth_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    router.push('/investments');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
```

### `frontend/src/middleware.ts`
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value
    ?? request.headers.get('x-auth-token');

  // Using a simple check — for localStorage-based auth, the real guard
  // is the client-side useAuth() hook. Middleware catches cookie-based tokens.
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (!token && !isPublic && pathname.startsWith('/investments')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 5.2 — Login Page

### `frontend/src/app/login/page.tsx` (Coinbase dark-hero exact spec)
```tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post<{ accessToken: string; user: any }>(
        '/auth/login', { email, password },
      );
      login(res.accessToken, res.user);
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface-dark flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] bg-surface-dark-elevated rounded-xl p-10
                      border border-white/[0.06] shadow-dark">

        {/* Logo */}
        <div className="mb-8">
          <span className="text-primary font-semibold text-lg tracking-tight">
            PortfolioTracker
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-on-dark font-display font-normal text-title-lg mb-1
                       tracking-[-0.4px]">
          Welcome back
        </h1>
        <p className="text-on-dark-soft text-body-sm mb-8">
          Sign in to your account
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-on-dark-soft text-body-sm mb-1.5 block">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="you@example.com"
              className="w-full h-12 px-4 rounded-md bg-white/5 border border-white/10
                         text-on-dark text-body-md placeholder:text-muted
                         focus:outline-none focus:border-2 focus:border-primary
                         transition-colors"
            />
          </div>
          <div>
            <label className="text-on-dark-soft text-body-sm mb-1.5 block">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••"
              className="w-full h-12 px-4 rounded-md bg-white/5 border border-white/10
                         text-on-dark text-body-md placeholder:text-muted
                         focus:outline-none focus:border-2 focus:border-primary
                         transition-colors"
            />
          </div>

          {error && (
            <p className="text-semantic-down text-body-sm">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full h-11 rounded-pill bg-primary text-on-primary
                       font-semibold text-body-md
                       hover:bg-primary-active active:bg-primary-active
                       disabled:bg-primary-disabled disabled:cursor-not-allowed
                       transition-colors mt-2">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Divider + link */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <span className="text-on-dark-soft text-body-sm">
            Don&apos;t have an account?{' '}
          </span>
          <Link href="/register" className="text-primary text-body-sm font-medium
                                            hover:underline">
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
```

## Phase 5 Verification Gate ✅
- [ ] `/login` renders dark hero background (#0a0b0d full screen)
- [ ] Login card is #16181c, centered, 400px wide, rounded-xl
- [ ] Logo text is `#0052ff` (Coinbase Blue)
- [ ] Input fields have `#0052ff` focus border
- [ ] "Sign In" button is blue pill, white text
- [ ] Successful login → token in localStorage → redirect to /investments
- [ ] Failed login → inline error in red (#cf202f)
- [ ] `/register` mirrors layout, creates account, redirects to /login

---

---

# PHASE 6 — Frontend: Investments Page & All Components
**Status:** ⬜ Not started  
**Duration:** ~2.5 hours  
**Dependencies:** Phase 5 complete, Phase 4 complete (API ready)

## Goal
The investments page is fully functional. CRUD, pagination, search/filter, portfolio summary, and delete confirmation all work end-to-end against the live backend.

---

## 6.1 — TypeScript Types

### `frontend/src/types/investment.ts`
```typescript
export interface Investment {
  id: string;
  userId: string;
  investmentName: string;
  investmentType: string;
  investedAmount: number;
  currentValue: number;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedInvestments {
  data: Investment[];
  meta: PaginationMeta;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
}
```

---

## 6.2 — Portfolio Summary Card Component

**Design spec:** 4 stat cards in a flex row. All values in JetBrains Mono. Profit/loss color-coded (text only, never background).

```tsx
// frontend/src/components/portfolio-summary-card.tsx
import type { PortfolioSummary } from '@/types/investment';

function StatCard({
  label, value, sub, isProfit,
}: {
  label: string; value: string; sub?: string; isProfit?: boolean;
}) {
  const profitColor = isProfit !== undefined
    ? (isProfit ? 'text-semantic-up' : 'text-semantic-down')
    : 'text-ink';

  return (
    <div className="flex-1 bg-canvas border border-hairline rounded-xl p-8">
      <p className="text-muted text-[12px] font-semibold uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className={`font-mono text-[28px] font-medium tabular-nums ${profitColor}`}>
        {value}
      </p>
      {sub && (
        <p className={`font-mono text-body-sm tabular-nums mt-1 ${profitColor}`}>{sub}</p>
      )}
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(n);
}

export function PortfolioSummaryCard({ summary }: { summary: PortfolioSummary }) {
  const isProfit = summary.profit >= 0;
  return (
    <section className="py-12 border-b border-hairline">
      <div className="max-w-[1200px] mx-auto px-6 flex gap-6">
        <StatCard label="Total Invested" value={fmt(summary.totalInvested)} />
        <StatCard label="Current Value"  value={fmt(summary.currentValue)} />
        <StatCard
          label="Profit / Loss"
          value={(isProfit ? '+' : '') + fmt(summary.profit)}
          isProfit={isProfit}
        />
        <StatCard
          label="Return %"
          value={`${isProfit ? '+' : ''}${summary.profitPercentage.toFixed(2)}%`}
          isProfit={isProfit}
        />
      </div>
    </section>
  );
}
```

---

## 6.3 — Pagination Controls

```tsx
// frontend/src/components/pagination-controls.tsx
interface Props { page: number; totalPages: number; onPageChange: (p: number) => void; }

export function PaginationControls({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)} disabled={page === 1}
        className="h-10 px-4 rounded-pill bg-surface-strong text-ink
                   font-semibold text-body-sm disabled:opacity-40
                   hover:bg-hairline transition-colors">
        ← Prev
      </button>

      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`h-10 w-10 rounded-pill font-semibold text-body-sm transition-colors
            ${p === page
              ? 'bg-primary text-on-primary'
              : 'bg-surface-strong text-ink hover:bg-hairline'}`}>
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
        className="h-10 px-4 rounded-pill bg-surface-strong text-ink
                   font-semibold text-body-sm disabled:opacity-40
                   hover:bg-hairline transition-colors">
        Next →
      </button>
    </div>
  );
}
```

---

## Phase 6 Verification Gate ✅
- [ ] Portfolio summary cards show correct values from API
- [ ] Profit card is green when positive, red when negative (text color only)
- [ ] All numeric values are in JetBrains Mono
- [ ] Investment table renders all columns
- [ ] Type badges are pill-shaped, #eef0f3 bg
- [ ] Add Investment dialog opens, submits, table + summary refresh
- [ ] Edit dialog pre-fills all fields
- [ ] Delete AlertDialog shows before executing
- [ ] Search + filter work with debounce
- [ ] Pagination renders, navigates correctly

---

---

# PHASE 7 — Integration: End-to-End Validation & Polish
**Status:** ⬜ Not started  
**Duration:** ~1 hour

## Validation Checklist (manual test script)

### Happy Path
```
1. Register user A (name, email, password)
2. Redirected to /login
3. Login with user A credentials
4. Redirected to /investments
5. Portfolio summary shows all zeros
6. Add 15 investments (vary types: Stocks, Crypto, MF)
7. Verify totalPages = 2 (page 1 shows 10, page 2 shows 5)
8. Search "Stocks" in name search → filtered results
9. Filter by type "Crypto" → only crypto investments shown
10. Edit investment → current value changes → summary updates
11. Delete investment → row removed → summary updates
12. Logout → redirected to /login
```

### Security Test
```
1. Login as User B (register separately)
2. Copy an investment ID from User A's session (from network tab)
3. GET /investments/{user-A-investment-id} with User B's token
4. → Should receive 404 (not 403, not 200)
5. PUT same ID with User B's token → 404
6. DELETE same ID with User B's token → 404
```

### Edge Cases
```
1. Empty portfolio → summary = all zeros, no NaN
2. Portfolio with one investment = profit exactly (no rounding errors)
3. DELETE /investments/:id → 204 (no response body)
4. Login without token → /investments → redirected to /login
```

### Build Verification
```bash
# Frontend
cd frontend && npm run build   # zero TypeScript errors, zero next.js build errors

# Backend
cd backend && npm run build    # zero TypeScript errors
cd backend && npm run test     # 3 spec files, all tests green
cd backend && npm run lint     # zero lint errors
```

---

---

# PHASE 8 — Docker: Dockerfiles & Compose
**Status:** ⬜ Not started  
**Duration:** ~45 minutes

## 8.1 — Backend Dockerfile (multi-stage)

### `backend/Dockerfile`
```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Runtime (minimal)
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
```

## 8.2 — Frontend Dockerfile

### `frontend/Dockerfile`
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3001
ENV PORT 3001
CMD ["node", "server.js"]
```

> **Next.js standalone output:** Requires `output: 'standalone'` in `next.config.js`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = { output: 'standalone' };
module.exports = nextConfig;
```

## Phase 8 Verification Gate ✅
```bash
docker build -t portfolio-backend ./backend     # succeeds
docker build -t portfolio-frontend ./frontend   # succeeds
docker compose up                               # all 3 services healthy
# Navigate to http://localhost:3001 → full app works
```

---

---

# PHASE 9 — Deployment
**Status:** ⬜ Not started  
**Duration:** ~45 minutes

## 9.1 — Neon PostgreSQL Setup
1. Create a Neon project at `neon.tech`
2. Note the **pooled** connection string (contains `-pooler` in hostname)
3. Set `DATABASE_URL` to this string everywhere

## 9.2 — Backend: Render or Railway

### Render Steps
1. New Web Service → Connect GitHub repo
2. Root Directory: `backend`
3. Build Command: `npm install && npm run build`
4. Start Command: `node dist/main`
5. Environment Variables:
   ```
   DATABASE_URL = <Neon pooled connection string>
   JWT_SECRET   = <32+ char random secret>
   PORT         = 3000
   FRONTEND_URL = <will be Vercel URL — set after frontend deploy>
   NODE_ENV     = production
   ```
6. After first deploy, run migrations:
   ```bash
   DATABASE_URL=<neon-pooled-url> npm run migration:run
   ```
7. Update `FRONTEND_URL` after Vercel deploy
8. Note the deployed backend URL (e.g., `https://portfolio-backend.onrender.com`)

## 9.3 — Frontend: Vercel

1. Import GitHub repo in Vercel
2. Framework: Next.js (auto-detected)
3. Root Directory: `frontend`
4. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL = <Render/Railway backend URL>
   ```
5. Deploy → note the Vercel URL

## 9.4 — Update CORS on Backend
```
FRONTEND_URL = https://your-project.vercel.app
```
Redeploy backend after this change.

## Phase 9 Smoke Test ✅
- [ ] Backend root URL returns valid response
- [ ] `POST <backend>/auth/register` works from curl
- [ ] Frontend Vercel URL loads
- [ ] Login on live frontend → no CORS error in console
- [ ] Full manual happy path on live URLs (register → login → CRUD → summary)

---

---

# PHASE 10 — README & Final Submission
**Status:** ⬜ Not started  
**Duration:** ~30 minutes

## README.md Required Sections

### 1. Project Overview (one paragraph)
Brief description of what the app does, who it's for, and the tech stack.

### 2. Local Setup (step-by-step, fresh clone assumed)
```
Prerequisites: Node 20+, Docker Desktop
1. git clone <repo-url>
2. cd finance-portfolio-tracker
3. cp backend/.env.example backend/.env
4. cp frontend/.env.example frontend/.env.local
5. Fill in backend/.env (at minimum DATABASE_URL + JWT_SECRET)
6. docker compose up -d postgres
7. cd backend && npm install && npm run migration:run
8. npm run start:dev (keep running)
9. cd ../frontend && npm install && npm run dev
10. Open http://localhost:3001
```

### 3. Environment Variables
Full table for both backend and frontend, with descriptions.

### 4. API Documentation
Table of all 9 endpoints, method, auth requirement, request/response.

### 5. Migration Instructions
```bash
npm run migration:run     # apply all pending migrations
npm run migration:revert  # undo last migration
npm run migration:show    # list applied/pending
```

### 6. Known Limitations
- JWT-only auth (no refresh token) — reason: deadline constraint. Limitation: users must re-login after 1hr.
- Token in localStorage — simpler implementation. Limitation: XSS-exposed. Production recommendation: httpOnly cookie via Next.js route handler proxy.
- Investment prices are user-entered — no live market data integration.
- No email verification — noted; would be added in production.

### 7. Live Links
- Frontend: `https://...vercel.app`
- Backend API: `https://...onrender.com`

## Final Submission Checklist ✅

```
[ ] Fresh clone → README steps → app runs (zero undocumented steps)
[ ] Register → login → CRUD → summary correct (E2E manual verified)
[ ] Cross-user isolation confirmed (User B cannot access User A's data)
[ ] 15+ investments → pagination totalPages correct
[ ] npm run test passes (3 spec files, all green)
[ ] npm run build passes (frontend + backend)
[ ] Migrations clean on fresh Neon DB (no synchronize:true anywhere)
[ ] Backend deployed, reachable, CORS working with Vercel origin
[ ] Frontend deployed on Vercel, calls deployed backend successfully
[ ] README complete (all 7 sections)
[ ] GitHub repo: public or shared with reviewer
[ ] Submitted before 4:00 PM deadline
```

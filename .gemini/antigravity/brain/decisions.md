# Architectural Decisions Log

- 2026-07-20: Backend = NestJS + TypeORM + Neon Postgres. Frontend = Next.js App Router + shadcn/ui. Monorepo.
- 2026-07-20: JWT-only auth, no refresh tokens — deadline-driven scope decision, documented in README as a known limitation.
- 2026-07-20: Deploy split — frontend on Vercel, backend on Render/Railway — because Vercel does not support long-running NestJS servers.
- 2026-07-20: Neon pooled connection string required for deployed backend to avoid exhausting connection limits under TypeORM's default pool.

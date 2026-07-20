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

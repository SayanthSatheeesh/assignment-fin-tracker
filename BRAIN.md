# BRAIN.md — Finance Portfolio Tracker
> Master context document. Every agent reads this first, every time.

---

## 0. Project Identity

**Product:** Finance Portfolio Tracker  
**Purpose:** Take-home assessment — Full Stack Developer Internship (Fintech)  
**Graded on:** Correctness, code quality, auth security, fresh-clone reproducibility, bonus items (pagination, unit tests, Clean Architecture)  
**Deadline:** Tomorrow, 4:00 PM  
**Priority:** Fully working, deployed, demoable app > gold-plating any single part

---

## 1. Design Philosophy (from DESIGN-coinbase.md)

The UI is modeled on **Coinbase's institutional design language** — quiet, white-canvas, editorially-spaced, and almost monochromatic. This is a **calm fintech SaaS product**, not a trading-dashboard panic room.

| Principle | Rule |
|---|---|
| Brand voltage | Single accent: `#0052ff` (Coinbase Blue). Scarce — one or two blue moments per section. |
| Typography mood | Display at **weight 400**, never 700. Calm, not urgent. |
| Geometry | Pills for CTAs (`100px`), `24px` for cards, circles for icons. No sharp corners ever. |
| Depth | Card-on-card layering only. One shadow tier max. |
| Numbers | Every numeric value → `JetBrains Mono / Geist Mono` |
| Spacing | 96px between major sections. 32px card internal padding. 4px base unit. |
| Band rhythm | White → Soft Gray → Dark (#0a0b0d) → White. Deliberate rotation. |

---

## 2. Tech Stack (Pinned)

| Layer | Choice | Notes |
|---|---|---|
| Backend | NestJS 10.x, TypeScript strict | Modular, not monolith |
| ORM | TypeORM 0.3.x | Migrations only — **never** `synchronize: true` |
| Database | PostgreSQL via Neon (cloud) | Pooled connection string, `?sslmode=require` |
| Auth | JWT only, `@nestjs/jwt` + `passport-jwt` | bcrypt salt rounds = 10, 1hr expiry |
| Frontend | Next.js 14+ App Router, TypeScript | Not Pages Router |
| UI | shadcn/ui + Tailwind CSS | Coinbase design tokens mapped via CSS vars |
| Backend deploy | Render or Railway (Docker) | Not Vercel — long-running server |
| Frontend deploy | Vercel | Native Next.js |
| Testing | Jest (NestJS built-in) | Unit tests on services only |

---

## 3. Color Tokens (DESIGN-coinbase.md → CSS Custom Properties)

```
Primary:               #0052ff   (Coinbase Blue — all primary CTAs)
Primary Active:        #003ecc   (Press/active state)
Primary Disabled:      #a8b8cc
Ink:                   #0a0b0d   (Headings, nav, emphasis)
Body:                  #5b616e   (Default running text)
Muted:                 #7c828a
Muted Soft:            #a8acb3
Hairline:              #dee1e6   (Dividers)
Hairline Soft:         #eef0f3
Canvas:                #ffffff   (Page floor)
Surface Soft:          #f7f7f7
Surface Strong:        #eef0f3   (Secondary buttons, badges)
Surface Dark:          #0a0b0d   (Dark hero bands)
Surface Dark Elevated: #16181c   (Cards on dark backgrounds)
On Dark:               #ffffff
On Dark Soft:          #a8acb3
Semantic Up:           #05b169   (Profit green — text only, never background)
Semantic Down:         #cf202f   (Loss red — text only, never background)
Accent Yellow:         #f4b000   (Illustrative only — asset icons)
```

---

## 4. Typography System

| Role | Font | Size | Weight | Notes |
|---|---|---|---|---|
| Display Hero | Inter | 80px → 40px mobile | 400 | Letter-spacing -2px |
| Section Heads | Inter | 52px | 400 | -1.3px tracking |
| Card Titles | Inter | 18px | 600 | Zero tracking |
| Body | Inter | 16px | 400 | Line-height 1.5 |
| Body Strong | Inter | 16px | 700 | |
| Small/Caption | Inter | 13–14px | 400 | |
| **Numbers** | **JetBrains Mono** | 18px | 500 | **Every financial value** |
| Buttons | Inter | 16px | 600 | |
| Nav links | Inter | 14px | 500 | |

> Font subs: CoinbaseDisplay → Inter 400, CoinbaseSans → Inter, CoinbaseMono → JetBrains Mono

---

## 5. Border Radius Scale

| Token | Value | Use |
|---|---|---|
| xs | 4px | Inline tags |
| sm | 8px | Compact rows |
| md | 12px | Form inputs |
| lg | 16px | Mid cards |
| xl | 24px | Feature cards, investment cards |
| pill | 100px | All buttons, search bars, badges |
| full | 9999px | Asset icons, avatars |

---

## 6. Component Mapping (Design → App)

| Coinbase Component | App Component |
|---|---|
| `hero-band-dark` | Auth pages dark hero |
| `hero-band-light` | Investments page header |
| `product-ui-card-dark` | Portfolio summary dark card |
| `feature-card` | Investment stat cards |
| `asset-row` | Investment table rows |
| `price-up-cell` / `price-down-cell` | Profit/Loss cells (text color only) |
| `button-primary` | Add Investment, Login, Register |
| `button-secondary-light` | Filter reset, Cancel |
| `button-outline-on-dark` | Secondary CTA on dark backgrounds |
| `text-input` | Form inputs (email, password, amount) |
| `search-input-pill` | Search/filter bar |
| `badge-pill` | Investment type tags |
| `cta-band-dark` | Pre-footer band |
| `footer-light` | App footer |

---

## 7. Security Constraints (Non-Negotiable)

1. Every investment query/mutation → `WHERE userId = :currentUserId` — service layer enforced
2. `GET /investments/:id` wrong owner → **404** (not 403, no existence leak)
3. Passwords → bcrypt salt 10, **never returned in any response**
4. JWT payload: `{ userId, email }`, expiry 1hr
5. CORS: explicit Vercel origin, never `*`
6. `synchronize: true` → never

---

## 8. API Contract Summary

```
# Auth (public)
POST /auth/register  → 201 { user (no password) }
POST /auth/login     → 200 { accessToken, user }

# Investments (JWT required)
POST   /investments                                    → 201
GET    /investments?page&limit&investmentType&search   → 200 { data[], meta{} }
GET    /investments/:id                                → 200 | 404
PUT    /investments/:id                                → 200
DELETE /investments/:id                                → 204

# Portfolio (JWT required)
GET /portfolio/summary → 200 { totalInvested, currentValue, profit, profitPercentage }
```

---

## 9. Architectural Decisions Log

| Date | Decision |
|---|---|
| 2026-07-20 | Backend = NestJS + TypeORM + Neon Postgres. Frontend = Next.js App Router + shadcn/ui. Monorepo. |
| 2026-07-20 | JWT-only auth, no refresh tokens — deadline-driven scope, documented in README as known limitation. |
| 2026-07-20 | Deploy split — frontend on Vercel, backend on Render/Railway. |
| 2026-07-20 | Neon pooled connection string required — TypeORM default pool exhausts Neon's direct connection cap. |
| 2026-07-20 | Token storage — localStorage documented tradeoff; httpOnly cookie via Next.js route handler preferred. |
| 2026-07-20 | UI system — Coinbase institutional design language: white canvas, #0052ff accent, Inter + JetBrains Mono. |

---

## 10. Agent Rules

- Never `synchronize: true` on TypeORM.
- Every investments/portfolio query scoped to authenticated userId. No exceptions.
- Controllers: routing + validation only. Business logic in services.
- class-validator DTOs for all request bodies.
- Run `npm run lint` and `npm run test` before marking a module done.
- Record architectural decisions in Section 9 above.

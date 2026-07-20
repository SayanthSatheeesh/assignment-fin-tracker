# WEBFLOW.md — User Flow & Screen Navigation Map
## Finance Portfolio Tracker

> All user-facing flows, state transitions, and screen-to-screen navigation. Design tokens reference UI-UX.md.

---

## 1. Application Routes

| Route | Auth Required | Component | Purpose |
|---|---|---|---|
| `/` | — | `app/page.tsx` | Redirect gate (no UI) |
| `/login` | Public only | `app/login/page.tsx` | Email/password login |
| `/register` | Public only | `app/register/page.tsx` | Account creation |
| `/investments` | ✅ Required | `app/investments/page.tsx` | Main dashboard |

---

## 2. Route Guard Logic (Middleware)

```
Every request hits middleware first.

IF route is /login OR /register:
  IF user is authenticated (valid token found):
    → redirect to /investments
  ELSE:
    → allow through (render auth page)

IF route is /investments:
  IF user is NOT authenticated:
    → redirect to /login
  ELSE:
    → allow through (render dashboard)

IF route is /:
  → redirect to /investments (middleware handles auth redirect chain)
```

**Implementation:** `src/middleware.ts` reads the JWT from cookie (or localStorage via client check).

---

## 3. Full User Journey Maps

---

### 3A. New User — Registration → First Investment

```
[Landing at /]
    │
    ▼ (no token → middleware)
[/login page]
    │ "Don't have an account?" click
    ▼
[/register page]
    │
    ├── Fill: Name, Email, Password
    │
    ├── [Create Account] click
    │       │
    │       ├── POST /auth/register
    │       │
    │       ├─ SUCCESS → toast "Account created!" → redirect /login
    │       │
    │       └─ ERROR (duplicate email) → inline error "Email already in use"
    │
[/login page] (after register redirect)
    │
    ├── Fill: Email, Password
    │
    ├── [Sign In] click
    │       │
    │       ├── POST /auth/login
    │       │
    │       ├─ SUCCESS → store token → redirect /investments
    │       │
    │       └─ ERROR → inline error "Invalid email or password"
    │
[/investments page]
    │
    ├── Portfolio summary cards: all zeros (empty state)
    │
    ├── Table: empty state → "No investments yet. Add your first one."
    │
    └── [Add Investment] click → Add Investment Dialog
```

---

### 3B. Add Investment Flow

```
[/investments page]
    │
    [Add Investment] button click (top-right toolbar)
    │
    ▼
[Dialog opens — "Add Investment"]
    │
    ├── Fields:
    │     Investment Name  [text input]
    │     Investment Type  [text input]
    │     Invested Amount  [$ number input]
    │     Current Value    [$ number input]
    │     Purchase Date    [date input]
    │
    ├── [Cancel] → dialog closes, no change
    │
    └── [Save Investment] click
              │
              ├── Client-side validation (react-hook-form + zod)
              │     └─ FAIL → inline field errors, button stays disabled
              │
              ├── POST /investments (with Bearer token)
              │
              ├─ SUCCESS (201) → dialog closes → table refetches → summary refetches
              │     └── New row appears at top of table
              │     └── Portfolio summary cards update
              │
              └─ ERROR (400/401) → inline error in dialog
```

---

### 3C. Edit Investment Flow

```
[/investments page — table row]
    │
    [Edit icon button] click on row
    │
    ▼
[Dialog opens — "Edit Investment"]
    │
    ├── Pre-filled with existing values from the row
    │
    ├── User modifies one or more fields
    │
    ├── [Cancel] → dialog closes, no change
    │
    └── [Update Investment] click
              │
              ├── Client-side validation
              │
              ├── PUT /investments/:id (with Bearer token)
              │
              ├─ SUCCESS (200) → dialog closes → table row updates → summary refetches
              │
              └─ ERROR (404 — race condition: investment deleted elsewhere) → error toast
```

---

### 3D. Delete Investment Flow

```
[/investments page — table row]
    │
    [Delete icon button] click on row
    │
    ▼
[AlertDialog opens — "Delete Investment?"]
    │   Heading: "Delete Investment?"
    │   Body: "This will permanently remove this record. This action cannot be undone."
    │   [Cancel] [Delete]
    │
    ├── [Cancel] → alert closes, no action
    │
    └── [Delete] click (red pill button)
              │
              ├── DELETE /investments/:id (with Bearer token)
              │
              ├─ SUCCESS (204) → alert closes → row removed from table → summary refetches
              │
              └─ ERROR (404) → error toast "Investment not found"
```

---

### 3E. Search & Filter Flow

```
[/investments page — toolbar]
    │
    ├── [Search bar] — type characters
    │       │ Debounce 300ms
    │       └── Updates URL query param: ?search=value
    │           → Re-fetches GET /investments?page=1&search=value
    │
    ├── [Investment Type filter] — select / type type name
    │       └── Updates URL query param: ?investmentType=Stocks
    │           → Re-fetches GET /investments?page=1&investmentType=Stocks
    │
    └── Both filters can be active simultaneously:
            GET /investments?page=1&investmentType=Crypto&search=Bitcoin
```

**Clearing Filters:**
- Clearing the search input → removes `search` param → refetches all
- A [Clear] / ✕ icon inside the search pill clears it

---

### 3F. Pagination Flow

```
[/investments page — pagination controls]

Initial load:
    GET /investments?page=1&limit=10
    Response: { data: [...10 items], meta: { total: 37, page: 1, limit: 10, totalPages: 4 } }

    Renders: [← Prev]  [1] [2] [3] [4]  [Next →]
             Active page 1 = primary blue pill

    [2] click:
        GET /investments?page=2&limit=10
        Table updates with page 2 data
        Active page = 2

    [← Prev] disabled on page 1
    [Next →] disabled on last page (page 4 in example)
```

---

### 3G. Logout Flow

```
[Navigation — top right]
    │
    [Logout] button click (or user icon menu)
    │
    ├── Clear token from localStorage / cookie
    ├── Clear AuthContext state
    └── redirect to /login
```

---

## 4. Screen Anatomy

### 4A. Login Screen (`/login`)

```
┌─────────────────────────────────────────┐  bg: #0a0b0d (full screen)
│                                         │
│                                         │
│          ┌─────────────────────┐        │
│          │  PortfolioTracker   │ ← logo (#0052ff)
│          │                     │
│          │  Welcome back       │ ← Inter 400 32px white
│          │  Sign in to account │ ← Inter 14px #a8acb3
│          │                     │
│          │  ┌─────────────────┐│
│          │  │  Email          ││ ← text-input (dark)
│          │  └─────────────────┘│
│          │  ┌─────────────────┐│
│          │  │  Password       ││
│          │  └─────────────────┘│
│          │                     │
│          │  ┌─────────────────┐│
│          │  │    Sign In      ││ ← primary pill button
│          │  └─────────────────┘│
│          │                     │
│          │  ─────────────────  │ ← hairline divider
│          │  No account? Sign up│ ← link to /register
│          └─────────────────────┘
│                                         │
└─────────────────────────────────────────┘
Card: #16181c, rounded-xl (24px), 400px wide, 40px padding
```

---

### 4B. Investments Screen (`/investments`)

```
┌─────────────────────────────────────────────────────────┐
│  NAV: Logo | Investments | Portfolio        Logout      │ ← top-nav-light (64px)
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PORTFOLIO SUMMARY BAND (bg: #ffffff, border-bottom)    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Total    │ │ Current  │ │ Profit/  │ │ Return   │  │
│  │ Invested │ │ Value    │ │ Loss     │ │ %        │  │
│  │$50,000   │ │$62,000   │ │+$12,000  │ │+24.00%   │  │ ← feature-card x4
│  │ (mono)   │ │ (mono)   │ │(green)   │ │(green)   │  │   JetBrains Mono
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  INVESTMENTS BAND (bg: #ffffff, pb-24)                  │
│                                                         │
│  My Investments    [🔍 Search...]  [Type ▼]  [+ Add]   │ ← toolbar
│                                                         │
│  ┌──────┬──────┬──────────┬──────────┬───────┬──────┐  │
│  │ Name │ Type │ Invested │ Curr Val │ P/L   │ Date │  │ ← table header
│  ├──────┼──────┼──────────┼──────────┼───────┼──────┤  │
│  │Apple │[Stk] │$10,000   │$12,500   │+$2.5k │...   │  │ ← asset-row
│  │BTC   │[Cry] │$5,000    │$4,200    │-$800  │...   │  │   profit-up/down-cell
│  │...   │      │          │          │       │      │  │
│  └──────┴──────┴──────────┴──────────┴───────┴──────┘  │
│                                                         │
│       [← Prev]  [1] [2] [3]  [Next →]                  │ ← pagination
│                                                         │
├─────────────────────────────────────────────────────────┤
│  CTA BAND (bg: #0a0b0d)                                 │
│  "Track your wealth with confidence"                    │
│  [Get Started]                                          │
├─────────────────────────────────────────────────────────┤
│  FOOTER (bg: #ffffff)                                   │
│  © 2026 Finance Portfolio Tracker                       │
└─────────────────────────────────────────────────────────┘
```

---

### 4C. Add/Edit Investment Dialog

```
┌────────────────────────────────────────┐
│  Add Investment                   ✕   │ ← Dialog header
│  ──────────────────────────────────── │
│                                        │
│  Investment Name                       │
│  ┌──────────────────────────────────┐  │
│  │ e.g. Apple Inc.                  │  │ ← text-input (light)
│  └──────────────────────────────────┘  │
│                                        │
│  Investment Type                       │
│  ┌──────────────────────────────────┐  │
│  │ e.g. Stocks                      │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Invested Amount          Current Value│
│  ┌───────────────┐  ┌───────────────┐  │
│  │ $ 10000       │  │ $ 12500       │  │
│  └───────────────┘  └───────────────┘  │
│                                        │
│  Purchase Date                         │
│  ┌──────────────────────────────────┐  │
│  │ 2024-01-15                       │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ──────────────────────────────────── │
│  [    Cancel    ]    [Save Investment] │ ← secondary pill | primary pill
└────────────────────────────────────────┘
Max-width: 520px, rounded-xl, padding 32px
```

---

### 4D. Delete Confirmation AlertDialog

```
┌───────────────────────────────────────┐
│  Delete Investment?                   │
│                                       │
│  This will permanently remove this   │
│  investment record. This action       │
│  cannot be undone.                    │
│                                       │
│  ─────────────────────────────────── │
│  [     Cancel     ]  [ Delete ]       │ ← secondary pill | red pill (#cf202f)
└───────────────────────────────────────┘
Max-width: 400px, rounded-xl, padding 32px
```

---

## 5. Empty & Error States

### 5A. Empty Investments Table
```
┌─────────────────────────────────────────────┐
│  (no rows)                                  │
│                                             │
│         📊  (icon/illustration)             │
│         No investments yet                  │  ← Inter 18px 600 #0a0b0d
│         Add your first investment to start  │  ← Inter 14px #5b616e
│         tracking your portfolio.            │
│                                             │
│         [Add Investment]                    │  ← primary pill button
└─────────────────────────────────────────────┘
```

### 5B. No Search Results
```
         🔍  No results found
         No investments match your search.      ← #5b616e
         [Clear filters]                        ← text button, #0052ff
```

### 5C. API Error Toast
```
Position: top-right, 16px from edge
Duration: 5 seconds auto-dismiss
Style: white card, red left border (4px #cf202f), shadow
Text: error message from API response
```

### 5D. Loading State
```
Table: skeleton rows (shimmer animation, #eef0f3 background)
Stats cards: skeleton placeholder blocks
Pagination: hidden while loading
```

---

## 6. Responsive Flow Changes

### Mobile (< 640px)

**Investments Table:**
- Show only: Name, Current Value, Profit/Loss
- Tap row → expand drawer with all fields
- No Edit/Delete icons inline → accessible via expanded row

**Pagination:**
- Only [← Prev] and [Next →] (no page number pills)
- Current page shown as text: "Page 2 of 4"

**Add/Edit Dialog:**
- Full-screen bottom sheet (shadcn Drawer)
- Single-column form layout
- Sticky [Cancel] / [Save] buttons at bottom of sheet

**Portfolio Summary:**
- 2×2 grid (not 4-column row)

---

## 7. API Call Sequence (per screen)

### `/investments` Page Initial Load
```
1. GET /portfolio/summary          → portfolio cards data
2. GET /investments?page=1&limit=10 → table data + pagination meta
(Both calls fire in parallel — Promise.all)
```

### After Add/Edit/Delete
```
1. Mutation call (POST / PUT / DELETE)
2. On success:
   → GET /investments?page=<current>&limit=10  (table)
   → GET /portfolio/summary                     (stats)
   (Both refetch in parallel)
```

### On Search/Filter Change
```
1. Debounce 300ms
2. Reset page to 1
3. GET /investments?page=1&limit=10&search=X&investmentType=Y
```

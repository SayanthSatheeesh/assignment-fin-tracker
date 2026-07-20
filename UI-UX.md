# UI-UX.md — Finance Portfolio Tracker
> Complete design specification derived from `DESIGN-coinbase.md`. All component decisions reference design tokens, not inline hex values.

---

## 1. Design System Foundation

### Font Stack
```css
/* Load via next/font or Google Fonts */
--font-display: 'Inter', -apple-system, system-ui, sans-serif;
--font-body:    'Inter', sans-serif;
--font-mono:    'JetBrains Mono', 'Geist Mono', monospace;
```

### Color Variables
```css
:root {
  --primary:               #0052ff;
  --primary-active:        #003ecc;
  --primary-disabled:      #a8b8cc;
  --ink:                   #0a0b0d;
  --body-text:             #5b616e;
  --muted:                 #7c828a;
  --muted-soft:            #a8acb3;
  --hairline:              #dee1e6;
  --hairline-soft:         #eef0f3;
  --canvas:                #ffffff;
  --surface-soft:          #f7f7f7;
  --surface-strong:        #eef0f3;
  --surface-dark:          #0a0b0d;
  --surface-dark-elevated: #16181c;
  --on-dark:               #ffffff;
  --on-dark-soft:          #a8acb3;
  --semantic-up:           #05b169;
  --semantic-down:         #cf202f;
}
```

### Tailwind Config Extensions
```js
// tailwind.config.ts additions
colors: {
  primary: '#0052ff',
  'primary-active': '#003ecc',
  'primary-disabled': '#a8b8cc',
  ink: '#0a0b0d',
  'body-text': '#5b616e',
  muted: '#7c828a',
  hairline: '#dee1e6',
  canvas: '#ffffff',
  'surface-soft': '#f7f7f7',
  'surface-strong': '#eef0f3',
  'surface-dark': '#0a0b0d',
  'surface-dark-elevated': '#16181c',
  'semantic-up': '#05b169',
  'semantic-down': '#cf202f',
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
  display: ['Inter', 'system-ui', 'sans-serif'],
  body:    ['Inter', 'sans-serif'],
  mono:    ['JetBrains Mono', 'Geist Mono', 'monospace'],
},
```

---

## 2. Global Layout Rules

### Spacing Rhythm
- Page bands: `96px` top/bottom padding
- Card internal padding: `32px`
- Gap between cards in a grid: `24px`
- Base unit: `4px` (use multiples of 4 for all spacing)

### Max Width
- Content container: `max-w-[1200px] mx-auto`
- Full-bleed dark bands expand edge-to-edge; inner content stays capped at 1200px

### Band Rotation Pattern
```
Page = [DarkHeroBand] → [WhiteBand] → [SoftGrayBand] → [WhiteBand] → [DarkCTABand] → [Footer]
```

---

## 3. Navigation Component

### Light Nav (White Pages)
```
Height: 64px
Background: #ffffff
Border-bottom: 1px solid #dee1e6
Layout:
  Left:   Logo wordmark (Inter 600, #0052ff)
  Center: Nav links (Inter 14px / 500, #0a0b0d)
  Right:  [Log In] (text button, #0052ff) + [Get Started] (pill, #0052ff bg)
```

### Dark Nav (Dark Hero Pages — Auth)
```
Height: 64px
Background: transparent (floats over dark hero)
Border-bottom: 1px solid rgba(255,255,255,0.08)
Text: #ffffff
Sign Up pill: #0052ff (same — blue stays consistent)
```

### Mobile Nav
- Collapses to hamburger sheet below 768px
- Sign Up CTA stays visible in the collapsed state

---

## 4. Page-by-Page Design Spec

---

### 4A. Root Page (`/`) — Redirect Only
No UI. Middleware checks auth token:
- If authenticated → redirect to `/investments`
- If unauthenticated → redirect to `/login`

---

### 4B. Login Page (`/login`)

**Overall:** Dark hero band full-bleed. Card floats center.

#### Hero Band
```
Background: #0a0b0d (surface-dark)
Min-height: 100vh
Layout: centered card
```

#### Login Card (product-ui-card-dark)
```
Background: #16181c (surface-dark-elevated)
Border-radius: 24px (xl)
Padding: 40px
Width: 400px (max)
Border: 1px solid rgba(255,255,255,0.06)
Box-shadow: 0 8px 32px rgba(0,0,0,0.4)
```

#### Card Contents (top to bottom)
```
1. Logo mark — "PortfolioTracker" Inter 600 18px, #0052ff
2. Heading — "Welcome back" Inter 400 32px, #ffffff, -0.4px tracking
3. Subtext — "Sign in to your account" Inter 400 14px, #a8acb3
4. [Spacer 24px]
5. Email input (text-input spec)
6. Password input (text-input spec)
7. [Spacer 20px]
8. [Sign In] button — full width, pill, #0052ff bg, white text
9. [Spacer 16px]
10. Inline error (if any) — #cf202f, 14px
11. Divider hairline
12. "Don't have an account?" #a8acb3 + "Register" #0052ff link
```

#### Input Spec (text-input)
```
Background: rgba(255,255,255,0.05)
Border: 1px solid rgba(255,255,255,0.10)
Border-radius: 12px (md)
Height: 48px
Padding: 14px 16px
Text: #ffffff, Inter 16px 400
Placeholder: #7c828a
Focus: border 2px solid #0052ff, outline none
```

#### Button Spec (primary on dark)
```
Background: #0052ff
Text: #ffffff, Inter 16px 600
Border-radius: 100px (pill)
Height: 44px
Width: 100%
Active: background #003ecc
Disabled: background #a8b8cc
```

---

### 4C. Register Page (`/register`)

**Overall:** Same dark hero as login. Card slightly taller.

#### Card Contents
```
1. Logo mark
2. Heading — "Create account" Inter 400 32px, #ffffff
3. Subtext — "Start tracking your portfolio" #a8acb3
4. [Spacer 24px]
5. Full Name input
6. Email input
7. Password input
8. [Spacer 20px]
9. [Create Account] primary pill button (full width)
10. Inline error if any
11. Divider
12. "Already have an account?" + "Sign In" link
```

---

### 4D. Investments Page (`/investments`)

**Layout:** Light hero header → White investments band

#### Section 1: Portfolio Summary Band (feature-card style, light)
```
Background: #ffffff
Padding: 48px 0
Border-bottom: 1px solid #dee1e6

Contents: 4 stat cards in a horizontal row
```

**Stat Card (feature-card)**
```
Background: #ffffff
Border: 1px solid #dee1e6
Border-radius: 24px (xl)
Padding: 32px
Width: ~25% each (flex row)
Gap: 24px between cards
```

**Stat Card Inner**
```
Label: "Total Invested" | Inter 12px 600 uppercase #7c828a
Value: "$50,000.00"     | JetBrains Mono 28px 500 #0a0b0d
Sub-label (Profit card): "+$12,000" in #05b169 OR "-$X" in #cf202f
  — color is text only, no background fill
```

**The 4 Cards:**
1. **Total Invested** — Total principal (Mono)
2. **Current Value** — Current market value (Mono)
3. **Total Profit/Loss** — Color-coded: green (#05b169) if positive, red (#cf202f) if negative
4. **Return %** — `+24.00%` (Mono, same color rule)

> The profit stat card uses `pricing-tier-featured` treatment on the dark variant option — dark background card with white text if you want a visual highlight. Otherwise all 4 use `feature-card` light style.

---

#### Section 2: Investments Table Band
```
Background: #ffffff
Padding: 48px 0 96px
```

**Table Toolbar (above table)**
```
Layout: [Title "Investments"] [spacer] [Search pill] [Type filter] [Add Investment button]

Search pill (search-input-pill):
  Background: #eef0f3
  Border-radius: 100px
  Height: 44px
  Padding: 12px 20px
  Icon: search icon left

Type filter dropdown (search-input-pill style):
  Background: #eef0f3
  Border-radius: 100px
  Same dimensions

Add Investment button (button-primary):
  Background: #0052ff
  Border-radius: 100px
  Height: 44px
  Padding: 12px 20px
  Text: "+ Add Investment" Inter 16px 600 white
```

**Table (asset-row spec)**
```
Header row: Inter 12px 600 uppercase #7c828a, border-bottom 1px #dee1e6
Data rows: border-bottom 1px #eef0f3, height 64px

Columns:
  Name         → Inter 16px 600 #0a0b0d  + ticker badge (badge-pill)
  Type         → badge-pill: #eef0f3 bg, #0a0b0d text, Inter 12px 600, pill radius
  Invested     → JetBrains Mono 16px 500 #0a0b0d  (right-aligned)
  Current Val  → JetBrains Mono 16px 500 #0a0b0d  (right-aligned)
  Profit/Loss  → JetBrains Mono 16px 500
                  Positive: #05b169 (price-up-cell)
                  Negative: #cf202f (price-down-cell)
                  — text color only, transparent background
  Purchase Date → Inter 14px 400 #5b616e
  Actions      → [Edit icon] [Delete icon] — 32px icon buttons
```

**Row Hover State**
```
Background: #f7f7f7 (surface-soft)
Transition: background 150ms ease
```

---

#### Pagination Controls
```
Layout: centered below table, 48px margin-top
Previous / Next buttons: button-secondary-light (pill, #eef0f3 bg, #0a0b0d text)
Page numbers: same secondary style; active page: #0052ff bg, white text
Gap: 8px between controls
Font: Inter 14px 500
```

---

#### Add/Edit Investment Dialog
```
Trigger: "Add Investment" button OR row Edit icon
Component: shadcn Dialog
```

**Dialog Card**
```
Background: #ffffff
Border-radius: 24px (xl)
Padding: 32px
Max-width: 520px
```

**Form Fields** (text-input spec — light variant)
```
Background: #ffffff
Border: 1px solid #dee1e6
Border-radius: 12px
Height: 48px
Focus: border 2px solid #0052ff
Text: #0a0b0d

Fields:
  Investment Name      — text input
  Investment Type      — text input (free text)
  Invested Amount      — number input ($ prefix icon)
  Current Value        — number input ($ prefix icon)
  Purchase Date        — date input
```

**Dialog Footer**
```
[Cancel] secondary-light pill button
[Save / Update] primary pill button (#0052ff)
Gap: 12px between
```

---

#### Delete Confirmation Dialog
```
Component: shadcn AlertDialog
Max-width: 400px
Border-radius: 24px
Padding: 32px

Heading: "Delete Investment?" Inter 18px 600 #0a0b0d
Body: "This action cannot be undone." Inter 16px 400 #5b616e
[Cancel] secondary-light pill
[Delete] — pill, background #cf202f, text white
```

---

### 4E. CTA Pre-Footer Band (on all pages below main content)
```
Background: #0a0b0d (surface-dark)
Padding: 96px
Text-align: center

Heading: Inter 400 52px #ffffff -1.3px letter-spacing
Sub: Inter 16px 400 #a8acb3
CTA: [Get Started] button-pill-cta (#0052ff, 56px height, 32px h-padding)
```

---

### 4F. Footer
```
Background: #ffffff
Padding: 64px 48px
Border-top: 1px solid #dee1e6

Layout: 3-column link grid
Text: Inter 14px 400 #5b616e

Legal band (bottom strip):
  Text: Inter 13px 400 #7c828a
  "© 2026 Finance Portfolio Tracker. All rights reserved."
```

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Changes |
|---|---|---|
| Mobile | < 640px | Display hero 80→40px; stat cards 1-col stack; table cols reduced; hamburger nav; dialog full-screen sheet |
| Tablet | 640–1024px | Display 64px; stat cards 2-col; table horizontal but compressed |
| Desktop | 1024–1280px | Full layout; stat cards 4-col row |
| Wide | > 1280px | Content caps at 1200px |

### Mobile Table Behavior
- Columns: Name, Current Value, Profit (3 only)
- "View details" tap expands a drawer with all fields
- Pagination: Previous / Next only (no page numbers)

### Mobile Dialog
- Full-screen bottom sheet (shadcn Drawer)
- Same form fields, single-column layout

---

## 6. Component Quick Reference

### Primary Button
```
className="bg-primary text-white font-semibold text-base
           rounded-pill px-5 py-3 h-11 hover:bg-primary-active
           disabled:bg-primary-disabled transition-colors"
```

### Secondary Button (Light)
```
className="bg-surface-strong text-ink font-semibold text-base
           rounded-pill px-5 py-3 h-11 hover:bg-hairline transition-colors"
```

### Badge Pill (Investment Type)
```
className="bg-surface-strong text-ink font-semibold text-xs
           rounded-pill px-3 py-1 uppercase tracking-wide"
```

### Search Pill Input
```
className="bg-surface-strong text-ink text-base
           rounded-pill px-5 py-3 h-11 border-none outline-none
           focus:ring-2 focus:ring-primary"
```

### Text Input (Light)
```
className="bg-canvas text-ink text-base
           rounded-md px-4 py-3.5 h-12
           border border-hairline
           focus:border-2 focus:border-primary focus:outline-none"
```

### Number Display Cell
```
className="font-mono text-base font-medium tabular-nums"
// Profit positive: + "text-semantic-up"
// Profit negative: + "text-semantic-down"
```

---

## 7. Typography Class Mapping

```css
.display-hero   { font-family: var(--font-display); font-size: 80px; font-weight: 400; letter-spacing: -2px; line-height: 1.0; }
.display-lg     { font-size: 52px; font-weight: 400; letter-spacing: -1.3px; }
.display-md     { font-size: 44px; font-weight: 400; letter-spacing: -1px; }
.title-lg       { font-size: 32px; font-weight: 400; letter-spacing: -0.4px; }
.title-md       { font-size: 18px; font-weight: 600; }
.title-sm       { font-size: 16px; font-weight: 600; }
.body-md        { font-size: 16px; font-weight: 400; line-height: 1.5; }
.body-sm        { font-size: 14px; font-weight: 400; line-height: 1.5; }
.caption        { font-size: 13px; font-weight: 400; }
.number-display { font-family: var(--font-mono); font-size: 18px; font-weight: 500; }
```

---

## 8. Do's and Don'ts Summary

### Do
- Use `#0052ff` only for primary CTAs, wordmark, inline accent links
- Pill geometry on all buttons (100px radius)
- JetBrains Mono on every financial number
- `#05b169` / `#cf202f` as text color only for profit/loss — never as button or background fill
- One shadow tier max: `0 4px 12px rgba(0,0,0,0.04)`
- Dark hero band (#0a0b0d) for auth pages and pre-footer CTA band

### Don't
- No secondary brand colors beyond blue
- No bold display copy (display stays at weight 400)
- No sharp corners on any interactive element
- No gradient backgrounds (only solid fills from the token set)
- No multiple shadow tiers
- Don't use trading red/green as button backgrounds

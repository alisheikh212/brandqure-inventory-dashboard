# BrandQure Inventory Command Center — Project Handoff

> **For:** Codex or any coding agent continuing this project
> **Phase completed:** Phase 3A (Supabase auth) + Phase 3B (Google Sheets integration) + Phase 3C stabilization pass
> **Date last updated:** 2026-05-19

---

## 1. Current Project Goal

Build a premium inventory management dashboard for **BrandQure** — a marketing/brand agency that manages Amazon FBA and 3PL inventory for multiple clients. The app is called the **Inventory Command Center**.

**Phase 1 goal (complete):** Pixel-faithful recreation of the Stitch design export as a working Next.js app with mock data only — no real auth, no Supabase, no Google Sheets API, no PDF library. Every screen renders correctly. The Stitch visual design is fully preserved.

**Phase 2 goal (not started):** Wire in real data: Supabase for auth + persistence, Google Sheets as inventory source, Resend for email, real PDF generation.

---

## 2. Current Folder Structure

```
brandqure-inventory-dashboard/
├── app/
│   ├── globals.css                        # Tailwind v4 tokens + custom utilities
│   ├── layout.tsx                         # Root layout — Geist font + Material Symbols link
│   ├── page.tsx                           # Redirects to /login
│   ├── (auth)/
│   │   ├── layout.tsx                     # Passthrough (no shell)
│   │   └── login/
│   │       └── page.tsx                   # Login screen (dark glassmorphism)
│   └── (app)/
│       ├── layout.tsx                     # App shell: Sidebar + Header + content wrapper
│       ├── admin/
│       │   └── page.tsx                   # Client selection grid
│       └── dashboard/
│           └── [clientSlug]/
│               ├── page.tsx               # Per-client inventory dashboard
│               └── print/
│                   └── page.tsx           # Print/export report view
├── components/
│   ├── brand/
│   │   └── BrandQureLogo.tsx              # SVG logo (dark + white variants)
│   ├── dashboard/
│   │   ├── DashboardContent.tsx           # 'use client' — orchestrates dashboard state
│   │   ├── InventoryHealthVisual.tsx      # CSS bar chart (server component)
│   │   ├── InventoryTable.tsx             # 'use client' — filterable inventory table
│   │   ├── SafeZoneVisual.tsx             # CSS ring gauge (server component)
│   │   ├── SummaryCards.tsx               # 4-card KPI strip (server component)
│   │   └── UpcomingInventoryTimeline.tsx  # PO timeline (server component)
│   ├── layout/
│   │   ├── Header.tsx                     # Fixed top bar with search + avatar
│   │   └── Sidebar.tsx                    # 'use client' — fixed nav with active state
│   ├── modals/
│   │   ├── AddOrderedUnitsModal.tsx       # 'use client' — add PO modal
│   │   └── Update3PLStatusModal.tsx       # 'use client' — update 3PL status modal
│   ├── print/
│   │   └── PrintButton.tsx               # 'use client' — window.print() button
│   └── ui/
│       ├── Modal.tsx                      # 'use client' — reusable modal shell
│       └── StatusBadge.tsx               # InventoryStatusBadge + StockHealthBadge
├── lib/
│   ├── mock-data.ts                       # All types, mock clients, inventory rows, POs
│   ├── reorder.ts                         # Pure reorder calculation engine
│   └── supabase/
│       ├── client.ts                      # Browser Supabase client (createBrowserClient)
│       └── server.ts                      # Server Supabase client with cookie handling (createServerClient)
├── docs/
│   └── google-sheets-schema.md            # Approved per-client Google Sheets schema (Phase 3B reference)
├── stitch-reference/                      # READ-ONLY source of truth for design
│   ├── premium_executive_interface/       # Main dashboard design + DESIGN.md
│   ├── login_screen/                      # Login page design
│   ├── admin_client_selection/            # Admin/client picker design
│   ├── inventory_command_center/          # Inventory table design
│   ├── modal_add_ordered_units/           # Add units modal design
│   ├── modal_update_3pl_status/           # Update 3PL modal design
│   ├── print_export_report/               # Print report design
│   └── reusable_components/               # Shared component design tokens
├── proxy.ts                               # Next.js 16 route guard (renamed from middleware.ts — see §12)
├── next.config.ts                         # Empty (default)
├── postcss.config.mjs                     # { "@tailwindcss/postcss": {} }
├── tsconfig.json                          # strict, bundler moduleResolution, @/* alias
└── package.json
```

---

## 3. What Has Already Been Changed

All files listed below were **created from scratch** (none existed before Phase 1):

| File | Status |
|------|--------|
| `app/globals.css` | Replaced default Next.js CSS with full Tailwind v4 + MD3 design tokens |
| `app/layout.tsx` | Geist font + Material Symbols `<link>` tag |
| `app/page.tsx` | Root redirect to `/login` |
| `app/(auth)/layout.tsx` | Passthrough layout |
| `app/(auth)/login/page.tsx` | Full login screen |
| `app/(app)/layout.tsx` | App shell layout |
| `app/(app)/admin/page.tsx` | Client selection grid |
| `app/(app)/dashboard/[clientSlug]/page.tsx` | Dashboard page |
| `app/(app)/dashboard/[clientSlug]/print/page.tsx` | Print report page |
| `lib/mock-data.ts` | All mock data and types |
| `components/brand/BrandQureLogo.tsx` | SVG logo |
| `components/dashboard/DashboardContent.tsx` | Dashboard state orchestrator |
| `components/dashboard/InventoryHealthVisual.tsx` | Bar chart visual |
| `components/dashboard/InventoryTable.tsx` | Inventory table |
| `components/dashboard/SafeZoneVisual.tsx` | Ring gauge visual |
| `components/dashboard/SummaryCards.tsx` | KPI cards |
| `components/dashboard/UpcomingInventoryTimeline.tsx` | PO timeline |
| `components/layout/Header.tsx` | Top header |
| `components/layout/Sidebar.tsx` | Left sidebar |
| `components/modals/AddOrderedUnitsModal.tsx` | Add units modal |
| `components/modals/Update3PLStatusModal.tsx` | Update 3PL modal |
| `components/print/PrintButton.tsx` | Print trigger |
| `components/ui/Modal.tsx` | Modal shell |
| `components/ui/StatusBadge.tsx` | Status badges |

---

## 4. Current Working Routes / Pages

| URL | HTTP | Description |
|-----|------|-------------|
| `/` | 307 → `/login` | Root redirect |
| `/login` | 200 | Login screen — real Supabase `signInWithPassword()` auth |
| `/logout` | POST → `/login` | Route handler — signs out and redirects |
| `/admin` | 200 | Client selection grid (admin role only) — redirects clients to their dashboard |
| `/dashboard/[clientSlug]` | 200 | Inventory dashboard — client users restricted to their own slug |
| `/dashboard/[clientSlug]/reorder` | 200 | Reorder planning page |
| `/dashboard/[clientSlug]/print` | 200 | Print report |

All `(app)` routes are protected by `proxy.ts`. Unauthenticated requests redirect to `/login`.

Dev server runs on **port 3000** (`npm run dev` inside `brandqure-inventory-dashboard/`).

---

## 5. Current Styling / CSS Setup

**Framework:** Tailwind CSS v4 (not v3). This is a breaking change — no `tailwind.config.ts` file exists or is needed.

**How Tailwind v4 works here:**
- `app/globals.css` starts with `@import "tailwindcss"` — this is a Tailwind-specific directive, not a standard CSS import. PostCSS (`@tailwindcss/postcss`) expands it at build time.
- All design tokens live in `@theme {}` blocks using CSS custom properties: `--color-primary`, `--color-secondary`, etc. These auto-generate utility classes (`bg-primary`, `text-secondary`, `border-outline-variant`, etc.).
- Custom compound utilities (typography roles, glassmorphism classes) live in `@layer utilities {}` blocks.

**Critical CSS rule:** Any `@import url(...)` statements MUST appear before `@import "tailwindcss"` in `globals.css`, or PostCSS will crash at build time with: `@import rules must precede all rules aside from @charset and @layer statements`. The Material Symbols font is loaded via a `<link>` tag in `app/layout.tsx` to avoid this issue.

**Design token system:** Material Design 3 (MD3) color roles are used throughout:
- `primary` / `on-primary` / `primary-container` / `on-primary-container`
- `secondary` / `on-secondary` / `secondary-container`
- `tertiary` / `tertiary-container` / `on-tertiary-fixed-variant`
- `error` / `error-container`
- `surface`, `surface-variant`, `surface-container-{lowest/low/mid/high/highest}`
- `outline` / `outline-variant`

**Typography roles** (compound utilities, not Tailwind defaults):
- `.text-display-lg` — 48px/56px, weight 700
- `.text-headline-lg` — 32px/40px, weight 600
- `.text-headline-md` — 24px/32px, weight 600
- `.text-body-lg` — 18px/28px, weight 400
- `.text-body-md` — 16px/24px, weight 400
- `.text-label-md` — 14px/20px, weight 500
- `.text-label-sm` — 12px/16px, weight 600
- `.text-numeric-data` — 20px/24px, weight 600

**Fonts:**
- **Geist** — loaded via `next/font/google`, CSS variable `--font-geist-sans`, applied as `--font-sans` in `@theme {}`
- **Material Symbols Outlined** — loaded via `<link>` in root layout; usage: `<span className="material-symbols-outlined">icon_name</span>`

---

## 6. Known Issues / Warnings

| Issue | Severity | Status |
|-------|----------|--------|
| Turbopack lockfile warning: multiple `package-lock.json` found | Low | Benign — suppress with `turbopack.root` in `next.config.ts` if desired |
| `@next/next/no-page-custom-font` ESLint warning on `app/layout.tsx:24` | Low | Suppressed with `eslint-disable-next-line` comment; this rule is designed for Pages Router only and does not apply to App Router |
| Charts are CSS-only placeholders | Medium | `InventoryHealthVisual` (bar chart) and `SafeZoneVisual` (ring gauge) are decorative. Phase 4 should replace with Recharts or similar |
| Modal form submissions are console.log only | Medium | Both modals log to console and do nothing. Phase 3C PO persistence work will wire these up |
| ~~Login has no real auth~~ | ~~Medium~~ | **Resolved in Phase 3A** — real Supabase auth, role-based redirects |
| Stale `.next/` cache after CSS changes | Low | If CSS edits don't take effect, run `rm -rf .next` and restart the dev server |
| ~~`generateStaticParams()` on print page used hardcoded mock slugs~~ | ~~Medium~~ | **Resolved in Phase 3C stabilization** — removed; print page is now fully dynamic and uses live data |
| "Remember me" checkbox is decorative | Low | No effect on session duration; Supabase JWT expiry controls sessions |
| "Forgot Password?" link goes to `#` | Low | No self-service recovery path yet |
| Warehouse capacity on print page is hardcoded at 84% | Low | Cosmetic placeholder — no 3PL data source exists yet |
| Report ID `REP-883A-91X` is hardcoded for all print reports | Low | Cosmetic — replace when PO persistence is added in Phase 3C |

---

## 7. Exact Commands to Run the Project

```bash
# Navigate to the app directory
cd /Users/alisheikh/Downloads/stitch_brandqure_inventory_command_center/brandqure-inventory-dashboard

# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
# → http://localhost:3001

# Type-check only
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build

# Start production server (after build)
npm start
```

> **Note:** The project directory is nested inside the monorepo-like folder `stitch_brandqure_inventory_command_center/`. Always `cd` into `brandqure-inventory-dashboard/` before running npm commands.

---

## 8. Next Recommended Implementation Steps

### Phase 2A — Authentication (Supabase)
1. Add `@supabase/supabase-js` and `@supabase/ssr`
2. Create `lib/supabase/client.ts` and `lib/supabase/server.ts` following the Next.js App Router SSR pattern
3. Add `middleware.ts` at project root to protect `(app)` routes
4. Wire `app/(auth)/login/page.tsx` to call `supabase.auth.signInWithPassword()`
5. Add `app/(auth)/logout/route.ts` as a Route Handler
6. Replace `router.push('/admin')` in login with real auth flow

### Phase 2B — Real Inventory Data (Google Sheets)
1. Set up Google Sheets API credentials (service account JSON → env vars)
2. Create `lib/sheets.ts` with a typed fetch function returning `InventoryRow[]`
3. Make `app/(app)/dashboard/[clientSlug]/page.tsx` call the Sheets API (server component, so direct fetch is fine)
4. Add loading states (`loading.tsx` files) for async data fetching
5. Add `revalidate` or on-demand revalidation for cache control

### Phase 2C — Modal Persistence
1. Add Supabase tables: `purchase_orders`, `inventory_updates`
2. Create Server Actions in `app/actions/` for modal form submissions
3. Replace `console.log` in `AddOrderedUnitsModal` and `Update3PLStatusModal` with `useActionState` + Server Actions
4. Show optimistic UI updates after submission

### Phase 2D — Real Charts
1. Install `recharts` (works well with Tailwind + RSC data passing)
2. Replace `InventoryHealthVisual` with a real `<BarChart>` using last-12-months data
3. Replace `SafeZoneVisual` with a `<RadialBarChart>` or `<PieChart>`

### Phase 2E — PDF Generation
1. Install `@react-pdf/renderer` or use Puppeteer headless for server-side PDF
2. Create `app/(app)/dashboard/[clientSlug]/print/pdf/route.ts` as a Route Handler
3. Wire `PrintButton` to download the PDF rather than calling `window.print()`

---

## 9. Important Design Rules to Preserve (from Stitch Export)

These rules must be maintained as Phase 2 features are added. They are derived from `stitch-reference/premium_executive_interface/DESIGN.md`.

1. **Dark sidebar, light content area.** The sidebar (`glass-sidebar`) uses a near-black navy (`rgba(15,23,42,0.95)`) with white text. The main content area uses `bg-background` (`#f9f9ff`). Never invert this.

2. **Primary is black, secondary is teal, tertiary accent is deep indigo.** `--color-primary: #000000`, `--color-secondary: #00668a`, `--color-tertiary-container: #07006c`, `--color-on-tertiary-fixed-variant: #2f2ebe`. Button gradients use the deep indigo range for primary CTAs and teal for secondary CTAs.

3. **Typography scale is fixed.** Do not use Tailwind's default `text-sm`, `text-lg` etc. for branded text — use the role-based classes (`text-label-md`, `text-headline-lg`, `text-numeric-data`, etc.) so type hierarchy is consistent with the Stitch design.

4. **No hard shadows.** Cards use extremely subtle box-shadows (`0 10px 15px -3px rgba(0,0,0,0.03)`). The design uses surface color layering for depth, not drop shadows.

5. **`data-card` for all dashboard cards.** White background, `border border-outline-variant` (light grey), `rounded-[12px]`, subtle shadow. Never use colored card backgrounds for data cards.

6. **Status badge color system.** Must follow:
   - `Out of Stock` / `Critical Low` → error-container background, error text
   - `Healthy` / `In Stock` → secondary-fixed background, on-secondary-fixed text
   - `Overstock` → surface-variant background, on-surface-variant text
   - `Inbound` / `Processing` → primary-container background, inverse-primary text

7. **Print layout.** The print report must remain in the `(app)` route group. Use `print-hidden` on Sidebar and Header. Use `print:ml-0 print:pt-0` on the content wrapper. The document has a fixed max-width of 816px (US Letter simulation). Never add a separate layout file for the print route.

8. **Glassmorphism.** Login card and sidebar use `backdrop-filter: blur()`. Do not remove these — they are core to the premium feel. The `glass-card` and `glass-sidebar` utility classes are defined in `globals.css`.

9. **Geist is the only body font.** Material Symbols Outlined is for icons only. No other fonts should be added.

10. **Route group structure must stay intact.** `(auth)` has no shell. `(app)` always renders Sidebar + Header. This separation is intentional — do not merge the layouts.

---

## 10. Assumptions Made So Far

1. **Tailwind v4** was used even though it was not explicitly specified. The `package.json` had `"tailwindcss": "^4"` — this was treated as intentional. The entire token system was rebuilt for v4's `@theme {}` syntax.

2. **4 fixed client slugs** were chosen for `generateStaticParams()`: `demo-client`, `acme-corp`, `techlogix`, `global-retailers`. These match the `CLIENTS` array in `lib/mock-data.ts`. Phase 2 should replace this with dynamic slug generation from Supabase.

3. **The Stitch HTML files are reference-only.** No code was copied from the Stitch export — the components were rebuilt in React/TypeScript from scratch using the Stitch designs as visual reference. The `stitch-reference/` folder should remain as-is for Phase 2 reference.

4. **No real auth is needed for Phase 1.** The login form accepts any input and redirects to `/admin`. There is no session, no cookie, no redirect middleware. Phase 2 will add real auth.

5. **The `(app)` shell wraps all authenticated routes.** If new routes need to be added outside the auth shell (e.g., a public landing page), they should be added to a new `(public)` route group, not placed directly in `app/`.

6. **Material Symbols Outlined is loaded via `<link>` in the root layout,** not via `@import url(...)` in CSS. This is required because Tailwind v4's PostCSS expansion makes late `@import url(...)` statements illegal. The `eslint-disable-next-line` comment on that `<link>` tag is intentional.

7. **`npm run build` compiles clean** (0 errors, 0 warnings) as of Phase 1 completion. The only lint suppression is the one `eslint-disable-next-line` for the font `<link>`.

8. **Charts are intentionally CSS-only for Phase 1.** The `InventoryHealthVisual` bar chart and `SafeZoneVisual` ring gauge are decorative placeholders. Real data-driven charts were deferred to Phase 2D.

9. **The report ID `REP-883A-91X`** in the print page is hardcoded. In Phase 2, this should be generated server-side or stored in the database per report.

10. **`lib/mock-data.ts` is the single source of truth for Phase 1 data.** All mock clients, inventory rows, purchase orders, and summary stats live there. No external data sources are used. Phase 2 will replace this module's output with real API calls while preserving the TypeScript types.

---

## 11. Latest UI & Logic Updates (Phase 2 — completed 2026-05-14)

### What Changed

#### Reorder Planning Page (`/dashboard/[clientSlug]/reorder`)
- New route added per client: `/dashboard/acme-corp/reorder`, `/dashboard/techlogix/reorder`, etc.
- `components/reorder/ReorderTable.tsx` — fully redesigned table with 8 columns:
  **SKU / Product | Marketplace | Current FBA Stock | Inbound | Stock Coverage | Lead Time | Reorder Recommendation | Status**
- **Stock Coverage** cell shows `"X days left"` label + a progress bar (0–90 day scale). Days calculated from `(fbaAvailable + inboundUnits) / avgDailySales`.
- **Reorder Recommendation** shows quantity + subtext `"covers next 60 days after lead time"`. Never mentions daily sales rate.
- Alert summary tiles (Reorder Now / Reorder Soon / Healthy counts) appear above the table with a 3px colored top-accent strip.
- Sidebar now includes a **Reorder Planning** nav item (`shopping_cart` icon); link is client-aware via `usePathname()`.

#### `avgDailySales` — Removed from All Client-Facing UI
- The field remains on `InventoryRow` and is used by `lib/reorder.ts` for all calculations internally.
- It is **not rendered in any column, card, or metric** anywhere in the UI.
- If you see `avgDailySales` in a rendered column, that is a bug — remove it.

#### KPI Cards (`SummaryCards.tsx`) — Renamed
| Old label | New label |
|-----------|-----------|
| Total SKUs | Active SKUs |
| Out of Stock | SKUs Needing Reorder (links to `/reorder`) |
| (no equivalent) | Units Inbound |
| Health Score | Inventory Health (with mini progress bar) |

#### Inbound Timeline → Inbound Countdown
- `components/dashboard/UpcomingInventoryTimeline.tsx` — **deleted**.
- Replaced by `components/dashboard/InboundCountdown.tsx`.
- The old component showed ports, customs, and shipment-tracking style statuses. **This was conceptually wrong** — the app does not have live shipment data.
- The new component is purely **lead-time arithmetic**:
  - `expectedArrival = orderCreatedDate + leadTimeDays`
  - `daysRemaining = expectedArrival - today` (midnight-normalized, timezone-safe)
- Each order card shows: PO reference, product name, SKU, marketplace, units, days remaining or overdue, estimated arrival date, and `"Created {date} · {N}-day lead time"` context line.
- Subtitle reads: `"Based on lead time, not live tracking"` — never implies real shipment tracking.
- Overdue orders surface first (sort by days remaining ascending).
- **Mark as received** — clicking the button removes the order from the list using local React `useState`. Nothing is persisted. The order will reappear on page reload (this is intentional for the mock phase).
- Empty state: `"All caught up"` illustration with supporting copy.

#### `lib/reorder.ts` — Pure Calculation Engine (new file)
All reorder math is isolated here. Key functions:
- `stockoutInDays(row)` — FBA-only days of cover; used for "Days Until OOS" display
- `totalCoverageDays(row)` — (FBA + inbound) / avgDailySales; used for reorder status decisions
- `recommendedReorderQty(row)` — see formula below
- `getReorderStatus(row)` — returns `"Reorder Now" | "Reorder Soon" | "OK" | "Overstock"` based on `totalCoverageDays` vs `leadTimeDays`
- `computeSummaryStats(rows)` — derives all KPI card values from live row data; lives here (not in `mock-data.ts`) to avoid circular imports

#### Reorder Quantity Formula (canonical — do not change without approval)

```
target  = leadTimeDays + 60
needed  = ceil(avgDailySales × target)
reorder = max(0, needed − fbaAvailable − inboundUnits)
```

**Why this formula:**
- `leadTimeDays + 60` ensures coverage for the full transit window (lead time) **plus** 60 days of post-arrival stock. Without including lead time, you would routinely under-order since demand continues during the transit period.
- Subtracting `fbaAvailable + inboundUnits` credits inventory you already own. The recommendation is the *additional* units you are missing — not a flat replenishment on top of current stock.
- `max(0, ...)` floors the result at zero so healthy/overstock SKUs never show a negative recommendation.

**Example** — Wireless Earbuds (42 FBA, 0 inbound, 32/day, 21d lead time):
```
target  = 21 + 60 = 81 days
needed  = ceil(32 × 81) = 2,592
reorder = max(0, 2,592 − 42 − 0) = 2,550 units
```

`avgDailySales` is used only inside this calculation and is never rendered in any UI component.

#### `lib/mock-data.ts` — Schema Updates
- Added `PurchaseOrder` type: `{ id, clientSlug, poNumber, sku, productName, marketplace, units, orderCreatedDate, leadTimeDays }`
- `orderCreatedDate` is a `"YYYY-MM-DD"` ISO string; `leadTimeDays` on the PO is the actual lead time at order creation (may differ from `client.defaultLeadTimeDays`)
- Added per-client PO arrays and `getPurchaseOrdersBySlug(slug)` helper
- `InventoryRow` now has: `fbaAvailable`, `inboundUnits`, `reservedUnits`, `avgDailySales`, `leadTimeDays`
- `Client` now has `defaultLeadTimeDays` and `lastUpdated`
- `SummaryStats` now has `reorderNow`, `reorderSoon`, `healthScore`, `skuTrend`
- `computeSummaryStats` is used in dashboard page — static `CLIENT_SUMMARY` lookup removed

---

### Current Working Routes (as of Phase 2)

| URL | Description |
|-----|-------------|
| `/` | Redirects to `/login` |
| `/login` | Login screen (no real auth) |
| `/admin` | Client selection grid |
| `/dashboard/acme-corp` | Inventory dashboard |
| `/dashboard/techlogix` | Inventory dashboard |
| `/dashboard/global-retailers` | Inventory dashboard |
| `/dashboard/demo-client` | Inventory dashboard |
| `/dashboard/acme-corp/reorder` | Reorder planning page |
| `/dashboard/techlogix/reorder` | Reorder planning page |
| `/dashboard/global-retailers/reorder` | Reorder planning page |
| `/dashboard/demo-client/reorder` | Reorder planning page |
| `/dashboard/acme-corp/print` | Print report |
| `/dashboard/techlogix/print` | Print report |
| `/dashboard/global-retailers/print` | Print report |
| `/dashboard/demo-client/print` | Print report |

18 total pages compile cleanly (0 TypeScript errors, 0 lint errors).

---

### Files Changed in Phase 2

| File | Change |
|------|--------|
| `lib/mock-data.ts` | Complete rewrite — new types, per-client inventory, POs, helpers |
| `lib/reorder.ts` | **New file** — pure calculation engine |
| `components/dashboard/SummaryCards.tsx` | Redesigned — new KPI labels, progress bar, icon bubbles |
| `components/dashboard/InventoryTable.tsx` | Removed `avgDailySales` column; new `DaysUntilOOS` subcomponent |
| `components/dashboard/InboundCountdown.tsx` | **New file** — lead-time countdown, replaces timeline |
| `components/dashboard/UpcomingInventoryTimeline.tsx` | **Deleted** |
| `components/dashboard/DashboardContent.tsx` | Updated imports; added Reorder nav link |
| `components/reorder/ReorderTable.tsx` | **New file** — full reorder planning table |
| `components/layout/Sidebar.tsx` | Client-aware nav links; Reorder Planning item added |
| `app/(app)/dashboard/[clientSlug]/page.tsx` | Uses `computeSummaryStats` + `getPurchaseOrdersBySlug` |
| `app/(app)/dashboard/[clientSlug]/reorder/page.tsx` | **New route** — reorder planning page |
| `app/(app)/dashboard/[clientSlug]/print/page.tsx` | Updated field names to match new schema |

---

### Known Remaining Issues

| Issue | Severity |
|-------|----------|
| Charts are CSS-only placeholders (`InventoryHealthVisual`, `SafeZoneVisual`) | Medium |
| Modal form submissions are `console.log` only — no persistence | Medium |
| Login has no real auth — any credentials work | Medium |
| "Mark as received" in Inbound Countdown is local state only — resets on page reload | Low (intentional for mock phase) |
| `generateStaticParams()` uses hardcoded 4 slugs — must be made dynamic in Phase 3 | Medium |

---

### Immediate Next Recommended Step (as of Phase 2 completion)

~~The UI and logic layer are complete and stable. The recommended next step is **Phase 3A: Supabase authentication**.~~

**Phase 3A is complete.** See Section 12 for full details.

---

## 12. Phase 3A — Supabase Authentication (completed 2026-05-16)

### What Was Built

| File | Change |
|------|--------|
| `lib/supabase/client.ts` | **New** — browser Supabase client via `createBrowserClient` |
| `lib/supabase/server.ts` | **New** — server Supabase client with cookie handling via `createServerClient` |
| `proxy.ts` | **New** — Next.js 16 route guard (see note below on middleware rename) |
| `app/(auth)/logout/route.ts` | **New** — POST handler: signs out and redirects to `/login` |
| `.env.local` | **New** — `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (gitignored via `.env*`) |
| `app/(auth)/login/page.tsx` | Wired to real `supabase.auth.signInWithPassword()` with error display and role-based redirect |
| `app/(app)/layout.tsx` | Reads session server-side; passes `name`, `initials`, `role` to Sidebar and Header |
| `app/(app)/admin/page.tsx` | Client-role users are redirected to their own dashboard |
| `app/(app)/dashboard/[clientSlug]/page.tsx` | Client users restricted to their own `clientSlug`; `generateStaticParams` removed; `dynamic = "force-dynamic"` added |
| `components/layout/Sidebar.tsx` | Accepts `role`/`name`/`initials` props; "Clients" nav item hidden for client-role users |
| `components/layout/Header.tsx` | Accepts `initials` prop; avatar is a logout form button (POST to `/logout`) |

### Auth Architecture

- **Supabase project:** `brandqure-inventory-dashboard` (`tjqdjpcwfhvpcparljeh.supabase.co`)
- **Auth provider:** Email/password only. Public signups are disabled.
- **User roles** are stored in `app_metadata.role` (not `user_metadata` — users cannot self-modify `app_metadata`)
- **Admin user:** `app_metadata = { "role": "admin", "name": "BrandQure Admin" }` → lands on `/admin`
- **Client user:** `app_metadata = { "role": "client", "clientSlug": "acme-corp", "name": "Acme Corp" }` → lands on `/dashboard/acme-corp`

To set `app_metadata` for any user, use the Supabase SQL Editor:
```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"client","clientSlug":"acme-corp","name":"Acme Corp"}'::jsonb
WHERE email = 'user@example.com';
```

### Next.js 16 — `middleware.ts` → `proxy.ts`

Next.js 16 renamed the middleware file convention from `middleware.ts` to `proxy.ts` and the exported function from `middleware()` to `proxy()`. The API is otherwise identical (same `NextRequest`/`NextResponse`, same `config.matcher`). The file lives at project root: `proxy.ts`.

### What Remains Mock Data

All inventory rows, clients, purchase orders, and summary stats still come from `lib/mock-data.ts`. The auth layer is independent of the data layer. Phase 3B will replace `lib/mock-data.ts` output with real Google Sheets data while keeping all TypeScript types intact.

---

## 13. Phase 3B — Google Sheets Integration (completed 2026-05-19)

### Status
**Complete and live.** Real inventory data loads from Google Sheets on every client dashboard. Reference document: `docs/google-sheets-schema.md`.

### What Was Built

| File | Description |
|------|-------------|
| `lib/clients.ts` | Server-only Supabase lookup — `getClientConfig(slug)` and `getAllClientConfigs()` |
| `lib/sheets.ts` | Server-only Google Sheets fetch layer — JWT signing, REST API v4, row parser, 5-min cache |
| `app/(app)/dashboard/[clientSlug]/error.tsx` | Error boundary — clear message, Retry button, no mock fallback |
| `app/(app)/dashboard/[clientSlug]/reorder/error.tsx` | Same, for reorder page |
| `app/(app)/dashboard/[clientSlug]/loading.tsx` | Loading skeleton while sheet data fetches |
| `app/(app)/dashboard/[clientSlug]/reorder/loading.tsx` | Same, for reorder page |
| `app/(app)/dashboard/[clientSlug]/page.tsx` | Replaced mock data with real Supabase + Sheets calls; removed `orders` prop |
| `app/(app)/dashboard/[clientSlug]/reorder/page.tsx` | Same; `generateStaticParams` removed; client auth check added |
| `app/(app)/admin/page.tsx` | Replaced `CLIENTS` mock with `getAllClientConfigs()` from Supabase |
| `components/dashboard/InboundSummary.tsx` | **New** — replaces `InboundCountdown`; shows real inbound rows from Google Sheets |
| `components/dashboard/InboundCountdown.tsx` | **Deleted** — was driven by mock PO data which no longer appears in the live dashboard |
| `components/dashboard/DashboardContent.tsx` | Removed `orders: PurchaseOrder[]` prop; now passes `inventory` to `InboundSummary` |

### Architecture

**One Google Sheet per client.** The app maps `clientSlug → googleSheetId` via the Supabase `clients` table. Sheet rows are never exposed directly — the app fetches, parses, and discards `avgDailySales` before rendering.

**Supabase `clients` table:**
```
client_slug            text  primary key
client_name            text
logo_initial           text  (single char — used in admin card avatar)
tier                   text  ("Enterprise" | "Pro" | "Basic")
google_sheet_id        text
default_lead_time_days int
enabled_marketplaces   text[]
```

**RLS policies (two — never use a broad "authenticated" policy):**
- `admin_read_all_clients` — `app_metadata.role = 'admin'` → reads all rows
- `client_read_own_config` — `app_metadata.role = 'client'` → reads only the row where `client_slug = app_metadata.clientSlug`

**Google Sheets auth:**
- Service account: `ali-sheikh@inventory-dashboard-496721.iam.gserviceaccount.com`
- Each sheet must be shared explicitly with this email as Viewer (link-sharing alone is insufficient for API access)
- JWT signing uses Node.js built-in `crypto.createSign('RSA-SHA256')` — no npm package
- Access token is obtained fresh per cache cycle via `https://oauth2.googleapis.com/token`
- Sheet rows cached for 5 minutes via `unstable_cache` to stay within the 60 req/min/user quota

**Env vars required (in `.env.local`):**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GOOGLE_SHEETS_CLIENT_EMAIL
GOOGLE_SHEETS_PRIVATE_KEY   ← stored as single line; replace(/\\n/g, '\n') applied at runtime
```

**Column mapping (A–J, fixed order):**

| Col | Field | Notes |
|-----|-------|-------|
| A | `sku` | Primary identifier |
| B | `asin` | Blank for non-Amazon |
| C | `productName` | Display name |
| D | `marketplace` | `Amazon USA` \| `Amazon Canada` \| `Shopify` \| `Walmart` |
| E | `fbaAvailable` | Units sellable in FBA |
| F | `inboundUnits` | Units in transit |
| G | `reservedUnits` | Units on pending orders |
| H | `avgDailySales` | **Internal only — never rendered in UI** |
| I | `leadTimeDays` | Override; blank = `defaultLeadTimeDays` from client config |
| J | `lastUpdated` | `YYYY-MM-DD` freshness date |

`status` and all reorder metrics are computed by the app (`lib/reorder.ts`). Nothing is written back to the sheet.

### What Remains Mock / Deferred

| Item | Status | Planned replacement |
|---|---|---|
| Purchase orders / inbound countdown | **Removed from live dashboard** — no PO date data in Google Sheets; `InboundSummary` uses real `inboundUnits` column instead | Phase 3C — Supabase `purchase_orders` table; re-introduce countdown when real PO dates are available |
| `getPurchaseOrdersBySlug()` in `lib/mock-data.ts` | Still exists in `lib/mock-data.ts` but is **no longer called** from any dashboard page | Phase 3C — can be deleted once PO persistence is added |
| Modal form submissions (`AddOrderedUnitsModal`, `Update3PLStatusModal`) | `console.log` only | Phase 3C — Server Actions |
| 3PL fields (`threePlInventory`, `threePlLocation`) | Hardcoded `0` / `''` on every `InventoryRow` | Phase 3C — additional Supabase table or sheet tab |
| Print report page (`/print`) | Still uses `getClientBySlug` and `getInventoryBySlug` from mock-data | Phase 3C — wire to real Sheets data |

### Known Gotcha — Spreadsheet ID Font Confusion

Spreadsheet IDs contain characters that look identical in most fonts: uppercase `I`, lowercase `l`, and digit `1`. Always copy the ID directly from the browser URL bar and verify it in the Supabase `clients` table. A wrong ID returns `404 Requested entity was not found` from the Sheets API.

### To Add a New Client

1. Create their Google Sheet with one tab named `Inventory`, columns A–J per schema above.
2. Share the sheet with `ali-sheikh@inventory-dashboard-496721.iam.gserviceaccount.com` as Viewer.
3. Insert a row into Supabase:
   ```sql
   insert into public.clients values
     ('new-client', 'Client Name', 'N', 'Basic', '<sheet-id>', 21, '{"Amazon USA"}');
   ```
4. Create a Supabase auth user with `app_metadata = {"role":"client","clientSlug":"new-client","name":"Client Name"}`.
5. Navigate to `/dashboard/new-client` — data loads immediately.

### Inbound Summary Card

`InboundCountdown` (which showed mock purchase order dates and countdown badges) was deleted and replaced with `InboundSummary` (`components/dashboard/InboundSummary.tsx`). This change was made because:

- The Google Sheet schema has an `inboundUnits` column (col F) but **no PO date, order date, or expected arrival date**.
- Without a real `orderCreatedDate`, any countdown would have been fabricated data.
- `InboundSummary` filters `inventory` rows where `inboundUnits > 0`, sorts descending by quantity, and shows: Product Name, Marketplace pill, inbound unit count, FBA available.
- Empty state: `"No inbound units currently recorded."`
- Footer note: `"Based on Google Sheets data · Arrival dates tracked in Phase 3C"`

When Phase 3C adds a `purchase_orders` Supabase table with real order and arrival dates, the inbound countdown can be re-introduced — but it should draw from Supabase POs, not the sheet.

---

## 14. Phase 3B Addendum — Manual Sheet Refresh (completed 2026-05-19)

### What Was Built

| File | Change |
|------|--------|
| `lib/sheets.ts` | Added per-client `tags: ['sheets-inventory-{clientSlug}']` to `unstable_cache`; cache key now includes `clientSlug` so each client's entry is independently invalidatable |
| `app/actions/refresh-sheet.ts` | **New** — `'use server'` action; verifies auth, enforces admin/client access guard, calls `updateTag('sheets-inventory-{clientSlug}')` |
| `components/dashboard/DashboardContent.tsx` | Added "Refresh Sheet Data" pill button; uses `useTransition` for pending state and `router.refresh()` to re-render after invalidation |

### How It Works

1. User clicks **Refresh Sheet Data** on the dashboard.
2. `useTransition` sets `isRefreshing = true` — button shows spinning `sync` icon and "Refreshing…", is disabled.
3. `refreshSheetData(clientSlug)` Server Action runs server-side:
   - Calls `supabase.auth.getUser()` to confirm the user is authenticated.
   - If role is `client`, confirms `app_metadata.clientSlug === clientSlug` — clients cannot trigger a refresh for another client's data.
   - Calls `updateTag('sheets-inventory-{clientSlug}')` — immediately expires that client's `unstable_cache` entry. Other clients' caches are unaffected.
4. `router.refresh()` triggers a fresh server-side render. Because the cache entry is expired, `getInventoryFromSheet` fetches a new Google Sheets access token and re-reads the sheet.
5. The page re-renders with live sheet data. `isRefreshing` returns to false.

### Cache Behaviour — What Did Not Change

- **5-minute automatic TTL** (`revalidate: 300`) is unchanged. Normal page loads continue to be served from cache.
- **Google Sheets API is not called on every page refresh** — only on cache miss (natural expiry or manual invalidation).
- **Per-client isolation** — refreshing `demo-client` does not expire `acme-corp`'s cache entry.

### Why `updateTag` Over `revalidateTag`

In Next.js 16, `revalidateTag(tag)` with no second argument is deprecated. The two live options are:

| Function | Behaviour | Context |
|---|---|---|
| `updateTag(tag)` | Immediate expiry; next request blocks for fresh data | Server Actions only |
| `revalidateTag(tag, 'max')` | Marks stale; serves stale while fetching fresh in background | Server Actions + Route Handlers |

`updateTag` is correct here — the user clicking the button expects the *next* page render (triggered by `router.refresh()`) to show fresh values, not stale content. The fallback if `updateTag` causes compatibility issues is `revalidateTag(tag, { expire: 0 })`, which is documented as the Route Handler equivalent of the same immediate-expiry behaviour.

---

## 15. Phase 3C — Production Stabilization Pass (completed 2026-05-19)

This pass fixed the four production-blocking issues identified before first deployment. No new features were added.

### Files Changed

| File | Change |
|------|--------|
| `app/(app)/dashboard/[clientSlug]/print/page.tsx` | Replaced `getClientBySlug`/`getInventoryBySlug` (mock data) with `getClientConfig`/`getInventoryFromSheet` (live Supabase + Sheets). Added client auth guard — client users are redirected to their own print report. Added `export const dynamic = "force-dynamic"`. Removed `generateStaticParams`. |
| `app/(app)/admin/page.tsx` | Auth guard tightened: changed from `if (role === 'client') redirect` to `if (role !== 'admin') redirect`. Users with missing or unrecognised roles now redirect to `/login` instead of passing through to the admin grid. |
| `app/(app)/admin/error.tsx` | **New** — error boundary for the admin page. Required because `getAllClientConfigs` now throws on Supabase failures rather than silently returning `[]`. Matches the dashboard error boundary pattern: `cloud_off` icon, message, Retry button. |
| `lib/clients.ts` | `getClientConfig`: destructures `{ data, error }` and throws on any Supabase error except `PGRST116` (no rows — legitimate null). `getAllClientConfigs`: throws on any Supabase error. Both previously swallowed errors silently. |
| `lib/sheets.ts` | `parseSheetRows` filter now requires all three identity fields before a row is included: col A (SKU), col C (Product Name), col D (Marketplace). Rows missing any of these are skipped rather than parsed into zero-filled records with garbage reorder quantities. |

### What Each Fix Addressed

**Print page mock data (was production-blocking):**
The print report was reading from `lib/mock-data.ts`. Any client whose slug was not in the 4 hardcoded mock slugs got a `notFound()`. Any client whose slug matched a mock slug saw mock inventory, not their real Google Sheets data. The page now uses the same data path as the dashboard.

**Admin role guard gap (was production-blocking):**
The old guard only redirected `role === 'client'` users. A user whose `app_metadata` had an unrecognised role (e.g. `"viewer"`, or no role at all) would reach the admin grid and see all client names. The new guard allows only `role === 'admin'` through.

**Silent Supabase error swallowing (was production-blocking):**
Previously, if Supabase was unreachable or the `clients` table was missing, `getClientConfig` returned `null` (→ `notFound()`) and `getAllClientConfigs` returned `[]` (→ empty admin grid). Both looked like application state when they were infrastructure failures. Now both throw, which propagates to the appropriate error boundary.

**Sheet column validation (low-risk guard):**
Without this, a misconfigured sheet (e.g. an extra column inserted before col H) would silently produce `avgDailySales = 0` for all rows, giving every SKU a reorder quantity of 0 and hiding the problem entirely. The filter now rejects rows that lack the three identity fields, which acts as a basic signal that the column structure is wrong.

### Build State After Stabilization

```
Route (app)
○  /                     static
○  /_not-found           static
ƒ  /admin                dynamic
ƒ  /dashboard/[clientSlug]          dynamic
ƒ  /dashboard/[clientSlug]/print    dynamic  ← was incorrectly attempting static with generateStaticParams
ƒ  /dashboard/[clientSlug]/reorder  dynamic
○  /login                static
ƒ  /logout               dynamic
```

Type-check: 0 errors. Lint: 0 errors. Production build: clean.

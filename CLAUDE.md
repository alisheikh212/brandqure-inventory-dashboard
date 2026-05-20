@AGENTS.md

# BrandQure Inventory Command Center — Project Rules

These rules apply to every coding agent working on this project. Read them before making any changes.

---

## Rule 1: Never display `avgDailySales` in client-facing UI

`avgDailySales` is an internal calculation field. It lives on `InventoryRow` and is used by `lib/reorder.ts` to compute coverage days, reorder quantities, and status tiers. It must **never appear in any rendered column, card, badge, tooltip, or metric** in any client-facing component.

If you see it rendered anywhere in the UI, that is a bug — remove it.

The Reorder Recommendation column shows a unit quantity only (e.g., `"2,550 units"`) with the subtext `"covers next 60 days after lead time"`. It does not show a daily rate, a multiplier, or the word "sales".

---

## Rule 2: Inbound display uses real sheet data — no fake PO dates or countdowns

**`InboundCountdown` has been deleted.** It was replaced by `InboundSummary` (`components/dashboard/InboundSummary.tsx`) in Phase 3B.

The Google Sheet schema does not include PO dates, order dates, or expected arrival dates. Any countdown based on those fields would have been fabricated data, which is not acceptable. `InboundSummary` shows only what the sheet actually contains: rows where `inboundUnits > 0`, with Product Name, Marketplace, inbound unit count, and FBA available.

Do **not** re-introduce a countdown, `"X days left"` badge, or estimated arrival date in any component until a real Supabase `purchase_orders` table with actual `orderCreatedDate` values exists and is wired up.

---

## Rule 3: No fake logistics language

The following terms and concepts must **never appear** in any component, label, tooltip, or status badge:

- Ports, customs, border crossings
- Exact timestamps or times-of-day for shipments
- "In transit", "Cleared customs", "At port", "Arrived at warehouse"
- Any status that implies real carrier or 3PL tracking data
- Fabricated PO numbers, fake estimated arrival dates, or mock countdown timers on the live dashboard

---

## Rule 4: No mock data on any live page — persistence deferred to Phase 3C

All live pages (`/dashboard/[clientSlug]`, `/dashboard/[clientSlug]/reorder`, `/dashboard/[clientSlug]/print`, `/admin`) render only real data from Google Sheets and Supabase. `lib/mock-data.ts` is not imported by any of these pages.

Do not pass mock inventory rows, fake PO data, or placeholder dates to any component rendered on a live page. If real data is unavailable, the error boundary must show — not a silent fallback to mock values.

The following are intentionally deferred to a future phase:
- Purchase order persistence (Supabase `purchase_orders` table)
- "Mark as received" feature (needs Supabase before adding)
- Modal form submissions (`AddOrderedUnitsModal`, `Update3PLStatusModal`) — currently `console.log` only

---

## Rule 5: Preserve the modern SaaS design direction

The visual design takes cues from Linear, Vercel, Geist, Stripe, and Raycast. Key rules:

- Cards use `rounded-2xl`, `border border-outline-variant`, `shadow-sm`, white backgrounds
- Status pills use outline-border style (not filled blobs) except for critical states
- Reorder Now rows use `bg-[#fff8f8]` tint — not red text on white, not full red fill
- Alert tiles use a `h-[3px]` colored top-accent strip — the card body stays white
- Do not revert to Tailwind default utility classes for branded UI elements — use the role-based typography classes (`text-label-md`, `text-headline-lg`, `text-numeric-data`, etc.)
- Do not introduce new fonts, shadow styles, or color values outside the MD3 token system already defined in `globals.css`

When adding new UI, match the hierarchy and density of existing components exactly.

---

## Rule 6: Do not change the reorder quantity formula without approval

The canonical formula in `lib/reorder.ts → recommendedReorderQty()` is:

```
target  = leadTimeDays + 60
needed  = ceil(avgDailySales × target)
reorder = max(0, needed − fbaAvailable − inboundUnits)
```

**Do not simplify this to `avgDailySales × 60`.** That earlier version was wrong — it ignored lead time demand and over-ordered by not crediting existing inventory.

The three parts are each load-bearing:
1. **`leadTimeDays + 60`** — stock sells during the transit window; you need to cover those days too, not just 60 days post-arrival
2. **`− fbaAvailable − inboundUnits`** — credit what you already own; only order what is missing
3. **`max(0, ...)`** — healthy and overstock SKUs return 0, never a negative recommendation

If a stakeholder asks to change the target horizon (e.g., 90 days instead of 60), change only the constant `60` — do not restructure the formula.

---

## Rule 7: Real Google Sheets data is live — mock inventory is no longer used for dashboards

**Phase 3B + 3C stabilization complete.** Inventory data for the dashboard, reorder, and print pages comes from Google Sheets via `lib/sheets.ts`. The Supabase `clients` table maps each `clientSlug` to a `googleSheetId`. No live page imports from `lib/mock-data.ts` for inventory.

`lib/mock-data.ts` still provides:
- `InventoryRow`, `Client`, `PurchaseOrder`, `SummaryStats` TypeScript types — do not change these without checking all consumers
- `getPurchaseOrdersBySlug()` — not called from any live page; retained until a Supabase `purchase_orders` table is added
- `MARKETPLACES` constant — still used in `DashboardContent`

Do not re-introduce mock inventory rows into any page or component. If Google Sheets data is unavailable, the `error.tsx` boundary must show — never silently fall back to mock data.

---

## Rule 8: Google Sheets schema is approved — one sheet per client

The approved schema is documented in `docs/google-sheets-schema.md`. Key rules:

- Each client has **one dedicated Google Sheet**. There is no master sheet mixing multiple clients.
- `clientSlug` is **never a column** inside any inventory row. The app maps `clientSlug → googleSheetId` through client configuration in Supabase.
- The sheet has **one tab only: `Inventory`**.
- **Column order is fixed:** A=SKU, B=ASIN, C=Product Name, D=Marketplace, E=FBA Available, F=Inbound Units, G=Reserved Units, H=Avg Daily Sales, I=Lead Time Override, J=Last Updated.
- `Avg Daily Sales` (column H) exists in the sheet for internal calculation only. It must **never be displayed in any UI component**.
- The app is **read-only** from Google Sheets. All writes go to Supabase.
- Do not add columns, rename columns, or change column order without explicit approval.
- **Row identity validation** is enforced in `parseSheetRows`: a row is only parsed if col A (SKU), col C (Product Name), and col D (Marketplace) are all non-empty. Rows that fail this check are silently skipped. This is intentional — it prevents a misconfigured sheet from producing zero-filled `InventoryRow` records with garbage reorder quantities. Do not remove this filter.

---

## Rule 10: Google Sheets integration is read-only and cached — do not bypass the cache

`lib/sheets.ts` is the sole entry point for sheet data. Key constraints:

- **Read-only.** The app never writes back to any Google Sheet. All writes (POs, status changes) go to Supabase.
- **Server-only.** `lib/sheets.ts` and `lib/clients.ts` both start with `import 'server-only'`. Never import them from client components or route handlers that run on the client.
- **5-minute cache.** `getInventoryFromSheet` is wrapped in `unstable_cache` with `revalidate: 300`. Do not remove this — the free Sheets API quota is 60 read requests/minute/user. Removing the cache will exhaust the quota immediately under normal usage.
- **Per-client cache tag.** Each client's cache entry is tagged `sheets-inventory-{clientSlug}`. This tag is what `updateTag()` in `app/actions/refresh-sheet.ts` targets. Do not remove the `tags` option from `unstable_cache` — the manual refresh button will stop working.
- **Private key normalization.** `.env.local` stores `GOOGLE_SHEETS_PRIVATE_KEY` as a single line. `replace(/\\n/g, '\n')` is applied at runtime in `getGoogleAccessToken()`. Do not remove this — the JWT signing will fail silently with a malformed key.
- **Sheet ID storage.** Each client's `googleSheetId` lives in the Supabase `clients` table, not in code. To update a client's sheet, run: `update public.clients set google_sheet_id = '<id>' where client_slug = '<slug>';`
- **ID font trap.** Spreadsheet IDs contain visually identical characters (`I`, `l`, `1`). Always copy from the browser URL bar. A wrong ID returns 404 from the Sheets API.

## Rule 11: Manual sheet refresh uses updateTag — do not replace with full cache removal

The "Refresh Sheet Data" button in `DashboardContent` calls `refreshSheetData(clientSlug)` from `app/actions/refresh-sheet.ts`. That Server Action calls `updateTag('sheets-inventory-{clientSlug}')`, which immediately expires only that client's cache entry.

Rules:
- **Do not call `revalidateTag(tag, 'max')`** as a replacement — `'max'` uses stale-while-revalidate, meaning the user would still see stale data on the render immediately after clicking the button.
- **Do not remove the auth guard** in `refresh-sheet.ts`. A client-role user must only be able to refresh their own `clientSlug`. An unauthenticated request must be rejected. Without this guard, anyone authenticated could spam the button and exhaust the Sheets API quota.
- **Do not remove `router.refresh()`** from the client handler. `updateTag` expires the server cache but does not trigger a re-render — `router.refresh()` is what causes the page to re-fetch and display fresh data.
- **Fallback if needed:** if `updateTag` causes a compatibility issue in a future Next.js version, the documented equivalent for Server Actions is `revalidateTag(tag, { expire: 0 })`. Do not use `revalidateTag(tag)` with no second argument — that signature is deprecated in Next.js 16.

## Rule 9: Auth roles live in `app_metadata`, not `user_metadata`

User roles are stored in Supabase `app_metadata` (field: `raw_app_meta_data`), not `user_metadata`. This is intentional — users can modify their own `user_metadata` post-login; `app_metadata` requires service_role or direct dashboard/SQL access.

- Admin user: `{ "role": "admin", "name": "BrandQure Admin" }`
- Client user: `{ "role": "client", "clientSlug": "acme-corp", "name": "Acme Corp" }`

To update a user's metadata, use the Supabase SQL Editor:
```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"client","clientSlug":"acme-corp","name":"Acme Corp"}'::jsonb
WHERE email = 'user@example.com';
```

Do not attempt to set roles via `user_metadata` — it is not checked anywhere in the auth flow.

---

## Rule 12: Admin page requires explicit role === "admin" — not just non-client

`app/(app)/admin/page.tsx` guards the page with:

```typescript
if (role !== 'admin') {
  redirect(role === 'client' && slug ? `/dashboard/${slug}` : '/login')
}
```

Do **not** change this to `if (role === 'client') redirect(...)`. The previous form allowed users with missing, null, or unrecognised roles to pass through to the admin grid and see all client names.

The rule is: **only `role === "admin"` may access `/admin`**. Any other value — including `undefined`, `"viewer"`, or any future role string — redirects to `/login`.

---

## Rule 13: lib/clients.ts must throw on Supabase errors — not return null/[]

`getClientConfig` and `getAllClientConfigs` in `lib/clients.ts` distinguish between two failure modes:

- **No row found** (`PGRST116` error code from Supabase): `getClientConfig` returns `null`, which the caller converts to a 404. This is correct — the client slug does not exist.
- **Query failed** (any other error code): both functions **throw**. This propagates to the nearest error boundary (`error.tsx`) and shows the user a clear failure message.

Do not revert this to silently returning `null`/`[]` on error. The old behaviour made Supabase outages look like missing client slugs (404) or empty databases (empty admin grid), hiding infrastructure problems.

The admin page has its own `error.tsx` (`app/(app)/admin/error.tsx`) specifically because `getAllClientConfigs` can now throw.

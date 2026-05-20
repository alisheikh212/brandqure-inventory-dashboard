# BrandQure Inventory Command Center — Deployment Checklist

Follow this checklist in order when deploying to production on Vercel.

---

## 1. GitHub Repository

- [ ] Confirm `.env.local` is **not** committed (covered by `.gitignore`)
- [ ] Confirm `.env.example` **is** committed (shows required variable names, no real secrets)
- [ ] Push the branch to GitHub

---

## 2. Vercel Project Setup

- [ ] Import the GitHub repository into Vercel
- [ ] **Root directory:** set to `brandqure-inventory-dashboard`
  - Vercel auto-detects Next.js once the root is set correctly
- [ ] Framework preset: **Next.js** (auto-detected)
- [ ] Build command: `npm run build` (default)
- [ ] Output directory: `.next` (default)

---

## 3. Environment Variables in Vercel

Add all variables below under **Project → Settings → Environment Variables**.
Set scope to **Production** (and Preview if needed).

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project → Settings → API → service_role key |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | Service account JSON → `client_email` |
| `GOOGLE_SHEETS_PRIVATE_KEY` | Service account JSON → `private_key` (paste with literal `\n`, no line breaks) |

> **Critical:** `SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_SHEETS_PRIVATE_KEY` must
> **never** use the `NEXT_PUBLIC_` prefix. They must remain server-only.

---

## 4. Supabase Configuration

### Auth settings

- [ ] **Site URL:** set to your production Vercel domain (e.g. `https://your-app.vercel.app`)
- [ ] **Redirect URLs:** add `https://your-app.vercel.app/**` under Auth → URL Configuration
- [ ] **Disable signups:** Auth → Providers → Email → toggle **"Enable email signups"** OFF
  - All accounts are created by admins via the Create Login page; self-registration must be blocked

### Database

- [ ] Confirm RLS is **enabled** on the `clients` table
- [ ] Confirm the anon role has a SELECT policy on `clients` (dashboard pages read it server-side via SSR session)
- [ ] Confirm no INSERT/UPDATE policies exist for anon or authenticated roles on `clients` — admin writes use the service role key which bypasses RLS
- [ ] Confirm `auth.users` `app_metadata` contains `role` for every user (`admin` or `client`)

---

## 5. Google Sheets

- [ ] Each client's Google Sheet is **shared with the service account email** (`GOOGLE_SHEETS_CLIENT_EMAIL`) with **Viewer** permission
- [ ] Each client's `google_sheet_id` in the Supabase `clients` table matches the actual sheet ID (copy from the URL bar — watch for `I`/`l`/`1` font ambiguity)
- [ ] Each sheet has a single tab named exactly **`Inventory`**
- [ ] Column order matches the approved schema: A=SKU, B=ASIN, C=Product Name, D=Marketplace, E=FBA Available, F=Inbound Units, G=Reserved Units, H=Avg Daily Sales, I=Lead Time Override, J=Last Updated

---

## 6. Smoke Tests — run after first production deploy

### Auth

- [ ] Admin login works → redirects to `/admin`
- [ ] Client login works → redirects to `/dashboard/{clientSlug}`
- [ ] Unauthenticated visit to `/admin` redirects to `/login`
- [ ] Unauthenticated visit to `/dashboard/*` redirects to `/login`
- [ ] Client user cannot access `/admin` (redirects to their own dashboard)
- [ ] Client user cannot access another client's dashboard (redirects to their own)

### Dashboard

- [ ] `/dashboard/{clientSlug}` loads real inventory data from Google Sheets
- [ ] Inventory table filters by marketplace
- [ ] Status pills (Healthy / Low Stock / Critical Low / Out of Stock / Overstock) are correct
- [ ] Inbound Summary card shows rows where `inboundUnits > 0`; shows empty state if none
- [ ] **Refresh Sheet Data** button clears the cache and reloads data without a full page reload

### Reorder page

- [ ] `/dashboard/{clientSlug}/reorder` loads and shows reorder recommendations
- [ ] Reorder quantity follows the formula: `max(0, ceil(avgDailySales × (leadTimeDays + 60)) − fbaAvailable − inboundUnits)`
- [ ] `avgDailySales` does not appear in any rendered column or tooltip

### Print page

- [ ] `/dashboard/{clientSlug}/print` renders the reorder report
- [ ] Data matches the reorder page for the same client
- [ ] No mock data or placeholder values visible

### Admin — Client Manager

- [ ] `/admin` shows the client grid with **Add Client**, **Edit**, and **Create Login** links
- [ ] **Add Client** form creates a new row in the Supabase `clients` table
- [ ] **Edit Client** form updates the existing row; slug field is read-only
- [ ] Duplicate slug returns a clear error, not a 500

### Admin — User Manager

- [ ] **Create Login** form creates a new Supabase auth user with `role: client` and `clientSlug` in `app_metadata`
- [ ] Created user can log in and is redirected to the correct dashboard
- [ ] Credentials panel shows email + temporary password and the Copy button works
- [ ] Duplicate email returns a clear error, not a 500

---

## 7. Security Verification

- [ ] `SUPABASE_SERVICE_ROLE_KEY` does not appear in any client bundle (check browser DevTools → Network → JS chunks)
- [ ] `GOOGLE_SHEETS_PRIVATE_KEY` does not appear in any client bundle
- [ ] Response headers include `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] No `avgDailySales` value appears in any rendered UI

---

## 8. Post-Deploy

- [ ] Set Supabase **Site URL** to the final custom domain if one is configured (Vercel → Domains)
- [ ] Re-test auth redirects after domain change
- [ ] Document the production URL and admin login in a secure internal location

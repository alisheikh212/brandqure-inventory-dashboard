# Google Sheets Schema — Per-Client Architecture

## Status
Approved. Not yet integrated. Integration begins in Phase 3B.

---

## Architecture Rule

There is **one Google Sheet per client**. Sheets are never shared between clients.

The app does **not** read a `clientSlug` column from any sheet row. Instead, the app
maps each client to their sheet through a client configuration record (stored in Supabase):

```
Client Config (Supabase — added in Phase 3B)
├── clientSlug          → "acme-corp"
├── clientName          → "Acme Corp"
├── googleSheetId       → "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
├── defaultLeadTimeDays → 21
└── enabledMarketplaces → ["Amazon USA", "Amazon Canada"]
```

When the app fetches data for `acme-corp` it:
1. Looks up `acme-corp` in client config → retrieves `googleSheetId`
2. Fetches only that sheet
3. Assigns `clientSlug` in memory when building inventory objects

---

## Sheet Structure

**One tab only: `Inventory`**

- No config tab
- No purchase order tab (POs go to Supabase in Phase 3C)
- No formulas inside the sheet — it is a flat data table
- One row = one SKU on one marketplace

Multiple marketplaces for the same SKU = multiple rows (not multiple columns).
This allows adding new marketplaces without schema changes.

---

## `Inventory` Tab — Column Definitions

| Col | Name | Format | Editable By | Purpose |
|-----|------|--------|-------------|---------|
| A | `SKU` | Text | BrandQure ops | Primary product identifier used throughout the app |
| B | `ASIN` | Text | BrandQure ops | Amazon ASIN — blank for non-Amazon marketplaces |
| C | `Product Name` | Text | BrandQure ops | Human-readable name shown in dashboard and reorder table |
| D | `Marketplace` | Text | BrandQure ops | Channel for this row — `Amazon USA`, `Amazon Canada`, `Shopify`, `Walmart` |
| E | `FBA Available` | Number | BrandQure ops | Units currently live and sellable in FBA / fulfillment center |
| F | `Inbound Units` | Number | BrandQure ops | Units in transit to FBA, not yet available to sell |
| G | `Reserved Units` | Number | BrandQure ops | Units held by pending customer orders (can be 0) |
| H | `Avg Daily Sales` | Number | BrandQure ops | 30-day average daily sales velocity — **internal calculation input only** |
| I | `Lead Time Override` | Number | BrandQure ops | Overrides `defaultLeadTimeDays` for this SKU only. Blank = use client default |
| J | `Last Updated` | Date (YYYY-MM-DD) | BrandQure ops | When this row was last refreshed — displayed as data freshness in the dashboard |

**Total: 10 columns (A–J). Column order must be preserved.**

---

## Avg Daily Sales — Internal Use Only

`Avg Daily Sales` (column H) is **never displayed in the UI** under any circumstance.
It exists in the sheet solely because the reorder formula requires it.
The app reads it, uses it in calculations, and discards it from any client-facing output.

---

## Reorder Formula (calculated by the app, never stored in the sheet)

```
effectiveLeadTime  = Lead Time Override (col I) if present, else defaultLeadTimeDays
targetCoverage     = effectiveLeadTime + 60
reorderQty         = max(0, ceil(avgDailySales × targetCoverage) − FBA Available − Inbound Units)
stockCoverageDays  = (FBA Available + Inbound Units) / avgDailySales
```

None of these calculated values are written back to the sheet.

---

## Values the App Calculates (never in the sheet)

| Value | Used for |
|-------|----------|
| Effective Lead Time | Input to reorder formula |
| Target Coverage | Input to reorder formula |
| Reorder Quantity | Reorder table — units to order |
| Stock Coverage Days | Reorder table progress bar |
| Days Until Stockout | Dashboard summary card |
| Reorder Status | Status badge (Healthy / Low / Critical / Reorder Now) |
| Inventory Status | Dashboard table badge |

---

## Example Rows

| SKU | ASIN | Product Name | Marketplace | FBA Avail | Inbound | Reserved | Avg Daily Sales | Lead Time Override | Last Updated |
|-----|------|-------------|-------------|-----------|---------|----------|----------------|--------------------|--------------|
| WE-001 | B08XYZ | Wireless Earbuds | Amazon USA | 42 | 0 | 5 | 32 | | 2026-05-15 |
| WE-001 | B08XYZ | Wireless Earbuds | Amazon Canada | 18 | 200 | 0 | 8 | | 2026-05-15 |
| SC-002 | B09ABC | Phone Stand | Amazon USA | 310 | 0 | 12 | 15 | 14 | 2026-05-15 |

---

## Google Sheets Access — Read-Only

The app reads from Google Sheets. It never writes back.
All writes (purchase orders, status changes) go to Supabase.

---

## What Does NOT Belong in the Sheet

- `clientSlug` — determined from client config, not from the row
- Reorder quantity — calculated by the app
- Stock coverage — calculated by the app
- Inventory status badges — determined by the app
- Purchase orders or inbound shipment history — stored in Supabase

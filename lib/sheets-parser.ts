// ============================================================
// Google Sheet Inventory tab — header resolution + row parsing.
// Pure functions only — no network, no auth, no Next.js cache APIs —
// so this module can run in any environment (server or test).
// ============================================================

import type { InventoryRow } from './mock-data'
import { normalizeMarketplaceId } from './marketplace-utils'
import { deriveInventoryStatus } from './reorder'

// ─────────────────────────────────────────────────────────────────
// Header-based column resolution
//
// Column order is fixed per docs/google-sheets-schema.md (A=SKU, B=ASIN,
// C=Product Name, D=Marketplace, E=FBA Available, F=Inbound Units,
// G=Reserved Units, H=Avg Daily Sales, I=Lead Time Override, J=Last Updated).
// Rather than trust that position blindly, we read the header row and match
// each expected field by name. This catches a misconfigured sheet (columns
// added, removed, or reordered) instead of silently misreading data into the
// wrong field — which is exactly how a raw marketplace value like
// "amazon.co.uk" previously ended up hardcoded to "Amazon.com": the parser
// read the correct column, but then an unrecognised-normalized-value
// allowlist defaulted it to "Amazon.com" instead of preserving it (see
// normalizeMarketplaceId in lib/marketplace-utils.ts, which never defaults).
// ─────────────────────────────────────────────────────────────────

export type FieldKey =
  | 'sku' | 'asin' | 'productName' | 'marketplace' | 'fbaAvailable'
  | 'inboundUnits' | 'reservedUnits' | 'avgDailySales' | 'leadTimeOverride' | 'lastUpdated'

export const HEADER_ALIASES: Record<FieldKey, string[]> = {
  sku:              ['sku'],
  asin:             ['asin'],
  productName:      ['product name', 'productname'],
  marketplace:      ['marketplace'],
  fbaAvailable:     ['fba available', 'fbaavailable'],
  inboundUnits:     ['inbound units', 'inboundunits'],
  reservedUnits:    ['reserved units', 'reservedunits'],
  avgDailySales:    ['avg daily sales', 'average daily sales', 'avgdailysales'],
  leadTimeOverride: ['lead time override', 'lead time', 'leadtimeoverride', 'leadtime'],
  lastUpdated:      ['last updated', 'lastupdated'],
}

// Fixed fallback positions — used only when a header can't be matched by name,
// so a sheet without a recognisable header row still parses using the
// documented, approved column order.
export const FALLBACK_POSITION: Record<FieldKey, number> = {
  sku: 0, asin: 1, productName: 2, marketplace: 3, fbaAvailable: 4,
  inboundUnits: 5, reservedUnits: 6, avgDailySales: 7, leadTimeOverride: 8, lastUpdated: 9,
}

export function normalizeHeaderText(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Build a field → column-index map from the sheet's header row.
 * Throws if the Marketplace, SKU, or Product Name columns cannot be
 * identified — these are the row-identity fields and must never be guessed.
 */
export function resolveHeaderMap(headerRow: string[] | undefined): Record<FieldKey, number> {
  const normalizedHeaders = (headerRow ?? []).map(normalizeHeaderText)
  const map = {} as Record<FieldKey, number>
  const foundByHeader = new Set<FieldKey>()

  for (const key of Object.keys(HEADER_ALIASES) as FieldKey[]) {
    const aliases = HEADER_ALIASES[key]
    const idx = normalizedHeaders.findIndex((h) => aliases.includes(h))
    if (idx !== -1) {
      map[key] = idx
      foundByHeader.add(key)
    } else {
      map[key] = FALLBACK_POSITION[key]
    }
  }

  // Row-identity fields must be found by header, not silently defaulted to a
  // fixed position — a sheet with a genuinely missing/renamed Marketplace
  // header must fail loudly rather than read the wrong column.
  const criticalFields: FieldKey[] = ['sku', 'productName', 'marketplace']
  const missing = criticalFields.filter((key) => !foundByHeader.has(key))
  if (missing.length > 0) {
    throw new Error(
      `Google Sheet "Inventory" tab is missing required column header(s): ${missing.join(', ')}. ` +
      `Expected headers include SKU, Product Name, and Marketplace. Cannot safely parse inventory rows.`,
    )
  }

  return map
}

export function parseSheetRows(
  rows: string[][],
  clientSlug: string,
  defaultLeadTimeDays: number,
): InventoryRow[] {
  const [headerRow, ...dataRows] = rows
  const col = resolveHeaderMap(headerRow)

  return dataRows
    .filter((row) => {
      // Skip empty rows and rows missing the three required identity fields:
      // SKU, Product Name, Marketplace (resolved by header, not hardcoded index).
      // This catches wrong column order and partial header bleed-through.
      const sku = row[col.sku]?.trim()
      const productName = row[col.productName]?.trim()
      const marketplace = row[col.marketplace]?.trim()
      return sku && productName && marketplace
    })
    .map((row) => {
      const sku            = row[col.sku]?.trim() ?? ''
      const asin           = row[col.asin]?.trim() ?? ''
      const productName    = row[col.productName]?.trim() ?? ''
      const marketplaceRaw = row[col.marketplace]?.trim() ?? ''
      // Canonical normalization — handles casing/whitespace/alias variants
      // ("Amazon.co.uk", "amazon.co.uk", "Amazon UK" all → "amazon.co.uk").
      // Unrecognised non-empty values are preserved as-is; NEVER defaulted
      // to "amazon.com".
      const marketplace = normalizeMarketplaceId(marketplaceRaw)
      const fbaAvailable  = parseInt(row[col.fbaAvailable] ?? '0', 10) || 0
      const inboundUnits  = parseInt(row[col.inboundUnits] ?? '0', 10) || 0
      const reservedUnits = parseInt(row[col.reservedUnits] ?? '0', 10) || 0
      const avgDailySales = parseFloat(row[col.avgDailySales] ?? '0') || 0
      const overrideRaw   = row[col.leadTimeOverride]?.trim()
      const leadTimeDays  = overrideRaw
        ? (parseInt(overrideRaw, 10) || defaultLeadTimeDays)
        : defaultLeadTimeDays
      const lastUpdated   = row[col.lastUpdated]?.trim() ?? ''

      const base = {
        id:              `${clientSlug}-${sku}-${marketplace}`,
        clientSlug,
        productName,
        asin,
        sku,
        marketplace,
        fbaAvailable,
        inboundUnits,
        reservedUnits,
        avgDailySales,
        leadTimeDays,
        // 3PL data is not in the Google Sheet — Phase 3C will wire this via Supabase
        threePlInventory: 0,
        threePlLocation:  '',
        lastUpdated,
      }

      return {
        ...base,
        // status is always computed by the app — never read from the sheet
        status: deriveInventoryStatus({ ...base, status: 'Healthy' as const }),
      } satisfies InventoryRow
    })
}

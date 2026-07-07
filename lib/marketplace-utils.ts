// ============================================================
// Marketplace utilities for the Historic Forecast feature.
//
// This is SEPARATE from normalizeMarketplace() in lib/mock-data.ts.
// That function maps input → Marketplace display string ("Amazon UK").
// This module operates on canonical Supabase-style IDs ("amazon.co.uk")
// and provides label + inventory-value lookups in both directions.
// ============================================================

// ─────────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────────

interface MarketplaceEntry {
  id: string;             // canonical Supabase-style ID
  label: string;          // human-readable display label
  inventoryValue: string; // InventoryRow.marketplace (Google Sheet col D after normalization)
}

const CATALOG: MarketplaceEntry[] = [
  { id: "amazon.com",   label: "Amazon US",      inventoryValue: "Amazon.com" },
  { id: "amazon.co.uk", label: "Amazon UK",       inventoryValue: "Amazon UK"  },
  { id: "amazon.ca",    label: "Amazon Canada",   inventoryValue: "Amazon.ca"  },
  { id: "amazon.de",    label: "Amazon Germany",  inventoryValue: "Amazon UK"  },
  { id: "amazon.fr",    label: "Amazon France",   inventoryValue: "Amazon UK"  },
  { id: "amazon.it",    label: "Amazon Italy",    inventoryValue: "Amazon UK"  },
  { id: "amazon.es",    label: "Amazon Spain",    inventoryValue: "Amazon UK"  },
  { id: "shopify",      label: "Shopify",         inventoryValue: "Shopify"    },
  { id: "walmart",      label: "Walmart",         inventoryValue: "Walmart"    },
];

// All explicit aliases: any recognised variant → canonical ID.
// Entries are case-sensitive for fast lookup; a case-insensitive fallback runs
// when no exact match is found.
const ALIASES: Record<string, string> = {
  // ── UK ──────────────────────────────────────────────────────────
  "amazon.co.uk":     "amazon.co.uk",
  "Amazon UK":        "amazon.co.uk",
  "Amazon.co.uk":     "amazon.co.uk",
  "amazon uk":        "amazon.co.uk",
  "UK":               "amazon.co.uk",
  "uk":               "amazon.co.uk",
  // ── US ──────────────────────────────────────────────────────────
  "amazon.com":       "amazon.com",
  "Amazon.com":       "amazon.com",
  "Amazon US":        "amazon.com",
  "Amazon USA":       "amazon.com",
  "amazon usa":       "amazon.com",
  "US":               "amazon.com",
  "us":               "amazon.com",
  // ── CA ──────────────────────────────────────────────────────────
  "amazon.ca":        "amazon.ca",
  "Amazon.ca":        "amazon.ca",
  "Amazon Canada":    "amazon.ca",
  "Amazon CA":        "amazon.ca",
  "amazon canada":    "amazon.ca",
  "CA":               "amazon.ca",
  "ca":               "amazon.ca",
  // ── DE ──────────────────────────────────────────────────────────
  "amazon.de":        "amazon.de",
  "Amazon Germany":   "amazon.de",
  "Amazon DE":        "amazon.de",
  // ── FR ──────────────────────────────────────────────────────────
  "amazon.fr":        "amazon.fr",
  "Amazon France":    "amazon.fr",
  "Amazon FR":        "amazon.fr",
  // ── IT ──────────────────────────────────────────────────────────
  "amazon.it":        "amazon.it",
  "Amazon Italy":     "amazon.it",
  "Amazon IT":        "amazon.it",
  // ── ES ──────────────────────────────────────────────────────────
  "amazon.es":        "amazon.es",
  "Amazon Spain":     "amazon.es",
  "Amazon ES":        "amazon.es",
  // ── Shopify ─────────────────────────────────────────────────────
  "shopify":          "shopify",
  "Shopify":          "shopify",
  // ── Walmart ─────────────────────────────────────────────────────
  "walmart":          "walmart",
  "Walmart":          "walmart",
};

// ─────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────

/**
 * Normalize any marketplace input to a canonical ID (e.g. "amazon.co.uk").
 *
 * Handles Supabase storage values, legacy display strings, and common aliases.
 * Returns the original trimmed value for unrecognised inputs so callers can
 * surface a useful error rather than silently defaulting to Amazon US.
 */
export function normalizeMarketplaceId(input: string): string {
  const trimmed = input.trim();

  // 1. Exact alias match (O(1))
  if (Object.prototype.hasOwnProperty.call(ALIASES, trimmed)) {
    return ALIASES[trimmed];
  }

  // 2. Case-insensitive alias match
  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(ALIASES)) {
    if (key.toLowerCase() === lower) return val;
  }

  // 3. Catalog ID match (case-insensitive)
  const catalogEntry = CATALOG.find((e) => e.id.toLowerCase() === lower);
  if (catalogEntry) return catalogEntry.id;

  // 4. Unknown — return original. Never default to "amazon.com".
  return trimmed;
}

/**
 * Return the human-readable display label for a marketplace ID.
 * Falls back to the original ID string for unknown values rather than
 * showing "Amazon.com" or "Amazon US" as a misleading default.
 */
export function getMarketplaceLabel(id: string): string {
  const normalized = normalizeMarketplaceId(id);
  const entry = CATALOG.find((e) => e.id === normalized);
  return entry ? entry.label : id;
}

/**
 * Return the InventoryRow.marketplace string that corresponds to a marketplace ID.
 * Used to filter inventory rows by marketplace.
 * Returns null for unrecognised IDs so the caller can show a clear error.
 */
export function getInventoryValue(id: string): string | null {
  const normalized = normalizeMarketplaceId(id);
  const entry = CATALOG.find((e) => e.id === normalized);
  return entry ? entry.inventoryValue : null;
}

/**
 * Filter inventory rows to those matching the given marketplace ID.
 *
 * Both the row's marketplace field and the supplied ID are normalized before
 * comparison, so "amazon.co.uk", "Amazon UK", and "Amazon.co.uk" all match
 * each other regardless of which form the Google Sheet or Supabase stores.
 * Unknown values are compared as-is (never defaulted to amazon.com).
 */
export function filterByMarketplaceId<T extends { marketplace: string }>(
  rows: T[],
  marketplaceId: string,
): T[] {
  const normalizedId = normalizeMarketplaceId(marketplaceId);
  if (!normalizedId) return [];
  return rows.filter(
    (r) => normalizeMarketplaceId(r.marketplace) === normalizedId,
  );
}

/**
 * Return true if the inventory row's marketplace matches the given ID.
 * Normalizes both sides so raw canonical IDs and display strings compare equal.
 */
export function rowMatchesMarketplace<T extends { marketplace: string }>(
  row: T,
  marketplaceId: string,
): boolean {
  const normalizedId = normalizeMarketplaceId(marketplaceId);
  return Boolean(normalizedId) && normalizeMarketplaceId(row.marketplace) === normalizedId;
}

/**
 * Normalise a list of raw Supabase marketplace values, deduplicate, and
 * return the canonical IDs. Unknown values are preserved (not dropped)
 * so the UI can surface them rather than silently hiding them.
 */
export function normalizeEnabledMarketplaces(raw: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of raw) {
    const id = normalizeMarketplaceId(m);
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}

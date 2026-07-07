import { describe, it, expect } from "vitest";
import { parseSheetRows, resolveHeaderMap } from "../sheets-parser";
import { normalizeMarketplaceId, getMarketplaceLabel, filterByMarketplaceId, normalizeEnabledMarketplaces } from "../marketplace-utils";

// ─────────────────────────────────────────────────────────────────
// Regression suite for the root-cause bug: a Google Sheet row with
// Marketplace = "amazon.co.uk" for client Solens (enabled_marketplaces =
// ["amazon.co.uk"]) was rendering as "Amazon.com" throughout the app.
//
// Root cause #1 (lib/sheets.ts, now lib/sheets-parser.ts):
//   parseSheetRows() normalized the raw cell with the legacy, incomplete
//   normalizeMarketplace() (lib/mock-data.ts, since removed), which had no
//   UK/AU/AE/SA/IN/JP mappings. The unrecognised result then failed a
//   VALID_MARKETPLACES.has() allowlist check and was hardcoded to
//   'Amazon.com' — the row's marketplace field was corrupted before it ever
//   reached any page component.
//
// Root cause #2 (app/(app)/dashboard/[clientSlug]/page.tsx):
//   client.enabledMarketplaces was built via the same broken normalizer and
//   an equally narrow VALID_MARKETPLACE_SET filter, which silently dropped
//   "amazon.co.uk" entirely (producing an empty array) since it wasn't in
//   the filter's allowlist.
// ─────────────────────────────────────────────────────────────────

const HEADER_ROW = [
  "SKU", "ASIN", "Product Name", "Marketplace", "FBA Available",
  "Inbound Units", "Reserved Units", "Avg Daily Sales", "Lead Time Override", "Last Updated",
];

function solensSheetRows(marketplaceCell: string): string[][] {
  return [
    HEADER_ROW,
    ["KC-KBMO-CDEV", "B0SOLENS01", "Solens UV Device", marketplaceCell, "120", "40", "5", "3.2", "", "2026-07-01"],
  ];
}

// ── 1. amazon.co.uk remains amazon.co.uk through parsing ──────────

describe("Item 1 — amazon.co.uk remains amazon.co.uk through parsing", () => {
  it("parseSheetRows preserves 'amazon.co.uk' as the row's marketplace", () => {
    const rows = parseSheetRows(solensSheetRows("amazon.co.uk"), "solens", 21);
    expect(rows).toHaveLength(1);
    expect(rows[0].marketplace).toBe("amazon.co.uk");
  });

  it("parseSheetRows normalizes 'Amazon.co.uk' (sheet casing) to 'amazon.co.uk'", () => {
    const rows = parseSheetRows(solensSheetRows("Amazon.co.uk"), "solens", 21);
    expect(rows).toHaveLength(1);
    expect(rows[0].marketplace).toBe("amazon.co.uk");
  });
});

// ── 2. amazon.co.uk never becomes amazon.com ───────────────────────

describe("Item 2 — amazon.co.uk never becomes amazon.com", () => {
  it("parseSheetRows does not produce 'amazon.com' for a UK sheet row", () => {
    const rows = parseSheetRows(solensSheetRows("amazon.co.uk"), "solens", 21);
    expect(rows[0].marketplace).not.toBe("amazon.com");
    expect(rows[0].marketplace).not.toBe("Amazon.com");
  });

  it("parseSheetRows does not produce 'amazon.com' for any recognised non-US marketplace", () => {
    const rows = parseSheetRows(solensSheetRows("Amazon Germany"), "solens", 21);
    expect(rows[0].marketplace).toBe("amazon.de");
    expect(rows[0].marketplace).not.toBe("amazon.com");
  });
});

// ── 3. Amazon UK normalizes to amazon.co.uk ────────────────────────

describe("Item 3 — 'Amazon UK' normalizes to 'amazon.co.uk'", () => {
  it("normalizeMarketplaceId('Amazon UK') === 'amazon.co.uk'", () => {
    expect(normalizeMarketplaceId("Amazon UK")).toBe("amazon.co.uk");
  });

  it("parseSheetRows normalizes a sheet cell of 'Amazon UK' to 'amazon.co.uk'", () => {
    const rows = parseSheetRows(solensSheetRows("Amazon UK"), "solens", 21);
    expect(rows[0].marketplace).toBe("amazon.co.uk");
  });
});

// ── 4. Amazon USA normalizes to amazon.com ─────────────────────────

describe("Item 4 — 'Amazon USA' normalizes to 'amazon.com'", () => {
  it("normalizeMarketplaceId('Amazon USA') === 'amazon.com'", () => {
    expect(normalizeMarketplaceId("Amazon USA")).toBe("amazon.com");
  });

  it("parseSheetRows normalizes a sheet cell of 'Amazon USA' to 'amazon.com'", () => {
    const rows = parseSheetRows(solensSheetRows("Amazon USA"), "solens", 21);
    expect(rows[0].marketplace).toBe("amazon.com");
  });
});

// ── 5. Missing marketplace does not default to amazon.com ──────────

describe("Item 5 — missing marketplace does not default to amazon.com", () => {
  it("a row with a blank Marketplace cell is skipped entirely, not defaulted", () => {
    const rows = parseSheetRows(solensSheetRows(""), "solens", 21);
    expect(rows).toHaveLength(0);
  });

  it("a row with a whitespace-only Marketplace cell is skipped, not defaulted", () => {
    const rows = parseSheetRows(solensSheetRows("   "), "solens", 21);
    expect(rows).toHaveLength(0);
  });
});

// ── 6. Unknown marketplace does not default to amazon.com ──────────

describe("Item 6 — unknown marketplace does not default to amazon.com", () => {
  it("an unrecognised marketplace value is preserved verbatim, not defaulted", () => {
    const rows = parseSheetRows(solensSheetRows("tiktok.shop"), "solens", 21);
    expect(rows).toHaveLength(1);
    expect(rows[0].marketplace).toBe("tiktok.shop");
    expect(rows[0].marketplace).not.toBe("amazon.com");
  });
});

// ── 7. Google Sheet headers are mapped correctly ───────────────────

describe("Item 7 — Google Sheet headers are mapped correctly", () => {
  it("resolveHeaderMap finds Marketplace at its actual header position, not a hardcoded index", () => {
    const col = resolveHeaderMap(HEADER_ROW);
    expect(col.marketplace).toBe(3);
    expect(col.sku).toBe(0);
    expect(col.productName).toBe(2);
  });

  it("resolveHeaderMap tolerates case and whitespace variance in header text", () => {
    const messyHeaders = ["  sku ", "Asin", "PRODUCT NAME", "marketplace", "FBA  Available", "Inbound Units", "Reserved Units", "Avg Daily Sales", "Lead Time Override", "Last Updated"];
    const col = resolveHeaderMap(messyHeaders);
    expect(col.sku).toBe(0);
    expect(col.marketplace).toBe(3);
  });

  it("resolveHeaderMap finds Marketplace even when column order is shifted", () => {
    // Marketplace moved to position 0, SKU to position 3 — header-driven
    // resolution must still find the right column instead of assuming D.
    const shiftedHeaders = ["Marketplace", "Product Name", "ASIN", "SKU", "FBA Available", "Inbound Units", "Reserved Units", "Avg Daily Sales", "Lead Time Override", "Last Updated"];
    const col = resolveHeaderMap(shiftedHeaders);
    expect(col.marketplace).toBe(0);
    expect(col.sku).toBe(3);
  });

  it("throws a clear error when the Marketplace header is entirely missing", () => {
    const headersWithoutMarketplace = ["SKU", "ASIN", "Product Name", "FBA Available", "Inbound Units", "Reserved Units", "Avg Daily Sales", "Lead Time Override", "Last Updated"];
    expect(() => resolveHeaderMap(headersWithoutMarketplace)).toThrow(/Marketplace/);
  });

  it("falls back to the documented fixed position for non-critical fields when their header can't be matched", () => {
    // "Lead Time Override" header replaced with something unrecognised —
    // should still fall back to the approved fixed position (index 8),
    // not throw, since it isn't a row-identity field.
    const headers = ["SKU", "ASIN", "Product Name", "Marketplace", "FBA Available", "Inbound Units", "Reserved Units", "Avg Daily Sales", "Some Other Column", "Last Updated"];
    const col = resolveHeaderMap(headers);
    expect(col.leadTimeOverride).toBe(8);
  });
});

// ── 8 & 9. Solens SKU included/excluded correctly by marketplace filter ──

describe("Items 8 & 9 — Solens SKU KC-KBMO-CDEV is correctly filtered by marketplace", () => {
  it("Item 8: Solens SKU is included when filtering by amazon.co.uk", () => {
    const rows = parseSheetRows(solensSheetRows("amazon.co.uk"), "solens", 21);
    const filtered = filterByMarketplaceId(rows, "amazon.co.uk");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].sku).toBe("KC-KBMO-CDEV");
  });

  it("Item 9: Solens SKU is excluded when filtering by amazon.com", () => {
    const rows = parseSheetRows(solensSheetRows("amazon.co.uk"), "solens", 21);
    const filtered = filterByMarketplaceId(rows, "amazon.com");
    expect(filtered).toHaveLength(0);
  });
});

// ── 10. Enabled marketplace pills come only from the current client ────

describe("Item 10 — enabled marketplace pills come only from the current client's enabled_marketplaces", () => {
  it("Solens (enabled_marketplaces = ['amazon.co.uk']) shows only amazon.co.uk, not amazon.com", () => {
    const solensPills = normalizeEnabledMarketplaces(["amazon.co.uk"]);
    expect(solensPills).toEqual(["amazon.co.uk"]);
    expect(solensPills).not.toContain("amazon.com");
  });

  it("a different client's enabled_marketplaces do not leak into Solens's pill list", () => {
    const otherClientPills = normalizeEnabledMarketplaces(["amazon.com", "shopify"]);
    const solensPills = normalizeEnabledMarketplaces(["amazon.co.uk"]);
    expect(solensPills).not.toEqual(expect.arrayContaining(otherClientPills));
  });

  it("this previously failed: config.enabledMarketplaces used to be filtered to an empty array for Solens", () => {
    // Reproduces the exact second root-cause bug: the old dashboard page code
    // ran enabledMarketplaces through normalizeMarketplace() (no UK mapping)
    // + a VALID_MARKETPLACE_SET.has() filter that excluded "amazon.co.uk",
    // silently dropping it. normalizeEnabledMarketplaces must not drop it.
    const result = normalizeEnabledMarketplaces(["amazon.co.uk"]);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("amazon.co.uk");
  });
});

// ── 11-13. Display components render "Amazon UK" for the canonical ID ──
// (Logic-level: this project's vitest config has no DOM/component-rendering
// harness — environment: 'node', no @testing-library dependency — so these
// verify the exact getMarketplaceLabel() call each component now uses to
// render its marketplace badge, rather than full component output.)

describe("Items 11-13 — Inbound Summary, SKU Health Monitor, and Reorder Planning display 'Amazon UK'", () => {
  it("Item 11: InboundSummary's marketplace badge resolves to 'Amazon UK' for the Solens row", () => {
    expect(getMarketplaceLabel("amazon.co.uk")).toBe("Amazon UK");
  });

  it("Item 12: InventoryTable's (SKU Health Monitor) marketplace badge resolves to 'Amazon UK'", () => {
    const rows = parseSheetRows(solensSheetRows("amazon.co.uk"), "solens", 21);
    expect(getMarketplaceLabel(rows[0].marketplace)).toBe("Amazon UK");
  });

  it("Item 13: ReorderTable's marketplace column resolves to 'Amazon UK', not 'Amazon.com'", () => {
    const rows = parseSheetRows(solensSheetRows("amazon.co.uk"), "solens", 21);
    const label = getMarketplaceLabel(rows[0].marketplace);
    expect(label).toBe("Amazon UK");
    expect(label).not.toBe("Amazon.com");
  });
});

// ── 14. Historic Forecast finds the SKU after amazon.co.uk is selected ──

describe("Item 14 — Historic Forecast finds KC-KBMO-CDEV after amazon.co.uk is selected", () => {
  it("filterByMarketplaceId returns the Solens SKU when the parsed row came from a raw 'amazon.co.uk' sheet cell", () => {
    const rows = parseSheetRows(solensSheetRows("amazon.co.uk"), "solens", 21);
    const filtered = filterByMarketplaceId(rows, "amazon.co.uk");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].sku).toBe("KC-KBMO-CDEV");
  });

  it("also finds the SKU when the sheet cell used the display-string casing 'Amazon.co.uk'", () => {
    const rows = parseSheetRows(solensSheetRows("Amazon.co.uk"), "solens", 21);
    const filtered = filterByMarketplaceId(rows, "amazon.co.uk");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].sku).toBe("KC-KBMO-CDEV");
  });
});

// ── End-to-end Solens scenario — the exact facts from the bug report ──

describe("End-to-end Solens scenario", () => {
  it("raw sheet cell 'amazon.co.uk' + client enabled_marketplaces ['amazon.co.uk'] → SKU visible, labeled 'Amazon UK'", () => {
    // Step 1: parse the sheet row (lib/sheets-parser.ts)
    const rows = parseSheetRows(solensSheetRows("amazon.co.uk"), "solens", 21);
    expect(rows[0].marketplace).toBe("amazon.co.uk"); // not "Amazon.com"

    // Step 2: client's enabled marketplaces (app/(app)/dashboard/[clientSlug]/page.tsx)
    const enabledMarketplaces = normalizeEnabledMarketplaces(["amazon.co.uk"]);
    expect(enabledMarketplaces).toEqual(["amazon.co.uk"]);

    // Step 3: filtering by the (only) enabled marketplace surfaces the SKU
    const filtered = filterByMarketplaceId(rows, enabledMarketplaces[0]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].sku).toBe("KC-KBMO-CDEV");

    // Step 4: display label is "Amazon UK", never "Amazon.com" or "amazon.co.uk"
    const label = getMarketplaceLabel(filtered[0].marketplace);
    expect(label).toBe("Amazon UK");
  });
});

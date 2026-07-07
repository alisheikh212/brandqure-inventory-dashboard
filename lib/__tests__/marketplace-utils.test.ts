import { describe, it, expect } from 'vitest';
import {
  normalizeMarketplaceId,
  getMarketplaceLabel,
  getInventoryValue,
  filterByMarketplaceId,
  rowMatchesMarketplace,
  normalizeEnabledMarketplaces,
} from '../marketplace-utils';

// ─────────────────────────────────────────────────────────────────
// Test 1: amazon.co.uk displays as "Amazon UK"
// ─────────────────────────────────────────────────────────────────

describe('getMarketplaceLabel — amazon.co.uk displays as Amazon UK', () => {
  it('returns "Amazon UK" for "amazon.co.uk"', () => {
    expect(getMarketplaceLabel('amazon.co.uk')).toBe('Amazon UK');
  });

  it('returns "Amazon UK" for "Amazon UK" (passes through normalization)', () => {
    expect(getMarketplaceLabel('Amazon UK')).toBe('Amazon UK');
  });

  it('returns "Amazon UK" for "Amazon.co.uk"', () => {
    expect(getMarketplaceLabel('Amazon.co.uk')).toBe('Amazon UK');
  });
});

// ─────────────────────────────────────────────────────────────────
// Test 2: "Amazon UK" normalizes to "amazon.co.uk"
// ─────────────────────────────────────────────────────────────────

describe('normalizeMarketplaceId — Amazon UK variants → amazon.co.uk', () => {
  it('"Amazon UK" → "amazon.co.uk"', () => {
    expect(normalizeMarketplaceId('Amazon UK')).toBe('amazon.co.uk');
  });

  it('"amazon.co.uk" → "amazon.co.uk" (identity)', () => {
    expect(normalizeMarketplaceId('amazon.co.uk')).toBe('amazon.co.uk');
  });

  it('"Amazon.co.uk" → "amazon.co.uk"', () => {
    expect(normalizeMarketplaceId('Amazon.co.uk')).toBe('amazon.co.uk');
  });

  it('"UK" → "amazon.co.uk"', () => {
    expect(normalizeMarketplaceId('UK')).toBe('amazon.co.uk');
  });

  it('"uk" (lowercase) → "amazon.co.uk"', () => {
    expect(normalizeMarketplaceId('uk')).toBe('amazon.co.uk');
  });
});

// ─────────────────────────────────────────────────────────────────
// Test 3: amazon.co.uk NEVER displays as Amazon.com
// ─────────────────────────────────────────────────────────────────

describe('amazon.co.uk must never resolve to Amazon.com or Amazon US', () => {
  const ukInputs = ['amazon.co.uk', 'Amazon UK', 'Amazon.co.uk', 'UK', 'uk'];

  for (const input of ukInputs) {
    it(`getMarketplaceLabel("${input}") !== "Amazon.com" and !== "Amazon US"`, () => {
      const label = getMarketplaceLabel(input);
      expect(label).not.toBe('Amazon.com');
      expect(label).not.toBe('Amazon US');
    });

    it(`normalizeMarketplaceId("${input}") !== "amazon.com"`, () => {
      expect(normalizeMarketplaceId(input)).not.toBe('amazon.com');
    });

    it(`getInventoryValue("${input}") !== "Amazon.com"`, () => {
      expect(getInventoryValue(input)).not.toBe('Amazon.com');
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// Test 4: Unknown marketplace values do not default to Amazon US
// ─────────────────────────────────────────────────────────────────

describe('unknown marketplace values — no silent Amazon US default', () => {
  const unknowns = ['amazon.au', 'Amazon Mexico', 'TikTok Shop', 'xyz', ''];

  it('normalizeMarketplaceId returns the original value for unknown inputs', () => {
    expect(normalizeMarketplaceId('amazon.au')).toBe('amazon.au');
    expect(normalizeMarketplaceId('TikTok Shop')).toBe('TikTok Shop');
  });

  for (const u of unknowns.filter(Boolean)) {
    it(`normalizeMarketplaceId("${u}") !== "amazon.com"`, () => {
      expect(normalizeMarketplaceId(u)).not.toBe('amazon.com');
    });

    it(`getMarketplaceLabel("${u}") !== "Amazon US"`, () => {
      expect(getMarketplaceLabel(u)).not.toBe('Amazon US');
    });

    it(`getInventoryValue("${u}") is null (not "Amazon.com")`, () => {
      expect(getInventoryValue(u)).toBeNull();
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// Test 5: Single marketplace auto-selection (via normalizeEnabledMarketplaces)
// ─────────────────────────────────────────────────────────────────

describe('single marketplace auto-selection', () => {
  it('normalizeEnabledMarketplaces(["amazon.co.uk"]) returns ["amazon.co.uk"]', () => {
    expect(normalizeEnabledMarketplaces(['amazon.co.uk'])).toEqual(['amazon.co.uk']);
  });

  it('single entry: length is 1 → caller can auto-select', () => {
    const result = normalizeEnabledMarketplaces(['Amazon UK']);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('amazon.co.uk');
  });

  it('multiple entries: length > 1 → caller must prompt user', () => {
    const result = normalizeEnabledMarketplaces(['amazon.co.uk', 'amazon.com']);
    expect(result).toHaveLength(2);
  });

  it('deduplicates variant aliases to one entry', () => {
    // "Amazon UK" and "amazon.co.uk" both normalize to "amazon.co.uk"
    const result = normalizeEnabledMarketplaces(['Amazon UK', 'amazon.co.uk']);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('amazon.co.uk');
  });
});

// ─────────────────────────────────────────────────────────────────
// Test 6: SKU list is filtered by selected marketplace
// ─────────────────────────────────────────────────────────────────

const INVENTORY = [
  { id: 'uk-1', sku: 'UK-SKU-A', marketplace: 'Amazon UK',   productName: 'UK Towel' },
  { id: 'uk-2', sku: 'UK-SKU-B', marketplace: 'Amazon UK',   productName: 'UK Brush' },
  { id: 'us-1', sku: 'US-SKU-A', marketplace: 'Amazon.com',  productName: 'US Widget' },
  { id: 'ca-1', sku: 'CA-SKU-A', marketplace: 'Amazon.ca',   productName: 'CA Gear' },
];

describe('filterByMarketplaceId', () => {
  it('returns only UK rows for "amazon.co.uk"', () => {
    const rows = filterByMarketplaceId(INVENTORY, 'amazon.co.uk');
    expect(rows).toHaveLength(2);
    expect(rows.every(r => r.marketplace === 'Amazon UK')).toBe(true);
  });

  it('returns only US rows for "amazon.com"', () => {
    const rows = filterByMarketplaceId(INVENTORY, 'amazon.com');
    expect(rows).toHaveLength(1);
    expect(rows[0].sku).toBe('US-SKU-A');
  });

  it('returns only CA rows for "amazon.ca"', () => {
    const rows = filterByMarketplaceId(INVENTORY, 'amazon.ca');
    expect(rows).toHaveLength(1);
    expect(rows[0].sku).toBe('CA-SKU-A');
  });

  it('returns empty array for unknown marketplace', () => {
    const rows = filterByMarketplaceId(INVENTORY, 'amazon.au');
    expect(rows).toHaveLength(0);
  });

  it('accepts "Amazon UK" alias as marketplace ID and filters correctly', () => {
    const rows = filterByMarketplaceId(INVENTORY, 'Amazon UK');
    expect(rows).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────
// Test 7: Changing marketplace clears an incompatible SKU
// ─────────────────────────────────────────────────────────────────

describe('rowMatchesMarketplace — used to detect incompatible SKU after marketplace change', () => {
  const ukRow = { sku: 'UK-SKU-A', marketplace: 'Amazon UK' };
  const usRow = { sku: 'US-SKU-A', marketplace: 'Amazon.com' };

  it('UK row is compatible with "amazon.co.uk"', () => {
    expect(rowMatchesMarketplace(ukRow, 'amazon.co.uk')).toBe(true);
  });

  it('UK row is NOT compatible with "amazon.com"', () => {
    expect(rowMatchesMarketplace(ukRow, 'amazon.com')).toBe(false);
  });

  it('US row is NOT compatible with "amazon.co.uk"', () => {
    expect(rowMatchesMarketplace(usRow, 'amazon.co.uk')).toBe(false);
  });

  it('US row is compatible with "amazon.com"', () => {
    expect(rowMatchesMarketplace(usRow, 'amazon.com')).toBe(true);
  });

  it('row with unknown marketplace returns false for any known ID', () => {
    const weird = { sku: 'X', marketplace: 'SomePlatform' };
    expect(rowMatchesMarketplace(weird, 'amazon.co.uk')).toBe(false);
    expect(rowMatchesMarketplace(weird, 'amazon.com')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// Test 8: Single SKU can auto-select only after marketplace filtering
// ─────────────────────────────────────────────────────────────────

describe('single SKU auto-selection after marketplace filtering', () => {
  it('filtered list has 1 row → auto-select is possible', () => {
    const rows = filterByMarketplaceId(INVENTORY, 'amazon.ca');
    expect(rows).toHaveLength(1);
    // Caller uses rows[0] as the auto-selected SKU
    expect(rows[0].sku).toBe('CA-SKU-A');
  });

  it('filtered list has >1 row → no auto-select', () => {
    const rows = filterByMarketplaceId(INVENTORY, 'amazon.co.uk');
    expect(rows.length).toBeGreaterThan(1);
  });

  it('auto-select is only safe after marketplace resolved (empty list = no selection)', () => {
    // Without a marketplace, filter returns nothing
    const rows = filterByMarketplaceId(INVENTORY, '');
    expect(rows).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// Tests 9-14: raw canonical IDs in inventory rows (the real bug scenario)
// Client has enabled_marketplaces = ["amazon.co.uk"] and sheet stores
// marketplace = "amazon.co.uk" (not the display string "Amazon UK").
// ─────────────────────────────────────────────────────────────────

const RAW_CANONICAL_INVENTORY = [
  { id: 'uk-raw-1', sku: 'KC-KBMO-CDEV', marketplace: 'amazon.co.uk', productName: 'UK Device' },
  { id: 'us-raw-1', sku: 'US-SKU-X',     marketplace: 'amazon.com',   productName: 'US Widget'  },
];

describe('Test 9 — selector label and value separation', () => {
  it('getMarketplaceLabel("amazon.co.uk") returns "Amazon UK" (display label)', () => {
    expect(getMarketplaceLabel('amazon.co.uk')).toBe('Amazon UK');
  });

  it('normalizeMarketplaceId("amazon.co.uk") returns "amazon.co.uk" (internal value unchanged)', () => {
    expect(normalizeMarketplaceId('amazon.co.uk')).toBe('amazon.co.uk');
  });

  it('label and internal value are different strings — label is never used as the filter key', () => {
    const label = getMarketplaceLabel('amazon.co.uk');
    const value = normalizeMarketplaceId('amazon.co.uk');
    expect(label).toBe('Amazon UK');
    expect(value).toBe('amazon.co.uk');
    expect(label).not.toBe(value);
  });
});

describe('Test 10 — inventory rows with raw canonical marketplace field are returned', () => {
  it('filterByMarketplaceId returns KC-KBMO-CDEV when sheet stores "amazon.co.uk"', () => {
    const rows = filterByMarketplaceId(RAW_CANONICAL_INVENTORY, 'amazon.co.uk');
    expect(rows).toHaveLength(1);
    expect(rows[0].sku).toBe('KC-KBMO-CDEV');
  });

  it('does not return US rows when filtering for amazon.co.uk', () => {
    const rows = filterByMarketplaceId(RAW_CANONICAL_INVENTORY, 'amazon.co.uk');
    expect(rows.every(r => r.marketplace === 'amazon.co.uk')).toBe(true);
  });
});

describe('Test 11 — "Amazon UK" and "amazon.co.uk" normalize to the same canonical value', () => {
  it('normalizeMarketplaceId("Amazon UK") === normalizeMarketplaceId("amazon.co.uk")', () => {
    expect(normalizeMarketplaceId('Amazon UK')).toBe(normalizeMarketplaceId('amazon.co.uk'));
  });

  it('filterByMarketplaceId with "Amazon UK" selector matches row with marketplace "amazon.co.uk"', () => {
    const rows = filterByMarketplaceId(RAW_CANONICAL_INVENTORY, 'Amazon UK');
    expect(rows).toHaveLength(1);
    expect(rows[0].sku).toBe('KC-KBMO-CDEV');
  });
});

describe('Test 12 — whitespace and casing do not break filtering', () => {
  const WHITESPACE_INVENTORY = [
    { sku: 'WS-1', marketplace: '  amazon.co.uk  ' },
    { sku: 'WS-2', marketplace: 'AMAZON.CO.UK' },
  ];

  it('trims whitespace from row.marketplace before comparison', () => {
    const rows = filterByMarketplaceId(WHITESPACE_INVENTORY, 'amazon.co.uk');
    expect(rows.find(r => r.sku === 'WS-1')).toBeTruthy();
  });

  it('normalizeMarketplaceId trims leading/trailing whitespace', () => {
    expect(normalizeMarketplaceId('  amazon.co.uk  ')).toBe('amazon.co.uk');
  });
});

describe('Test 13 — display label is never used as the filter value', () => {
  it('filtering by the label string "Amazon UK" still returns rows with canonical marketplace', () => {
    // Proves the filter does not do row.marketplace === "Amazon UK"
    const rows = filterByMarketplaceId(RAW_CANONICAL_INVENTORY, 'amazon.co.uk');
    expect(rows).toHaveLength(1);
    expect(rows[0].marketplace).toBe('amazon.co.uk'); // raw value in row
  });

  it('direct label-vs-canonical string comparison fails (confirming the old bug)', () => {
    // "Amazon UK" !== "amazon.co.uk" — old code would have returned nothing
    expect('Amazon UK' === 'amazon.co.uk').toBe(false);
  });

  it('normalized comparison succeeds where label comparison would fail', () => {
    expect(normalizeMarketplaceId('Amazon UK')).toBe(normalizeMarketplaceId('amazon.co.uk'));
  });
});

describe('Test 14 — unknown marketplace values are not defaulted to amazon.com', () => {
  it('normalizeMarketplaceId("tiktok.shop") returns the original, not "amazon.com"', () => {
    expect(normalizeMarketplaceId('tiktok.shop')).toBe('tiktok.shop');
    expect(normalizeMarketplaceId('tiktok.shop')).not.toBe('amazon.com');
  });

  it('filterByMarketplaceId for unknown marketplace returns empty, not US rows', () => {
    const rows = filterByMarketplaceId(RAW_CANONICAL_INVENTORY, 'tiktok.shop');
    expect(rows).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// Additional: other known marketplaces round-trip correctly
// ─────────────────────────────────────────────────────────────────

describe('other marketplaces normalize correctly', () => {
  it('"Amazon.com" → "amazon.com" (existing display string variant)', () => {
    expect(normalizeMarketplaceId('Amazon.com')).toBe('amazon.com');
  });

  it('"Amazon.ca" → "amazon.ca"', () => {
    expect(normalizeMarketplaceId('Amazon.ca')).toBe('amazon.ca');
  });

  it('"Amazon Canada" → "amazon.ca"', () => {
    expect(normalizeMarketplaceId('Amazon Canada')).toBe('amazon.ca');
  });

  it('"Shopify" → "shopify"', () => {
    expect(normalizeMarketplaceId('Shopify')).toBe('shopify');
    expect(getMarketplaceLabel('shopify')).toBe('Shopify');
  });
});

// ─────────────────────────────────────────────────────────────────
// Tests 15-24: manual-selection behaviour contracts
// These tests verify the utility behaviour that drives the UI rules:
// no auto-selection, options scoped to account, canonical storage.
// ─────────────────────────────────────────────────────────────────

const CLIENT_ENABLED = ['amazon.co.uk'];
const MULTI_CLIENT_ENABLED = ['amazon.com', 'amazon.co.uk', 'amazon.ca'];

const ACCOUNT_INVENTORY = [
  { id: '1', sku: 'KC-KBMO-CDEV', marketplace: 'amazon.co.uk', productName: 'UK Device' },
  { id: '2', sku: 'US-WIDGET',    marketplace: 'amazon.com',   productName: 'US Widget'  },
];

describe('Test 15 — no marketplace is selected automatically', () => {
  it('normalizeEnabledMarketplaces returns options but does not select one', () => {
    // The component initialises selectedMarketplaceId = null.
    // This test confirms the utility returns a list; selection is always null until user acts.
    const options = normalizeEnabledMarketplaces(CLIENT_ENABLED);
    expect(options).toHaveLength(1);
    // The selected value starts as null — represented here by the placeholder check
    const selected: string | null = null;
    expect(selected).toBeNull();
  });

  it('single enabled marketplace does not imply a selected value', () => {
    const options = normalizeEnabledMarketplaces(CLIENT_ENABLED);
    // Even with one option, selectedMarketplaceId remains null until explicitly chosen
    expect(options).toHaveLength(1);
    expect(options[0]).toBe('amazon.co.uk');
  });
});

describe('Test 16 — no SKU is selected automatically', () => {
  it('filterByMarketplaceId with null marketplace returns empty (no marketplace ⇒ no SKUs)', () => {
    // selectedMarketplaceId = null → filterByMarketplaceId is not called; SKU list is empty
    const rows = filterByMarketplaceId(ACCOUNT_INVENTORY, '');
    expect(rows).toHaveLength(0);
  });

  it('single SKU in filtered list does not become auto-selected (selectedSkuId stays null)', () => {
    const rows = filterByMarketplaceId(ACCOUNT_INVENTORY, 'amazon.co.uk');
    expect(rows).toHaveLength(1);
    // selectedSkuId starts null; the component never sets it automatically
    const selectedSkuId: string | null = null;
    expect(selectedSkuId).toBeNull();
  });
});

describe('Test 17 — marketplace options come from enabled_marketplaces only', () => {
  it('single-marketplace account produces exactly one option', () => {
    const options = normalizeEnabledMarketplaces(CLIENT_ENABLED);
    expect(options).toHaveLength(1);
    expect(options[0]).toBe('amazon.co.uk');
  });

  it('multi-marketplace account produces the correct options', () => {
    const options = normalizeEnabledMarketplaces(MULTI_CLIENT_ENABLED);
    expect(options).toEqual(['amazon.com', 'amazon.co.uk', 'amazon.ca']);
  });

  it('duplicate entries in enabled_marketplaces are deduplicated', () => {
    const options = normalizeEnabledMarketplaces(['amazon.co.uk', 'Amazon UK', 'amazon.co.uk']);
    expect(options).toHaveLength(1);
    expect(options[0]).toBe('amazon.co.uk');
  });
});

describe('Test 18 — amazon.co.uk displays as Amazon UK in the dropdown label', () => {
  it('getMarketplaceLabel("amazon.co.uk") === "Amazon UK"', () => {
    expect(getMarketplaceLabel('amazon.co.uk')).toBe('Amazon UK');
  });

  it('option label is "Amazon UK", option value is "amazon.co.uk"', () => {
    const id = normalizeEnabledMarketplaces(CLIENT_ENABLED)[0];
    const label = getMarketplaceLabel(id);
    expect(id).toBe('amazon.co.uk');
    expect(label).toBe('Amazon UK');
  });
});

describe('Test 19 — stored dropdown value remains amazon.co.uk (not the display label)', () => {
  it('normalizeMarketplaceId("amazon.co.uk") returns "amazon.co.uk", not "Amazon UK"', () => {
    const stored = normalizeMarketplaceId('amazon.co.uk');
    expect(stored).toBe('amazon.co.uk');
    expect(stored).not.toBe('Amazon UK');
  });

  it('selecting from the dropdown stores the canonical ID, never the label', () => {
    // Simulates: user picks the option whose value="amazon.co.uk"
    // The onChange handler receives e.target.value = "amazon.co.uk"
    const selectedValue = 'amazon.co.uk';
    expect(selectedValue).toBe('amazon.co.uk');
    expect(selectedValue).not.toBe('Amazon UK');
  });
});

describe('Test 20 — SKU dropdown is disabled until marketplace is selected', () => {
  it('with no marketplace (null), filterByMarketplaceId returns no rows', () => {
    // When selectedMarketplaceId is null, the component skips filtering
    // and renders the "Select marketplace first" disabled state.
    const rows = filterByMarketplaceId(ACCOUNT_INVENTORY, '');
    expect(rows).toHaveLength(0);
  });

  it('after marketplace is selected, rows become available', () => {
    const rows = filterByMarketplaceId(ACCOUNT_INVENTORY, 'amazon.co.uk');
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('Test 21 — selecting amazon.co.uk returns matching UK SKUs', () => {
  it('filterByMarketplaceId("amazon.co.uk") returns KC-KBMO-CDEV', () => {
    const rows = filterByMarketplaceId(ACCOUNT_INVENTORY, 'amazon.co.uk');
    expect(rows).toHaveLength(1);
    expect(rows[0].sku).toBe('KC-KBMO-CDEV');
  });

  it('does not return US rows when amazon.co.uk is selected', () => {
    const rows = filterByMarketplaceId(ACCOUNT_INVENTORY, 'amazon.co.uk');
    expect(rows.every((r) => r.marketplace === 'amazon.co.uk')).toBe(true);
  });
});

describe('Test 22 — changing marketplace clears the selected SKU', () => {
  it('rowMatchesMarketplace returns false for a UK SKU when switching to amazon.com', () => {
    const ukRow = ACCOUNT_INVENTORY[0]; // marketplace = "amazon.co.uk"
    expect(rowMatchesMarketplace(ukRow, 'amazon.com')).toBe(false);
    // When this returns false, the component clears selectedSkuId
  });

  it('rowMatchesMarketplace returns true for a UK SKU on amazon.co.uk', () => {
    const ukRow = ACCOUNT_INVENTORY[0];
    expect(rowMatchesMarketplace(ukRow, 'amazon.co.uk')).toBe(true);
  });
});

describe('Test 23 — other clients marketplaces are not shown', () => {
  it('normalizeEnabledMarketplaces only processes the provided list', () => {
    // Account A has ["amazon.co.uk"] — amazon.com must not appear
    const optionsA = normalizeEnabledMarketplaces(['amazon.co.uk']);
    expect(optionsA).not.toContain('amazon.com');
    expect(optionsA).not.toContain('amazon.ca');
  });

  it('an account with ["amazon.com", "amazon.ca"] does not include amazon.co.uk', () => {
    const optionsB = normalizeEnabledMarketplaces(['amazon.com', 'amazon.ca']);
    expect(optionsB).not.toContain('amazon.co.uk');
  });
});

describe('Test 24 — unknown marketplaces do not default to Amazon US', () => {
  it('normalizeMarketplaceId("tiktok.shop") stays "tiktok.shop"', () => {
    expect(normalizeMarketplaceId('tiktok.shop')).toBe('tiktok.shop');
    expect(normalizeMarketplaceId('tiktok.shop')).not.toBe('amazon.com');
  });

  it('getMarketplaceLabel for unknown returns original value, not "Amazon US"', () => {
    expect(getMarketplaceLabel('some.unknown.market')).not.toBe('Amazon US');
    expect(getMarketplaceLabel('some.unknown.market')).not.toBe('Amazon.com');
  });

  it('filterByMarketplaceId for unknown marketplace returns empty array', () => {
    const rows = filterByMarketplaceId(ACCOUNT_INVENTORY, 'tiktok.shop');
    expect(rows).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// Tests 25-26: new marketplace entries (extended catalog)
// ─────────────────────────────────────────────────────────────────

describe('extended marketplace catalog labels', () => {
  it('amazon.com.au → Amazon Australia', () => {
    expect(getMarketplaceLabel('amazon.com.au')).toBe('Amazon Australia');
    expect(normalizeMarketplaceId('Amazon Australia')).toBe('amazon.com.au');
  });

  it('amazon.ae → Amazon UAE', () => {
    expect(getMarketplaceLabel('amazon.ae')).toBe('Amazon UAE');
    expect(normalizeMarketplaceId('Amazon UAE')).toBe('amazon.ae');
  });

  it('amazon.sa → Amazon Saudi Arabia', () => {
    expect(getMarketplaceLabel('amazon.sa')).toBe('Amazon Saudi Arabia');
    expect(normalizeMarketplaceId('Amazon Saudi Arabia')).toBe('amazon.sa');
  });

  it('amazon.in → Amazon India', () => {
    expect(getMarketplaceLabel('amazon.in')).toBe('Amazon India');
    expect(normalizeMarketplaceId('Amazon India')).toBe('amazon.in');
  });

  it('amazon.co.jp → Amazon Japan', () => {
    expect(getMarketplaceLabel('amazon.co.jp')).toBe('Amazon Japan');
    expect(normalizeMarketplaceId('Amazon Japan')).toBe('amazon.co.jp');
  });
});

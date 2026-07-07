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

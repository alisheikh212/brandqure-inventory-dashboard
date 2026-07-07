import { describe, it, expect } from 'vitest';
import {
  parsePeriodLabel,
  parseSellerboardCSV,
  defaultSelectedLabels,
  computeForecast,
} from '../historic-forecast';

// ─────────────────────────────────────────────────────────────────
// parsePeriodLabel
// ─────────────────────────────────────────────────────────────────

describe('parsePeriodLabel — full months', () => {
  it('parses "June 2026"', () => {
    const p = parsePeriodLabel('June 2026')!;
    expect(p.month).toBe(6);
    expect(p.year).toBe(2026);
    expect(p.days).toBe(30);
    expect(p.isPartial).toBe(false);
    expect(p.startDay).toBe(1);
  });

  it('parses "July 2025"', () => {
    const p = parsePeriodLabel('July 2025')!;
    expect(p.month).toBe(7);
    expect(p.year).toBe(2025);
    expect(p.days).toBe(31);
  });

  it('parses "February 2024" — leap year (29 days)', () => {
    const p = parsePeriodLabel('February 2024')!;
    expect(p.days).toBe(29);
  });

  it('parses "February 2025" — non-leap year (28 days)', () => {
    const p = parsePeriodLabel('February 2025')!;
    expect(p.days).toBe(28);
  });

  it('parses "December 2025"', () => {
    const p = parsePeriodLabel('December 2025')!;
    expect(p.month).toBe(12);
    expect(p.days).toBe(31);
  });

  it('returns null for unknown month name', () => {
    expect(parsePeriodLabel('Octember 2026')).toBeNull();
  });
});

describe('parsePeriodLabel — partial periods', () => {
  it('parses "1-7 July 2026" (hyphen)', () => {
    const p = parsePeriodLabel('1-7 July 2026')!;
    expect(p.isPartial).toBe(true);
    expect(p.days).toBe(7);
    expect(p.month).toBe(7);
    expect(p.year).toBe(2026);
    expect(p.startDay).toBe(1);
  });

  it('parses "1–7 July 2026" (en-dash)', () => {
    const p = parsePeriodLabel('1–7 July 2026')!;
    expect(p.isPartial).toBe(true);
    expect(p.days).toBe(7);
  });

  it('parses "15-31 August 2025"', () => {
    const p = parsePeriodLabel('15-31 August 2025')!;
    expect(p.days).toBe(17); // 31 - 15 + 1
    expect(p.startDay).toBe(15);
  });

  it('returns null when endDay < startDay', () => {
    expect(parsePeriodLabel('10-5 July 2026')).toBeNull();
  });

  it('returns null for completely unrecognised format', () => {
    expect(parsePeriodLabel('Total')).toBeNull();
    expect(parsePeriodLabel('')).toBeNull();
    expect(parsePeriodLabel('Parameter/Date')).toBeNull();
  });
});

describe('parsePeriodLabel — sortKey ordering', () => {
  it('older period has smaller sortKey than newer period', () => {
    const jul25 = parsePeriodLabel('July 2025')!;
    const jun26 = parsePeriodLabel('June 2026')!;
    expect(jul25.sortKey).toBeLessThan(jun26.sortKey);
  });

  it('partial period in same month sorts after start of month', () => {
    const full = parsePeriodLabel('July 2026')!;
    const partial = parsePeriodLabel('1-7 July 2026')!;
    // Both have sortKey in July 2026; partial startDay=1, full startDay=1
    // They share the same day=1 key — both 20260701
    expect(partial.sortKey).toBe(full.sortKey);
  });
});

// ─────────────────────────────────────────────────────────────────
// parseSellerboardCSV
// ─────────────────────────────────────────────────────────────────

// Minimal representative CSV matching the Sellerboard P&L export format
const SAMPLE_CSV = `Parameter/Date,1-7 July 2026,June 2026,May 2026,April 2026,March 2026,February 2026,January 2026,December 2025,November 2025,October 2025,September 2025,August 2025,July 2025,Total
Units,321,2302,2535,2148,2303,1986,2412,2876,2543,2765,2234,2314,1246,32985
Organic,200,1500,1600,1400,1500,1300,1600,1900,1700,1800,1500,1500,800,21500
Sponsored Products,121,802,935,748,803,686,812,976,843,965,734,814,446,9485
Refunds,-5,-20,-30,-15,-25,-18,-22,-30,-28,-25,-20,-22,-10,-270
Sales,45000,120000,130000,112000,118000,102000,124000,148000,132000,143000,116000,119000,65000,1574000`;

describe('parseSellerboardCSV', () => {
  it('parses 13 periods from sample (12 full months + 1 partial)', () => {
    const result = parseSellerboardCSV(SAMPLE_CSV);
    expect(result.error).toBeUndefined();
    expect(result.periods).toHaveLength(13); // 12 complete + 1 partial (no Total)
  });

  it('excludes the Total column', () => {
    const result = parseSellerboardCSV(SAMPLE_CSV);
    const labels = result.periods.map((p) => p.label);
    expect(labels).not.toContain('Total');
  });

  it('correctly reads units for June 2026 (2302)', () => {
    const result = parseSellerboardCSV(SAMPLE_CSV);
    const jun = result.periods.find((p) => p.label === 'June 2026')!;
    expect(jun.units).toBe(2302);
  });

  it('correctly reads units for partial period "1-7 July 2026" (321)', () => {
    const result = parseSellerboardCSV(SAMPLE_CSV);
    const partial = result.periods.find((p) => p.label === '1-7 July 2026')!;
    expect(partial.units).toBe(321);
    expect(partial.isPartial).toBe(true);
    expect(partial.days).toBe(7);
  });

  it('marks full months as non-partial', () => {
    const result = parseSellerboardCSV(SAMPLE_CSV);
    const fullMonths = result.periods.filter((p) => !p.isPartial);
    expect(fullMonths).toHaveLength(12);
  });

  it('returns error for empty string', () => {
    const result = parseSellerboardCSV('');
    expect(result.error).toBeDefined();
    expect(result.periods).toHaveLength(0);
  });

  it('returns error when Parameter/Date header is missing', () => {
    const csv = 'Date,Jan 2026,Feb 2026\nUnits,100,200\n';
    const result = parseSellerboardCSV(csv);
    expect(result.error).toMatch(/Parameter\/Date/);
  });

  it('returns error when Units row is missing', () => {
    const csv = 'Parameter/Date,January 2026,February 2026\nOrganic,100,200\n';
    const result = parseSellerboardCSV(csv);
    expect(result.error).toMatch(/Units/);
  });

  it('does NOT pick up nested "Organic" or "Direct units" rows as the Units row', () => {
    const csv =
      'Parameter/Date,January 2026\nOrganic,500\nDirect units,300\nUnits,800\n';
    const result = parseSellerboardCSV(csv);
    expect(result.error).toBeUndefined();
    expect(result.periods[0].units).toBe(800); // the real Units row
  });

  it('handles comma-formatted numbers ("1,234")', () => {
    const csv = 'Parameter/Date,January 2026\nUnits,"1,234"\n';
    const result = parseSellerboardCSV(csv);
    expect(result.periods[0].units).toBe(1234);
  });
});

// ─────────────────────────────────────────────────────────────────
// defaultSelectedLabels
// ─────────────────────────────────────────────────────────────────

describe('defaultSelectedLabels', () => {
  it('selects latest 12 complete months, excludes partial', () => {
    const result = parseSellerboardCSV(SAMPLE_CSV);
    const selected = defaultSelectedLabels(result.periods);
    // 12 complete months should be selected
    expect(selected.size).toBe(12);
    // Partial period must not be selected by default
    expect(selected.has('1-7 July 2026')).toBe(false);
  });

  it('selected period labels match the 12 most recent full months', () => {
    const result = parseSellerboardCSV(SAMPLE_CSV);
    const selected = defaultSelectedLabels(result.periods);
    // June 2026 is the most recent full month and must be selected
    expect(selected.has('June 2026')).toBe(true);
    expect(selected.has('July 2025')).toBe(true);
  });

  it('selects fewer than 12 when fewer full months available', () => {
    const csv =
      'Parameter/Date,January 2026,February 2026\nUnits,1000,900\n';
    const result = parseSellerboardCSV(csv);
    const selected = defaultSelectedLabels(result.periods);
    expect(selected.size).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────
// computeForecast — spec validation test
// ─────────────────────────────────────────────────────────────────

describe('computeForecast', () => {
  it('matches spec validation: July 2025 – June 2026, 90d lead time, 15% cushion', () => {
    // 12 complete months: total 32,664 units, 365 days
    const result = computeForecast({
      selectedUnits: 32664,
      selectedDays: 365,
      leadTimeDays: 90,
      cushionPct: 15,
      fbaDeducted: 0,
      threePlDeducted: 0,
      inboundDeducted: 0,
    });

    // avgDailySales ≈ 89.4904
    expect(result.avgDailySales).toBeCloseTo(89.4904, 2);
    // leadTimeDemand ≈ 8054.14
    expect(result.leadTimeDemand).toBeCloseTo(8054.14, 0);
    // safetyStock ≈ 1208.12
    expect(result.safetyStock).toBeCloseTo(1208.12, 0);
    // grossRequirement ≈ 9262.26 → ceil = 9263 (with 0 inventory)
    expect(result.recommendedOrderQuantity).toBe(9263);
  });

  it('deducts eligible inventory from recommendation', () => {
    const result = computeForecast({
      selectedUnits: 32664,
      selectedDays: 365,
      leadTimeDays: 90,
      cushionPct: 15,
      fbaDeducted: 2000,
      threePlDeducted: 0,
      inboundDeducted: 0,
    });
    // gross ≈ 9262.26 − 2000 = 7262.26 → ceil = 7263
    expect(result.recommendedOrderQuantity).toBe(7263);
  });

  it('never returns a negative recommendation', () => {
    const result = computeForecast({
      selectedUnits: 100,
      selectedDays: 30,
      leadTimeDays: 10,
      cushionPct: 15,
      fbaDeducted: 99999,
      threePlDeducted: 0,
      inboundDeducted: 0,
    });
    expect(result.recommendedOrderQuantity).toBe(0);
  });

  it('rounds up fractional recommendation (ceil not round)', () => {
    // gross = 10.1 units needed, 0 inventory → ceil = 11
    const result = computeForecast({
      selectedUnits: 1,
      selectedDays: 1,
      leadTimeDays: 10,
      cushionPct: 1,
      fbaDeducted: 0,
      threePlDeducted: 0,
      inboundDeducted: 0,
    });
    // avgDailySales=1, demand=10, safety=0.1, gross=10.1 → ceil=11
    expect(result.recommendedOrderQuantity).toBe(11);
  });

  it('does not round avgDailySales before using it', () => {
    // 7 units in 3 days = 2.333... daily
    // 10-day lead time → demand = 23.333...
    // 0% cushion → gross = 23.333... → ceil = 24
    const result = computeForecast({
      selectedUnits: 7,
      selectedDays: 3,
      leadTimeDays: 10,
      cushionPct: 0,
      fbaDeducted: 0,
      threePlDeducted: 0,
      inboundDeducted: 0,
    });
    expect(result.recommendedOrderQuantity).toBe(24);
  });

  it('sums all three inventory deduction sources', () => {
    const result = computeForecast({
      selectedUnits: 1000,
      selectedDays: 10,
      leadTimeDays: 1,
      cushionPct: 0,
      fbaDeducted: 10,
      threePlDeducted: 20,
      inboundDeducted: 30,
    });
    expect(result.eligibleInventory).toBe(60);
    // demand = 100 × 1 = 100, gross = 100, net = 40 → ceil = 40
    expect(result.recommendedOrderQuantity).toBe(40);
  });
});

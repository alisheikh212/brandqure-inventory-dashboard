// ============================================================
// Historic Forecast — CSV Parser & Calculation Engine
// Pure functions only — no browser APIs, no Next.js imports.
// ============================================================

const MONTH_NAMES: Record<string, number> = {
  January: 1, February: 2, March: 3, April: 4,
  May: 5, June: 6, July: 7, August: 8,
  September: 9, October: 10, November: 11, December: 12,
};

function daysInMonth(year: number, month: number): number {
  // month is 1-based; Date(year, month, 0) gives last day of that month
  return new Date(year, month, 0).getDate();
}

// ─────────────────────────────────────────────────────────────────
// Period parsing
// ─────────────────────────────────────────────────────────────────

export interface ParsedPeriod {
  label: string;      // original column header, used as stable key
  units: number;
  days: number;       // actual calendar days represented
  isPartial: boolean; // true for "1-7 July 2026" style partial periods
  year: number;
  month: number;      // 1-12
  startDay: number;   // 1 for full months; actual start day for partials
  sortKey: number;    // YYYYMMDD integer for chronological ordering
}

/** Parse a single period label. Returns null for unrecognised formats. */
export function parsePeriodLabel(label: string): Omit<ParsedPeriod, 'units'> | null {
  const trimmed = label.trim();

  // Full month: "June 2026", "December 2025"
  const fullMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (fullMatch) {
    const month = MONTH_NAMES[fullMatch[1]];
    if (!month) return null;
    const year = parseInt(fullMatch[2], 10);
    return {
      label: trimmed,
      days: daysInMonth(year, month),
      isPartial: false,
      year,
      month,
      startDay: 1,
      sortKey: year * 10000 + month * 100 + 1,
    };
  }

  // Partial period: "1-7 July 2026" or "1–7 July 2026" (en-dash variant)
  const partialMatch = trimmed.match(/^(\d+)[-–](\d+)\s+([A-Za-z]+)\s+(\d{4})$/);
  if (partialMatch) {
    const startDay = parseInt(partialMatch[1], 10);
    const endDay = parseInt(partialMatch[2], 10);
    const month = MONTH_NAMES[partialMatch[3]];
    if (!month || endDay < startDay) return null;
    const year = parseInt(partialMatch[4], 10);
    return {
      label: trimmed,
      days: endDay - startDay + 1,
      isPartial: true,
      year,
      month,
      startDay,
      sortKey: year * 10000 + month * 100 + startDay,
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// CSV parsing
// ─────────────────────────────────────────────────────────────────

/** Minimal RFC-4180 CSV parser that handles quoted fields and embedded commas. */
function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim() === '') continue;
    const cols: string[] = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuote = !inQuote; }
      } else if (ch === ',' && !inQuote) {
        cols.push(current); current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current);
    rows.push(cols);
  }
  return rows;
}

function parseUnits(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '-') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export interface ParseResult {
  periods: ParsedPeriod[];
  error?: string;
}

/**
 * Parse a Sellerboard Profit & Loss CSV export.
 * Locates the "Parameter/Date" header row and the top-level "Units" row.
 * Returns all detected periods except "Total".
 */
export function parseSellerboardCSV(csvText: string): ParseResult {
  const rows = parseCSVRows(csvText);
  if (rows.length === 0) {
    return { periods: [], error: 'The file is empty.' };
  }

  const headerIdx = rows.findIndex((r) => r[0]?.trim() === 'Parameter/Date');
  if (headerIdx === -1) {
    return {
      periods: [],
      error:
        'Could not find a "Parameter/Date" header column. ' +
        'Make sure you are uploading a Sellerboard Profit & Loss export.',
    };
  }

  // The Units row must appear after the header. We look for the *first* row
  // where the trimmed first column is exactly "Units" (not "Direct units" etc.)
  const unitsIdx = rows.findIndex(
    (r, i) => i > headerIdx && r[0]?.trim() === 'Units',
  );
  if (unitsIdx === -1) {
    return {
      periods: [],
      error:
        'Could not find a top-level "Units" row. ' +
        'Make sure the CSV contains a row labelled exactly "Units" ' +
        '(not "Organic", "Direct units", or "Sponsored Products").',
    };
  }

  const headerRow = rows[headerIdx];
  const unitsRow = rows[unitsIdx];
  const periods: ParsedPeriod[] = [];

  for (let col = 1; col < headerRow.length; col++) {
    const colLabel = headerRow[col]?.trim() ?? '';
    if (!colLabel || colLabel.toLowerCase() === 'total') continue;

    const parsed = parsePeriodLabel(colLabel);
    if (!parsed) continue;

    const units = parseUnits(unitsRow[col] ?? '');
    if (units === null) continue; // blank or invalid cell — skip silently

    periods.push({ ...parsed, units });
  }

  if (periods.length === 0) {
    return {
      periods: [],
      error:
        'No valid date periods were found. ' +
        'Check that the CSV contains columns labelled "Month YYYY" or "D1-D2 Month YYYY".',
    };
  }

  return { periods };
}

// ─────────────────────────────────────────────────────────────────
// Default period selection
// ─────────────────────────────────────────────────────────────────

/**
 * Default selection: the latest 12 complete (non-partial) months.
 * Returns a Set of period labels that should be selected by default.
 * Partial-period rows are excluded from the default.
 */
export function defaultSelectedLabels(periods: ParsedPeriod[]): Set<string> {
  const complete = periods
    .filter((p) => !p.isPartial)
    .sort((a, b) => b.sortKey - a.sortKey)
    .slice(0, 12);
  return new Set(complete.map((p) => p.label));
}

// ─────────────────────────────────────────────────────────────────
// Forecast calculation
// ─────────────────────────────────────────────────────────────────

export interface ForecastInputs {
  selectedUnits: number;
  selectedDays: number;
  leadTimeDays: number;
  cushionPct: number;
  fbaDeducted: number;
  threePlDeducted: number;
  inboundDeducted: number;
}

export interface ForecastResult {
  avgDailySales: number;
  leadTimeDemand: number;
  safetyStock: number;
  grossRequirement: number;
  eligibleInventory: number;
  recommendedOrderQuantity: number;
}

/**
 * Compute historic-based forecast.
 *
 * avgDailySales   = selectedUnits / selectedDays
 * leadTimeDemand  = avgDailySales × leadTimeDays
 * safetyStock     = leadTimeDemand × (cushionPct / 100)
 * grossRequirement = leadTimeDemand + safetyStock
 * eligibleInventory = fbaDeducted + threePlDeducted + inboundDeducted
 * recommendedOrderQuantity = max(0, ceil(grossRequirement − eligibleInventory))
 *
 * avgDailySales is NOT rounded before use in subsequent steps.
 * Only the final recommendedOrderQuantity is rounded (ceil).
 */
export function computeForecast(inputs: ForecastInputs): ForecastResult {
  const avgDailySales = inputs.selectedUnits / inputs.selectedDays;
  const leadTimeDemand = avgDailySales * inputs.leadTimeDays;
  const safetyStock = leadTimeDemand * (inputs.cushionPct / 100);
  const grossRequirement = leadTimeDemand + safetyStock;
  const eligibleInventory =
    inputs.fbaDeducted + inputs.threePlDeducted + inputs.inboundDeducted;
  const recommendedOrderQuantity = Math.max(
    0,
    Math.ceil(grossRequirement - eligibleInventory),
  );
  return {
    avgDailySales,
    leadTimeDemand,
    safetyStock,
    grossRequirement,
    eligibleInventory,
    recommendedOrderQuantity,
  };
}

// ─────────────────────────────────────────────────────────────────
// Export CSV builder
// ─────────────────────────────────────────────────────────────────

export interface ExportRow {
  client: string;
  sku: string;
  productName: string;
  marketplace: string;
  calculationDate: string;
  selectedPeriods: string;
  historicalUnits: number;
  historicalDays: number;
  avgDailySales: number;
  leadTimeDays: number;
  cushionPct: number;
  grossRequirement: number;
  fbaDeducted: number;
  threePlDeducted: number;
  inboundDeducted: number;
  recommendedOrderQuantity: number;
}

function csvEscape(val: string | number): string {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildExportCSV(row: ExportRow): string {
  const headers = [
    'Client', 'SKU', 'Product Name', 'Marketplace', 'Calculation Date',
    'Selected Periods', 'Historical Units', 'Historical Days',
    'Avg Daily Sales', 'Lead Time Days', 'Cushion %',
    'Gross Requirement', 'FBA Deducted', '3PL Deducted', 'Inbound Deducted',
    'Recommended Order Quantity',
  ];
  const values = [
    row.client, row.sku, row.productName, row.marketplace, row.calculationDate,
    row.selectedPeriods, row.historicalUnits, row.historicalDays,
    row.avgDailySales.toFixed(4), row.leadTimeDays, row.cushionPct,
    row.grossRequirement.toFixed(4), row.fbaDeducted, row.threePlDeducted,
    row.inboundDeducted, row.recommendedOrderQuantity,
  ];
  return (
    headers.map(csvEscape).join(',') + '\n' +
    values.map(csvEscape).join(',') + '\n'
  );
}

"use client";

import { useState, useRef, useMemo } from "react";
import type { InventoryRow } from "@/lib/mock-data";
import {
  parseSellerboardCSV,
  defaultSelectedLabels,
  computeForecast,
  buildExportCSV,
  type ParsedPeriod,
  type ForecastResult,
} from "@/lib/historic-forecast";

// ─────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────

interface Props {
  inventory: InventoryRow[];
  clientSlug: string;
  clientName: string;
  defaultLeadTimeDays: number;
}

// ─────────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────────

function Section({
  step,
  title,
  icon,
  locked,
  children,
}: {
  step: number;
  title: string;
  icon: string;
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`glass-panel p-6 transition-opacity duration-200 ${locked ? "opacity-40 pointer-events-none select-none" : ""}`}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-7 h-7 rounded-full bg-secondary-container/20 border border-secondary-container/30 flex items-center justify-center flex-shrink-0">
          <span className="font-label-sm text-label-sm text-secondary-container">
            {step}
          </span>
        </div>
        <span className="material-symbols-outlined text-[20px] text-secondary-container">
          {icon}
        </span>
        <h3 className="font-headline-md text-headline-md text-on-surface">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Mini bar chart — CSS vertical bars, no external library
// ─────────────────────────────────────────────────────────────────

function PeriodChart({
  periods,
  selectedLabels,
}: {
  periods: ParsedPeriod[];
  selectedLabels: Set<string>;
}) {
  const sorted = [...periods].sort((a, b) => a.sortKey - b.sortKey);
  const maxUnits = Math.max(...sorted.map((p) => p.units), 1);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-1 min-w-0" style={{ height: 120 }}>
        {sorted.map((p) => {
          const pct = (p.units / maxUnits) * 100;
          const selected = selectedLabels.has(p.label);
          return (
            <div
              key={p.label}
              className="flex-1 min-w-[18px] flex flex-col items-center gap-0.5 group"
              title={`${p.label}: ${p.units.toLocaleString()} units${p.isPartial ? " (partial)" : ""}`}
            >
              <div className="w-full flex items-end" style={{ height: 96 }}>
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    selected
                      ? p.isPartial
                        ? "bg-secondary-container/40"
                        : "bg-secondary-container/70"
                      : "bg-white/[0.08]"
                  }`}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span
                className={`font-label-sm text-[9px] leading-tight truncate max-w-full text-center ${
                  selected ? "text-on-surface-variant/70" : "text-outline/50"
                }`}
              >
                {p.month}/{String(p.year).slice(2)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-secondary-container/70" />
          <span className="font-label-sm text-label-sm text-on-surface-variant/70">
            Selected
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-secondary-container/40" />
          <span className="font-label-sm text-label-sm text-on-surface-variant/70">
            Partial (selected)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-white/[0.08]" />
          <span className="font-label-sm text-label-sm text-on-surface-variant/70">
            Excluded
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Result display
// ─────────────────────────────────────────────────────────────────

function ResultDisplay({
  result,
  row,
  selectedPeriods,
  leadTimeDays,
  cushionPct,
  deductFba,
  deductThreePl,
  deductInbound,
  inboundEligible,
  horizonDate,
}: {
  result: ForecastResult;
  row: InventoryRow;
  selectedPeriods: ParsedPeriod[];
  leadTimeDays: number;
  cushionPct: number;
  deductFba: boolean;
  deductThreePl: boolean;
  deductInbound: boolean;
  inboundEligible: boolean;
  horizonDate: Date;
}) {
  const selectedUnits = selectedPeriods.reduce((s, p) => s + p.units, 0);
  const selectedDays = selectedPeriods.reduce((s, p) => s + p.days, 0);

  const oldestPeriod = [...selectedPeriods].sort((a, b) => a.sortKey - b.sortKey)[0];
  const newestPeriod = [...selectedPeriods].sort((a, b) => b.sortKey - a.sortKey)[0];
  const periodRange =
    oldestPeriod && newestPeriod
      ? `${oldestPeriod.label} – ${newestPeriod.label}`
      : "—";

  const n = (v: number, dp = 0) =>
    v.toLocaleString("en-US", {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    });

  const fbaDeducted = deductFba ? row.fbaAvailable : 0;
  const threePlDeducted = deductThreePl ? row.threePlInventory : 0;
  const inboundDeducted = deductInbound && inboundEligible ? row.inboundUnits : 0;

  return (
    <div className="space-y-6">
      {/* Primary result callout */}
      <div className="relative overflow-hidden rounded-2xl border border-secondary-container/30 bg-gradient-to-br from-[#003851]/60 to-[#001e2c]/80 p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-container/5 to-transparent pointer-events-none" />
        <p className="font-label-sm text-label-sm text-secondary-container uppercase tracking-wider mb-1">
          Recommended Order Quantity
        </p>
        <p className="font-display-lg text-display-lg text-on-surface tabular-nums">
          {result.recommendedOrderQuantity.toLocaleString()}
          <span className="font-body-lg text-body-lg text-on-surface-variant ml-2">
            units
          </span>
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant/70 mt-2">
          Projected lead-time horizon:{" "}
          <span className="text-on-surface-variant font-medium">
            {horizonDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </p>
      </div>

      {/* Transparent equation */}
      <div className="glass-panel p-5 space-y-1 font-mono text-sm">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">
          Calculation breakdown
        </p>
        <div className="flex items-baseline gap-3">
          <span className="w-6 text-right text-on-surface-variant/50"> </span>
          <span className="tabular-nums text-on-surface">
            {n(result.leadTimeDemand, 3)}
          </span>
          <span className="text-on-surface-variant/70">lead-time demand</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="w-6 text-right text-secondary-container">+</span>
          <span className="tabular-nums text-on-surface">
            {n(result.safetyStock, 3)}
          </span>
          <span className="text-on-surface-variant/70">
            safety stock ({cushionPct}%)
          </span>
        </div>
        {result.eligibleInventory > 0 && (
          <div className="flex items-baseline gap-3">
            <span className="w-6 text-right text-error/80">−</span>
            <span className="tabular-nums text-on-surface">
              {n(result.eligibleInventory)}
            </span>
            <span className="text-on-surface-variant/70">eligible inventory</span>
          </div>
        )}
        <div className="border-t border-white/[0.08] pt-2 mt-2 flex items-baseline gap-3">
          <span className="w-6 text-right text-on-surface-variant/50">=</span>
          <span className="tabular-nums text-on-surface">
            {n(result.grossRequirement - result.eligibleInventory, 2)}
          </span>
          <span className="text-on-surface-variant/70">exact</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="w-6 text-right text-on-surface-variant/50">↑</span>
          <span className="tabular-nums text-secondary-container font-semibold">
            {result.recommendedOrderQuantity.toLocaleString()}
          </span>
          <span className="text-on-surface-variant/70">
            rounded up (ceil)
          </span>
        </div>
      </div>

      {/* Full summary table */}
      <div className="data-card p-5">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-4">
          Full summary
        </p>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {[
            ["SKU", row.sku],
            ["Product", row.productName],
            ["Marketplace", row.marketplace],
            ["Historical period", periodRange],
            ["Historical units", n(selectedUnits)],
            ["Historical days", n(selectedDays)],
            ["Avg daily sales", result.avgDailySales.toFixed(4)],
            ["Lead time", `${leadTimeDays} days`],
            ["Lead-time demand", n(result.leadTimeDemand, 2)],
            ["Safety cushion", `${cushionPct}%`],
            ["Safety stock", n(result.safetyStock, 2)],
            ["Gross requirement", n(result.grossRequirement, 2)],
            ["FBA deducted", n(fbaDeducted)],
            ["3PL deducted", n(threePlDeducted)],
            ["Inbound deducted", n(inboundDeducted)],
            ["Total eligible inventory", n(result.eligibleInventory)],
            ["Recommended order quantity", n(result.recommendedOrderQuantity)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-white/[0.05] pb-2">
              <dt className="font-label-sm text-label-sm text-on-surface-variant">
                {label}
              </dt>
              <dd className="font-label-sm text-label-sm text-on-surface tabular-nums text-right">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main client component
// ─────────────────────────────────────────────────────────────────

export default function HistoricForecastClient({
  inventory,
  clientSlug,
  clientName,
  defaultLeadTimeDays,
}: Props) {
  // ── Step 1: SKU selection ──────────────────────────────────────
  const [skuSearch, setSkuSearch] = useState("");
  const [skuDropdownOpen, setSkuDropdownOpen] = useState(false);
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
  const skuInputRef = useRef<HTMLInputElement>(null);

  const selectedRow = useMemo(
    () => inventory.find((r) => r.id === selectedSkuId) ?? null,
    [inventory, selectedSkuId],
  );

  const filteredSkus = useMemo(() => {
    const q = skuSearch.toLowerCase().trim();
    if (!q) return inventory.slice(0, 40);
    return inventory
      .filter(
        (r) =>
          r.sku.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [inventory, skuSearch]);

  function selectSku(row: InventoryRow) {
    setSelectedSkuId(row.id);
    setSkuSearch(row.sku);
    setSkuDropdownOpen(false);
    // Pre-fill lead time from this SKU
    setLeadTimeDays(row.leadTimeDays > 0 ? row.leadTimeDays : defaultLeadTimeDays);
  }

  // ── Step 2: CSV upload ────────────────────────────────────────
  const [dragging, setDragging] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<ParsedPeriod[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Declared here so processFile below can reference it without lint errors
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());

  function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvError("Please upload a CSV file (.csv).");
      setPeriods([]);
      setFileName(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseSellerboardCSV(text);
      if (result.error) {
        setCsvError(result.error);
        setPeriods([]);
        setFileName(null);
      } else {
        setCsvError(null);
        setPeriods(result.periods);
        setFileName(file.name);
        setSelectedLabels(defaultSelectedLabels(result.periods));
      }
    };
    reader.onerror = () => {
      setCsvError("Could not read the file. Please try again.");
      setPeriods([]);
    };
    reader.readAsText(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  // ── Step 3: Period selection ──────────────────────────────────

  function togglePeriod(label: string) {
    setSelectedLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  const selectedPeriods = useMemo(
    () => periods.filter((p) => selectedLabels.has(p.label)),
    [periods, selectedLabels],
  );

  const sortedPeriodsForDisplay = useMemo(
    () => [...periods].sort((a, b) => b.sortKey - a.sortKey),
    [periods],
  );

  const selectedUnits = selectedPeriods.reduce((s, p) => s + p.units, 0);
  const selectedDays = selectedPeriods.reduce((s, p) => s + p.days, 0);
  const fewerThan90Days = selectedDays > 0 && selectedDays < 90;

  // ── Step 4: Forecast settings ─────────────────────────────────
  const [leadTimeDays, setLeadTimeDays] = useState(defaultLeadTimeDays);
  const [cushionPct, setCushionPct] = useState(15);

  const leadTimeValid =
    Number.isFinite(leadTimeDays) && leadTimeDays > 0 && leadTimeDays <= 365;
  const cushionValid =
    Number.isFinite(cushionPct) && cushionPct >= 0 && cushionPct <= 200;

  // ── Step 5: Inventory deduction ───────────────────────────────
  const [deductFba, setDeductFba] = useState(true);
  const [deductThreePl, setDeductThreePl] = useState(true);
  const [deductInbound, setDeductInbound] = useState(true);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const horizonDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + (leadTimeValid ? leadTimeDays : 0));
    return d;
  }, [today, leadTimeDays, leadTimeValid]);

  // The sheet has no inbound ETA column; eligibility is user-controlled via checkbox.
  // inboundEligible is always true — the note in Step 5 explains this to the user.
  const inboundEligible = true;
  const showNoEtaWarning = selectedRow !== null && selectedRow.inboundUnits > 0;

  const fbaDeducted = deductFba ? (selectedRow?.fbaAvailable ?? 0) : 0;
  const threePlDeducted = deductThreePl ? (selectedRow?.threePlInventory ?? 0) : 0;
  const inboundDeducted =
    deductInbound && inboundEligible ? (selectedRow?.inboundUnits ?? 0) : 0;

  // ── Result computation ────────────────────────────────────────
  const canCompute =
    selectedRow !== null &&
    selectedPeriods.length > 0 &&
    selectedDays > 0 &&
    leadTimeValid &&
    cushionValid;

  const result = useMemo<ForecastResult | null>(() => {
    if (!canCompute) return null;
    return computeForecast({
      selectedUnits,
      selectedDays,
      leadTimeDays,
      cushionPct,
      fbaDeducted,
      threePlDeducted,
      inboundDeducted,
    });
  }, [
    canCompute,
    selectedUnits,
    selectedDays,
    leadTimeDays,
    cushionPct,
    fbaDeducted,
    threePlDeducted,
    inboundDeducted,
  ]);

  // ── CSV Export ────────────────────────────────────────────────
  function handleExport() {
    if (!result || !selectedRow) return;
    const oldestPeriod = [...selectedPeriods].sort((a, b) => a.sortKey - b.sortKey)[0];
    const newestPeriod = [...selectedPeriods].sort((a, b) => b.sortKey - a.sortKey)[0];
    const csv = buildExportCSV({
      client: clientName,
      sku: selectedRow.sku,
      productName: selectedRow.productName,
      marketplace: selectedRow.marketplace,
      calculationDate: new Date().toISOString().split("T")[0],
      selectedPeriods:
        oldestPeriod && newestPeriod
          ? `${oldestPeriod.label} – ${newestPeriod.label}`
          : "",
      historicalUnits: selectedUnits,
      historicalDays: selectedDays,
      avgDailySales: result.avgDailySales,
      leadTimeDays,
      cushionPct,
      grossRequirement: result.grossRequirement,
      fbaDeducted,
      threePlDeducted,
      inboundDeducted,
      recommendedOrderQuantity: result.recommendedOrderQuantity,
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forecast-${selectedRow.sku}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Step 1: Select SKU ── */}
      <Section step={1} title="Select SKU" icon="inventory_2">
        {inventory.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant">
            No SKUs found. The Google Sheet may be empty or unavailable.
          </p>
        ) : (
          <div className="relative max-w-xl">
            <div
              className="flex items-center gap-2 px-3 py-2.5 bg-[#1d1d1d]/80 border border-white/[0.09] rounded-xl focus-within:border-secondary-container/40 focus-within:ring-2 focus-within:ring-secondary-container/10 transition-all cursor-text"
              onClick={() => { setSkuDropdownOpen(true); skuInputRef.current?.focus(); }}
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant flex-shrink-0">
                search
              </span>
              <input
                ref={skuInputRef}
                type="text"
                placeholder="Search SKU or product name…"
                value={skuSearch}
                onChange={(e) => {
                  setSkuSearch(e.target.value);
                  setSkuDropdownOpen(true);
                  if (selectedSkuId) { setSelectedSkuId(null); }
                }}
                onFocus={() => setSkuDropdownOpen(true)}
                onBlur={() => setTimeout(() => setSkuDropdownOpen(false), 150)}
                className="flex-1 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant outline-none min-w-0"
              />
              {selectedSkuId && (
                <span className="material-symbols-outlined text-[18px] text-secondary-container flex-shrink-0">
                  check_circle
                </span>
              )}
            </div>

            {skuDropdownOpen && filteredSkus.length > 0 && (
              <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1d1d1d] border border-white/[0.09] rounded-xl shadow-xl overflow-hidden max-h-[280px] overflow-y-auto">
                {filteredSkus.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-white/[0.06] transition-colors"
                      onMouseDown={() => selectSku(row)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-label-md text-label-md text-on-surface truncate">
                          {row.sku}
                        </p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                          {row.productName}
                        </p>
                      </div>
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full font-label-sm text-[11px] text-on-surface-variant bg-white/[0.06] border border-white/[0.08]">
                        {row.marketplace}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {selectedRow && (
          <div className="mt-4 flex flex-wrap gap-4">
            {[
              ["FBA Available", selectedRow.fbaAvailable.toLocaleString()],
              ["3PL Stock", selectedRow.threePlInventory.toLocaleString()],
              ["Inbound Units", selectedRow.inboundUnits.toLocaleString()],
              ["Lead Time", `${selectedRow.leadTimeDays}d`],
              ["Marketplace", selectedRow.marketplace],
            ].map(([label, value]) => (
              <div key={label} className="bg-[#1d1d1d]/60 border border-white/[0.07] rounded-lg px-3 py-2">
                <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
                <p className="font-label-md text-label-md text-on-surface tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Step 2: Upload CSV ── */}
      <Section step={2} title="Upload Sellerboard CSV" icon="upload_file" locked={!selectedRow}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all ${
            dragging
              ? "border-secondary-container/60 bg-secondary-container/10"
              : "border-white/[0.12] hover:border-white/[0.20] hover:bg-white/[0.02]"
          }`}
        >
          <span className="material-symbols-outlined text-[40px] text-secondary-container/60">
            upload_file
          </span>
          {fileName ? (
            <>
              <p className="font-label-md text-label-md text-secondary-container">
                {fileName}
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {periods.length} period{periods.length !== 1 ? "s" : ""} detected
                · Click or drag to replace
              </p>
            </>
          ) : (
            <>
              <p className="font-body-md text-body-md text-on-surface">
                Drag &amp; drop or click to upload
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant text-center">
                Sellerboard Profit &amp; Loss export (.csv)
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {csvError && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-error/10 border border-error/30">
            <span className="material-symbols-outlined text-[18px] text-error flex-shrink-0 mt-0.5">
              error
            </span>
            <p className="font-body-sm text-body-sm text-error">{csvError}</p>
          </div>
        )}

        <p className="mt-3 font-label-sm text-label-sm text-on-surface-variant/60">
          The CSV is processed entirely in your browser and never sent to any
          server.
        </p>
      </Section>

      {/* ── Step 3: Select historical periods ── */}
      <Section
        step={3}
        title="Select Historical Periods"
        icon="date_range"
        locked={periods.length === 0}
      >
        {periods.length > 0 && (
          <>
            <div className="mb-4">
              <PeriodChart periods={periods} selectedLabels={selectedLabels} />
            </div>

            {fewerThan90Days && (
              <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-[#3d2200]/60 border border-[#fbbf24]/30">
                <span className="material-symbols-outlined text-[18px] text-[#fbbf24] flex-shrink-0 mt-0.5">
                  warning
                </span>
                <p className="font-body-sm text-body-sm text-[#fbbf24]/90">
                  Forecast reliability may be limited because fewer than 90 days
                  of historical sales are included ({selectedDays} days selected).
                </p>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-[#1d1d1d]/40">
                    <th className="px-4 py-2.5 text-left font-label-sm text-label-sm text-on-surface-variant">
                      Period
                    </th>
                    <th className="px-4 py-2.5 text-right font-label-sm text-label-sm text-on-surface-variant">
                      Units
                    </th>
                    <th className="px-4 py-2.5 text-right font-label-sm text-label-sm text-on-surface-variant">
                      Days
                    </th>
                    <th className="px-4 py-2.5 text-center font-label-sm text-label-sm text-on-surface-variant">
                      Include
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {sortedPeriodsForDisplay.map((p) => {
                    const sel = selectedLabels.has(p.label);
                    return (
                      <tr
                        key={p.label}
                        className={`transition-colors cursor-pointer ${sel ? "" : "opacity-50"} hover:bg-white/[0.03]`}
                        onClick={() => togglePeriod(p.label)}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-label-md text-label-md text-on-surface">
                              {p.label}
                            </span>
                            {p.isPartial && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#3d1500]/60 text-[#fbbf24] font-label-sm text-[10px] border border-[#fbbf24]/20">
                                partial
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-label-md text-label-md text-on-surface tabular-nums">
                          {p.units.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right font-label-md text-label-md text-on-surface-variant tabular-nums">
                          {p.days}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={sel}
                            onChange={() => togglePeriod(p.label)}
                            onClick={(e) => e.stopPropagation()}
                            className="accent-secondary-container w-4 h-4 cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center gap-6">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Selected units
                </p>
                <p className="font-numeric-data text-numeric-data text-on-surface tabular-nums">
                  {selectedUnits.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Selected days
                </p>
                <p className="font-numeric-data text-numeric-data text-on-surface tabular-nums">
                  {selectedDays.toLocaleString()}
                </p>
              </div>
              {selectedDays > 0 && (
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Avg daily sales
                  </p>
                  <p className="font-numeric-data text-numeric-data text-secondary-container tabular-nums">
                    {(selectedUnits / selectedDays).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </Section>

      {/* ── Step 4: Forecast settings ── */}
      <Section
        step={4}
        title="Forecast Settings"
        icon="tune"
        locked={selectedPeriods.length === 0}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1.5">
              Lead Time Days
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(parseInt(e.target.value, 10) || 0)}
              className={`w-full px-3 py-2.5 bg-[#1d1d1d]/80 border rounded-xl font-body-md text-body-md text-on-surface outline-none focus:ring-2 transition-all ${
                leadTimeValid
                  ? "border-white/[0.09] focus:border-secondary-container/40 focus:ring-secondary-container/10"
                  : "border-error/50 focus:ring-error/20"
              }`}
            />
            {!leadTimeValid && (
              <p className="font-label-sm text-label-sm text-error mt-1">
                Must be between 1 and 365.
              </p>
            )}
            {leadTimeDays !== (selectedRow?.leadTimeDays ?? defaultLeadTimeDays) && (
              <p className="font-label-sm text-label-sm text-on-surface-variant/60 mt-1">
                SKU default:{" "}
                {selectedRow?.leadTimeDays ?? defaultLeadTimeDays}d
              </p>
            )}
          </div>

          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1.5">
              Safety Cushion (%)
            </label>
            <input
              type="number"
              min={0}
              max={200}
              value={cushionPct}
              onChange={(e) => setCushionPct(parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2.5 bg-[#1d1d1d]/80 border rounded-xl font-body-md text-body-md text-on-surface outline-none focus:ring-2 transition-all ${
                cushionValid
                  ? "border-white/[0.09] focus:border-secondary-container/40 focus:ring-secondary-container/10"
                  : "border-error/50 focus:ring-error/20"
              }`}
            />
            {!cushionValid && (
              <p className="font-label-sm text-label-sm text-error mt-1">
                Must be between 0 and 200%.
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* ── Step 5: Inventory deduction ── */}
      <Section
        step={5}
        title="Inventory to Deduct"
        icon="remove_shopping_cart"
        locked={!leadTimeValid || !cushionValid || selectedPeriods.length === 0}
      >
        {selectedRow && (
          <>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
              Lead-time horizon:{" "}
              <span className="text-on-surface font-medium">
                {horizonDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>{" "}
              (today + {leadTimeDays} days)
            </p>

            <div className="space-y-3 max-w-md">
              {[
                {
                  label: "Deduct FBA Available",
                  checked: deductFba,
                  onChange: setDeductFba,
                  value: selectedRow.fbaAvailable,
                  suffix: "FBA units",
                },
                {
                  label: "Deduct 3PL Inventory",
                  checked: deductThreePl,
                  onChange: setDeductThreePl,
                  value: selectedRow.threePlInventory,
                  suffix: "3PL units",
                },
                {
                  label: "Deduct Inbound Units",
                  checked: deductInbound,
                  onChange: setDeductInbound,
                  value: selectedRow.inboundUnits,
                  suffix: "inbound units",
                },
              ].map(({ label, checked, onChange, value, suffix }) => (
                <label
                  key={label}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl border border-white/[0.07] bg-[#1d1d1d]/40 cursor-pointer hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onChange(e.target.checked)}
                      className="accent-secondary-container w-4 h-4 flex-shrink-0"
                    />
                    <span className="font-label-md text-label-md text-on-surface">
                      {label}
                    </span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant tabular-nums">
                    {value.toLocaleString()} {suffix}
                  </span>
                </label>
              ))}
            </div>

            {showNoEtaWarning && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-[#1d1d1d]/60 border border-white/[0.07]">
                <span className="material-symbols-outlined text-[16px] text-outline mt-0.5 flex-shrink-0">
                  info
                </span>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Inbound ETA is not available in the Google Sheet. Inbound
                  eligibility is determined by your checkbox selection above
                  rather than automatic lead-time horizon comparison.
                </p>
              </div>
            )}
          </>
        )}
      </Section>

      {/* ── Results ── */}
      {result && selectedRow && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Forecast Result
            </h3>
            <button
              type="button"
              onClick={handleExport}
              className="btn-ghost-glass flex items-center gap-2 px-4 py-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>
              Download Calculation
            </button>
          </div>

          <ResultDisplay
            result={result}
            row={selectedRow}
            selectedPeriods={selectedPeriods}
            leadTimeDays={leadTimeDays}
            cushionPct={cushionPct}
            deductFba={deductFba}
            deductThreePl={deductThreePl}
            deductInbound={deductInbound}
            inboundEligible={inboundEligible}
            horizonDate={horizonDate}
          />
        </div>
      )}

      {/* ── Not ready callout (when all steps filled but validation missing) ── */}
      {!canCompute && selectedRow && periods.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.07] bg-[#1d1d1d]/40">
          <span className="material-symbols-outlined text-[20px] text-outline">
            pending
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {selectedPeriods.length === 0
              ? "Select at least one historical period to compute the forecast."
              : !leadTimeValid
                ? "Enter a valid lead time (1–365 days) to compute the forecast."
                : "Fix the settings above to compute the forecast."}
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-outline-variant">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Powered by BrandQure © 2026
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant/50">
            Historic Forecast · {clientName} · {clientSlug}
          </p>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import type { InventoryRow, MarketplaceFilter } from "@/lib/mock-data";
import { InventoryStatusBadge } from "@/components/ui/StatusBadge";
import { stockoutInDays, getReorderStatus } from "@/lib/reorder";
import { getMarketplaceLabel, rowMatchesMarketplace } from "@/lib/marketplace-utils";

interface InventoryTableProps {
  rows: InventoryRow[];
  activeMarketplace: MarketplaceFilter;
  onAddUnits: (row: InventoryRow) => void;
  onUpdate3PL: (row: InventoryRow) => void;
}

type SortOption = "oos-asc" | "fba-desc" | "fba-asc" | "sku-az";
type StatusFilter = "All" | "Reorder Now" | "Reorder Soon" | "OK" | "Sufficient Stock";

/** Display-safe OOS days — caps at 90, treats Infinity as 90+. */
function DaysUntilOOS({ row }: { row: InventoryRow }) {
  const days = stockoutInDays(row);

  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-error/30 bg-error-container/60 font-label-sm text-label-sm text-error font-semibold backdrop-blur-sm">
        Out of Stock
      </span>
    );
  }
  if (!isFinite(days) || days > 90) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-outline-variant/30 bg-[#282828]/80 font-label-sm text-label-sm text-on-surface-variant backdrop-blur-sm">
        90+ Days
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="font-semibold text-sm text-error">
        {Math.floor(days)} days left
      </span>
    );
  }
  if (days < row.leadTimeDays) {
    return (
      <span className="font-semibold text-sm text-[#b45309]">
        {Math.floor(days)} days left
      </span>
    );
  }
  return (
    <span className="font-label-md text-label-md text-on-surface-variant">
      {Math.floor(days)} days left
    </span>
  );
}

export default function InventoryTable({
  rows,
  activeMarketplace,
  onAddUnits,
  onUpdate3PL,
}: InventoryTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortBy, setSortBy] = useState<SortOption>("sku-az");

  const processed = useMemo(() => {
    // 1. Marketplace filter (from parent prop) — normalized comparison so
    // casing/whitespace variants in the sheet never cause a false miss.
    let result = activeMarketplace === "All"
      ? rows
      : rows.filter((r) => rowMatchesMarketplace(r, activeMarketplace));

    // 2. Search filter
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.sku.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q)
      );
    }

    // 3. Status filter
    if (statusFilter !== "All") {
      result = result.filter((r) => {
        const rs = getReorderStatus(r);
        if (statusFilter === "Sufficient Stock") return rs === "Overstock";
        return rs === statusFilter;
      });
    }

    // 4. Sort
    const sorted = [...result];
    switch (sortBy) {
      case "oos-asc":
        // Infinity (90+) sorts last — correct natively in JS
        sorted.sort((a, b) => stockoutInDays(a) - stockoutInDays(b));
        break;
      case "fba-desc":
        sorted.sort((a, b) => b.fbaAvailable - a.fbaAvailable);
        break;
      case "fba-asc":
        sorted.sort((a, b) => a.fbaAvailable - b.fbaAvailable);
        break;
      case "sku-az":
        sorted.sort((a, b) => a.sku.localeCompare(b.sku));
        break;
    }
    return sorted;
  }, [rows, activeMarketplace, search, statusFilter, sortBy]);

  return (
    <div className="glass-panel lg:col-span-3 overflow-hidden flex flex-col" style={{ height: 520 }}>
      {/* Card header */}
      <div className="px-6 pt-5 pb-4 border-b border-white/[0.07] bg-[#1d1d1d]/40 backdrop-blur-sm flex-shrink-0">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-headline-md text-headline-md text-on-surface">
            SKU Health Monitor
          </h3>
          <span className="px-3 py-1 rounded-full bg-[#282828]/90 border border-white/[0.10] font-label-sm text-label-sm text-on-surface-variant shadow-sm">
            {processed.length} SKUs
          </span>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-[240px]">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[16px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search SKU or product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-[#1d1d1d]/80 border border-white/[0.10] rounded-lg text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary-container/50 focus:ring-1 focus:ring-secondary-container/20 transition-all backdrop-blur-sm"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="appearance-none pl-3 pr-7 py-1.5 text-[13px] bg-[#1d1d1d]/80 border border-white/[0.10] rounded-lg text-on-surface focus:outline-none focus:border-secondary-container/50 focus:ring-1 focus:ring-secondary-container/20 transition-all backdrop-blur-sm cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Reorder Now">Reorder Now</option>
              <option value="Reorder Soon">Reorder Soon</option>
              <option value="OK">OK</option>
              <option value="Sufficient Stock">Sufficient Stock</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[14px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-3 pr-7 py-1.5 text-[13px] bg-[#1d1d1d]/80 border border-white/[0.10] rounded-lg text-on-surface focus:outline-none focus:border-secondary-container/50 focus:ring-1 focus:ring-secondary-container/20 transition-all backdrop-blur-sm cursor-pointer"
            >
              <option value="oos-asc">Closest to OOS</option>
              <option value="fba-desc">Highest FBA Stock</option>
              <option value="fba-asc">Lowest FBA Stock</option>
              <option value="sku-az">SKU A–Z</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[14px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Clear filters */}
          {(search || statusFilter !== "All" || sortBy !== "sku-az") && (
            <button
              type="button"
              onClick={() => { setSearch(""); setStatusFilter("All"); setSortBy("sku-az"); }}
              className="px-2.5 py-1.5 text-[12px] text-on-surface-variant/70 hover:text-on-surface border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.10] rounded-lg backdrop-blur-sm transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Scrollable table */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[820px]">
          <thead className="bg-[#141414]/95 backdrop-blur-sm sticky top-0 z-10">
            <tr>
              {[
                "SKU / Product",
                "Marketplace",
                "FBA Stock",
                "3PL Stock",
                "Lead Time",
                "Days Until OOS",
                "Status",
                "Actions",
              ].map((col) => (
                <th
                  key={col}
                  className="px-5 py-3.5 font-label-sm text-label-sm text-on-surface-variant/85 uppercase tracking-widest border-b border-white/[0.07] whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-transparent">
            {processed.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-10 text-center font-label-md text-label-md text-on-surface-variant"
                >
                  No SKUs match your filters.
                </td>
              </tr>
            ) : (
              processed.map((row) => {
                const reorderStatus = getReorderStatus(row);
                const isUrgent = reorderStatus === "Reorder Now";
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-outline-variant/20 transition-colors hover:bg-white/[0.04] ${
                      isUrgent ? "bg-error/[0.07]" : ""
                    }`}
                  >
                    {/* SKU / Product */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-sm text-primary">
                        {row.sku}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 max-w-[160px] truncate">
                        {row.productName}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant/60 mt-0.5 font-mono text-[11px]">
                        {row.asin}
                      </p>
                    </td>

                    {/* Marketplace */}
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full border border-outline-variant/30 bg-[#282828]/80 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                        {getMarketplaceLabel(row.marketplace)}
                      </span>
                    </td>

                    {/* FBA Stock */}
                    <td className="px-5 py-4">
                      <p className={`font-numeric-data text-numeric-data ${row.fbaAvailable === 0 ? "text-error" : "text-on-surface"}`}>
                        {row.fbaAvailable.toLocaleString()}
                      </p>
                      {row.inboundUnits > 0 && (
                        <p className="font-label-sm text-label-sm text-secondary mt-0.5">
                          +{row.inboundUnits.toLocaleString()} inbound
                        </p>
                      )}
                      {row.reservedUnits > 0 && (
                        <p className="font-label-sm text-label-sm text-outline mt-0.5">
                          {row.reservedUnits.toLocaleString()} reserved
                        </p>
                      )}
                    </td>

                    {/* 3PL Stock */}
                    <td className="px-5 py-4">
                      <p className="font-numeric-data text-numeric-data text-on-surface">
                        {row.threePlInventory.toLocaleString()}
                      </p>
                      {row.threePlInventory > 0 && (
                        <p className="font-label-sm text-label-sm text-outline mt-0.5 max-w-[120px] truncate">
                          {row.threePlLocation.split("—")[0].trim()}
                        </p>
                      )}
                    </td>

                    {/* Lead Time */}
                    <td className="px-5 py-4">
                      <span className="font-label-md text-label-md text-on-surface-variant">
                        {row.leadTimeDays}d
                      </span>
                    </td>

                    {/* Days Until OOS */}
                    <td className="px-5 py-4">
                      <DaysUntilOOS row={row} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <InventoryStatusBadge status={row.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAddUnits(row)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide btn-primary-indigo whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            add_task
                          </span>
                          Add Units
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdate3PL(row)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide btn-primary-teal whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            sync_alt
                          </span>
                          Update 3PL
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

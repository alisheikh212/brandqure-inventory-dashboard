"use client";

import type { InventoryRow, MarketplaceFilter } from "@/lib/mock-data";
import { InventoryStatusBadge } from "@/components/ui/StatusBadge";
import { stockoutInDays, getReorderStatus } from "@/lib/reorder";

interface InventoryTableProps {
  rows: InventoryRow[];
  activeMarketplace: MarketplaceFilter;
  onAddUnits: (row: InventoryRow) => void;
  onUpdate3PL: (row: InventoryRow) => void;
}

function DaysUntilOOS({ row }: { row: InventoryRow }) {
  const days = stockoutInDays(row);

  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container font-label-sm text-label-sm text-error font-semibold">
        Out of Stock
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
  const filtered =
    activeMarketplace === "All"
      ? rows
      : rows.filter((r) => r.marketplace === activeMarketplace);

  return (
    <div className="bg-white rounded-2xl border border-outline-variant shadow-sm lg:col-span-3 overflow-hidden flex flex-col" style={{ height: 480 }}>
      {/* Card header */}
      <div className="px-7 py-5 border-b border-outline-variant/50 flex justify-between items-center bg-white">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">
            SKU Health Monitor
          </h3>
        </div>
        <span className="px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
          {filtered.length} SKUs
        </span>
      </div>

      {/* Scrollable table */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[820px]">
          <thead className="bg-surface-container-lowest sticky top-0 z-10">
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
                  className="px-5 py-3.5 font-label-sm text-label-sm text-outline uppercase tracking-widest border-b border-outline-variant/40 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-10 text-center font-label-md text-label-md text-on-surface-variant"
                >
                  No SKUs for this marketplace filter.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const reorderStatus = getReorderStatus(row);
                const isUrgent = reorderStatus === "Reorder Now";
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-outline-variant/30 transition-colors hover:bg-[#f8f9fc] ${
                      isUrgent ? "bg-[#fff8f8]" : ""
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
                      <p className="font-label-sm text-label-sm text-outline mt-0.5">
                        {row.asin}
                      </p>
                    </td>

                    {/* Marketplace */}
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full border border-outline-variant/60 bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                        {row.marketplace}
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

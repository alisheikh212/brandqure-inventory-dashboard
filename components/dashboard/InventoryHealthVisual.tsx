import type { InventoryRow } from "@/lib/mock-data";

interface InventoryHealthVisualProps {
  inventory: InventoryRow[];
}

const TOP_N = 8;

export default function InventoryHealthVisual({
  inventory,
}: InventoryHealthVisualProps) {
  // Top N SKUs by FBA Available, descending
  const top = [...inventory]
    .sort((a, b) => b.fbaAvailable - a.fbaAvailable)
    .slice(0, TOP_N);

  const maxFba = top[0]?.fbaAvailable ?? 1;
  const totalSKUs = inventory.length;

  return (
    <div className="data-card p-6 lg:col-span-2 flex flex-col h-[360px]">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface tracking-tight">
            FBA Stock by SKU
          </h3>
          <p className="font-label-sm text-label-sm text-on-surface-variant/70 mt-0.5">
            Top {Math.min(TOP_N, top.length)} of {totalSKUs} SKUs by FBA units
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full border border-white/50 bg-white/50 backdrop-blur-sm font-label-sm text-label-sm text-on-surface-variant shadow-sm">
          Live data
        </span>
      </div>

      {top.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-label-md text-label-md text-on-surface-variant/60">
            No inventory data available.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-end gap-2 overflow-hidden">
          {top.map((row) => {
            const pct = maxFba > 0 ? (row.fbaAvailable / maxFba) * 100 : 0;
            const isLow = row.fbaAvailable < 50;
            return (
              <div key={row.id} className="flex items-center gap-3 group">
                {/* SKU label */}
                <div className="w-[90px] flex-shrink-0 text-right">
                  <span
                    className="font-label-sm text-label-sm text-on-surface-variant/75 truncate block text-[11px] font-mono"
                    title={`${row.sku} — ${row.productName}`}
                  >
                    {row.sku}
                  </span>
                </div>

                {/* Bar */}
                <div className="flex-1 h-6 bg-white/30 border border-white/40 rounded-md overflow-hidden relative shadow-[inset_0_1px_3px_rgba(17,28,45,0.05)]">
                  <div
                    className={`h-full rounded-md transition-all duration-500 ${
                      isLow
                        ? "bg-gradient-to-r from-error/60 to-error/40"
                        : "bg-gradient-to-r from-secondary-container/70 to-secondary-container/45"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                  {/* Value label inside bar if wide enough, otherwise outside */}
                  {pct > 20 && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 font-label-sm text-label-sm text-on-surface/80 text-[11px] font-semibold tabular-nums">
                      {row.fbaAvailable.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Value label when bar is too narrow */}
                {pct <= 20 && (
                  <span className="w-[52px] flex-shrink-0 font-label-sm text-label-sm text-on-surface-variant/70 text-[11px] tabular-nums">
                    {row.fbaAvailable.toLocaleString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

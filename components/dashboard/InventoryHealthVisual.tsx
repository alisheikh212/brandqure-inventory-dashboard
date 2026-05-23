// CSS-only bar chart placeholder matching the Stitch design reference
const BARS = [
  { height: "33%", active: false },
  { height: "50%", active: false },
  { height: "40%", active: false },
  { height: "66%", active: false },
  { height: "60%", active: false },
  { height: "80%", active: false },
  { height: "100%", active: true },
];

const MONTHS = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

export default function InventoryHealthVisual() {
  return (
    <div className="data-card p-6 lg:col-span-2 flex flex-col h-[360px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          Inventory Health Trend
        </h3>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          Last 7 months
        </span>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Chart area */}
        <div className="flex-1 relative bg-white/40 border border-white/50 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary-fixed/20 to-transparent pointer-events-none" />
          {/* Y-axis lines */}
          {["100%", "75%", "50%", "25%"].map((pct) => (
            <div
              key={pct}
              className="absolute left-0 right-0 border-t border-outline-variant/30 flex items-start"
              style={{ top: `calc(100% - ${pct})`, height: 0 }}
            >
              <span className="font-label-sm text-label-sm text-on-surface-variant/40 pl-2 -mt-3 text-[10px]">
                {pct}
              </span>
            </div>
          ))}

          {/* Bars */}
          <div className="absolute inset-x-6 bottom-0 top-4 flex items-end justify-between gap-2">
            {BARS.map((bar, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end"
                style={{ height: "100%" }}
              >
                <div
                  className={`w-full rounded-t-sm transition-all ${
                    bar.active
                      ? "bg-secondary-container/30 border-t-2 border-secondary-container"
                      : "bg-surface-container-high"
                  }`}
                  style={{ height: bar.height }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 px-1">
          {MONTHS.map((m) => (
            <span
              key={m}
              className="font-label-sm text-label-sm text-on-surface-variant text-center flex-1 text-[11px]"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-headline-md text-headline-md text-on-surface tracking-tight">
          Inventory Health Trend
        </h3>
        <span className="px-2.5 py-1 rounded-full border border-white/50 bg-white/50 backdrop-blur-sm font-label-sm text-label-sm text-on-surface-variant shadow-sm">
          Last 7 months
        </span>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Chart area */}
        <div className="flex-1 relative bg-white/30 border border-white/45 rounded-xl overflow-hidden shadow-[inset_0_2px_8px_rgba(17,28,45,0.04)]">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary-fixed/15 to-transparent pointer-events-none" />
          {/* Y-axis lines */}
          {["100%", "75%", "50%", "25%"].map((pct) => (
            <div
              key={pct}
              className="absolute left-0 right-0 border-t border-outline-variant/20 flex items-start"
              style={{ top: `calc(100% - ${pct})`, height: 0 }}
            >
              <span className="font-label-sm text-label-sm text-on-surface-variant/55 pl-2 -mt-3 text-[10px]">
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
                  className={`w-full rounded-t-md transition-all ${
                    bar.active
                      ? "bg-secondary-container/55 border-t-2 border-secondary-container shadow-[0_-2px_8px_rgba(64,194,253,0.25)]"
                      : "bg-white/55 border border-white/60 border-b-0"
                  }`}
                  style={{ height: bar.height }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2.5 px-1">
          {MONTHS.map((m) => (
            <span
              key={m}
              className="font-label-sm text-label-sm text-on-surface-variant/70 text-center flex-1 text-[11px]"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

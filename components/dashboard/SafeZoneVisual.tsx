interface SafeZoneVisualProps {
  percentage?: number;
}

export default function SafeZoneVisual({
  percentage = 78,
}: SafeZoneVisualProps) {
  return (
    <div className="data-card p-6 flex flex-col h-[360px]">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-headline-md text-headline-md text-on-surface tracking-tight">
          Inventory Health Score
        </h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* CSS ring gauge */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full shadow-[0_0_24px_rgba(64,194,253,0.18),inset_0_2px_8px_rgba(17,28,45,0.06)]" />
          {/* Track ring */}
          <div className="absolute inset-0 rounded-full border-[10px] border-white/35" />
          {/* Active ring */}
          <div className="absolute inset-0 rounded-full border-[10px] border-secondary-container border-t-transparent border-r-transparent rotate-45 drop-shadow-sm" />
          <div className="text-center z-10">
            <p className="font-display-lg text-display-lg text-on-surface leading-none tabular-nums">
              {percentage}%
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant/80 mt-1.5">
              {percentage}% of SKUs in healthy range
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-7 w-full space-y-2.5">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-error/80" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-secondary-container" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Healthy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-on-surface-variant/30" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Surplus</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/40 border border-white/40 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-error via-secondary-container to-outline-variant/50"
              style={{ width: "100%" }}
            />
          </div>
          <div className="relative w-full h-3">
            <div
              className="absolute w-2 h-3 bg-on-surface/80 rounded-full -translate-x-1/2 shadow-sm"
              style={{ left: `${percentage}%` }}
            />
          </div>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant/60 text-center mt-4 leading-snug">
          Based on days of stock coverage across all active SKUs.
        </p>
      </div>
    </div>
  );
}

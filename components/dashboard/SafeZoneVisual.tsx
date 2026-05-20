interface SafeZoneVisualProps {
  percentage?: number;
}

export default function SafeZoneVisual({
  percentage = 78,
}: SafeZoneVisualProps) {
  return (
    <div className="data-card p-6 flex flex-col h-[360px]">
      <h3 className="font-headline-md text-headline-md text-on-surface mb-4">
        Global Safe Zone
      </h3>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* CSS ring gauge matching Stitch design */}
        <div className="relative w-44 h-44 rounded-full border-8 border-surface-container flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-8 border-secondary-container border-t-transparent border-r-transparent rotate-45" />
          <div className="text-center z-10">
            <p className="font-display-lg text-display-lg text-primary leading-none">
              {percentage}%
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
              Optimal Range
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 w-full space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-error" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Critical
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary-container" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Healthy
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-surface-container-high" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Surplus
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden mt-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-error via-secondary-container to-surface-container-high"
              style={{ width: "100%" }}
            />
          </div>
          <div className="relative w-full h-3">
            <div
              className="absolute w-1.5 h-3 bg-on-surface rounded-full -translate-x-1/2"
              style={{ left: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

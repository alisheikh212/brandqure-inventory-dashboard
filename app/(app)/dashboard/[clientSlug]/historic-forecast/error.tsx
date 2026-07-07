"use client";

export default function HistoricForecastError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 px-4 md:px-8 py-8 max-w-[1440px] mx-auto w-full">
      <div className="glass-panel p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[320px]">
        <span className="material-symbols-outlined text-[48px] text-error/70">
          error_outline
        </span>
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-1">
            Could not load inventory data
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            {error.message || "An unexpected error occurred while fetching inventory."}
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="btn-ghost-glass px-5 py-2"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

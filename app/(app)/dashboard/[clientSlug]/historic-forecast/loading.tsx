export default function HistoricForecastLoading() {
  return (
    <main className="flex-1 px-4 md:px-8 py-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8">
        <div className="h-4 w-48 bg-white/[0.06] rounded animate-pulse mb-2" />
        <div className="h-10 w-72 bg-white/[0.06] rounded animate-pulse mb-2" />
        <div className="h-4 w-96 bg-white/[0.04] rounded animate-pulse" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-panel p-6 h-32 animate-pulse rounded-2xl"
          />
        ))}
      </div>
    </main>
  );
}

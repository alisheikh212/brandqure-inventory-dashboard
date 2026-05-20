export default function DashboardLoading() {
  return (
    <main className="flex-1 px-4 md:px-8 py-8 max-w-[1440px] mx-auto w-full">
      {/* Header skeleton */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 rounded-lg bg-surface-container-high animate-pulse" />
          <div className="h-5 w-64 rounded-lg bg-surface-container animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-full bg-surface-container animate-pulse" />
          <div className="h-9 w-28 rounded-full bg-surface-container animate-pulse" />
          <div className="h-9 w-24 rounded-full bg-surface-container animate-pulse" />
          <div className="h-9 w-24 rounded-full bg-surface-container animate-pulse" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} data-card className="h-28 animate-pulse bg-surface-container-low" />
        ))}
      </div>

      {/* Visuals row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div data-card className="lg:col-span-2 h-48 animate-pulse bg-surface-container-low" />
        <div data-card className="h-48 animate-pulse bg-surface-container-low" />
      </div>

      {/* Table + timeline skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div data-card className="h-80 animate-pulse bg-surface-container-low" />
        <div data-card className="lg:col-span-3 h-80 animate-pulse bg-surface-container-low" />
      </div>
    </main>
  )
}

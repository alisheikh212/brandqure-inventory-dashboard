export default function ReorderLoading() {
  return (
    <main className="flex-1 px-4 md:px-8 py-8 max-w-[1440px] mx-auto w-full">
      {/* Header skeleton */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 rounded-lg bg-surface-container animate-pulse" />
          <div className="h-8 w-56 rounded-lg bg-surface-container-high animate-pulse mt-1" />
          <div className="h-5 w-96 rounded-lg bg-surface-container animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-24 rounded-lg bg-surface-container animate-pulse" />
          <div className="w-px h-8 bg-outline-variant" />
          <div className="h-10 w-24 rounded-lg bg-surface-container animate-pulse" />
          <div className="h-9 w-24 rounded-full bg-surface-container animate-pulse" />
        </div>
      </div>

      {/* Alert tiles skeleton */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} data-card className="h-20 animate-pulse bg-surface-container-low" />
        ))}
      </div>

      {/* Table skeleton */}
      <div data-card className="overflow-hidden">
        <div className="h-12 bg-surface-container animate-pulse" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 border-t border-outline-variant animate-pulse bg-surface-container-lowest" style={{ opacity: 1 - i * 0.1 }} />
        ))}
      </div>
    </main>
  )
}

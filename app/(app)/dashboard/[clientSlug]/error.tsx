'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[Dashboard] Inventory load error:', error)
  }, [error])

  return (
    <main className="flex-1 px-4 md:px-8 py-8 max-w-[1440px] mx-auto w-full">
      <div
        data-card
        className="flex flex-col items-center justify-center gap-6 py-20 text-center max-w-lg mx-auto"
      >
        <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center">
          <span className="material-symbols-outlined text-error text-[28px]">
            cloud_off
          </span>
        </div>

        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">
            Unable to load inventory
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            The Google Sheet could not be reached. It may be temporarily
            unavailable or the connection has failed. No data has been shown.
          </p>
        </div>

        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Retry
        </button>
      </div>
    </main>
  )
}

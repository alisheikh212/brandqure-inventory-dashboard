'use client'

import { useActionState } from 'react'
import { addClient, type ActionResult } from '@/app/actions/admin-clients'
import { getAllMarketplaces } from '@/lib/marketplace-utils'
import Link from 'next/link'

const TIERS = ['Enterprise', 'Pro', 'Basic'] as const
const MARKETPLACES = getAllMarketplaces()

export default function AddClientForm() {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(addClient, null)

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      {state && !state.success && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-error bg-error-container/30 text-error">
          <span className="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0">error</span>
          <p className="font-body-md text-body-md">{state.error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="clientName" className="font-label-md text-label-md text-on-surface-variant">
            Client Name
          </label>
          <input
            id="clientName"
            name="clientName"
            type="text"
            required
            placeholder="Acme Corp"
            className="brand-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="clientSlug" className="font-label-md text-label-md text-on-surface-variant">
            Client Slug
          </label>
          <input
            id="clientSlug"
            name="clientSlug"
            type="text"
            required
            placeholder="acme-corp"
            pattern="[a-z0-9][a-z0-9\-]*[a-z0-9]"
            className="brand-input font-mono"
          />
          <p className="font-body-sm text-body-sm text-outline">
            Lowercase letters, numbers, hyphens. Used in dashboard URLs.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="logoInitial" className="font-label-md text-label-md text-on-surface-variant">
            Logo Initial
          </label>
          <input
            id="logoInitial"
            name="logoInitial"
            type="text"
            required
            maxLength={2}
            placeholder="A"
            className="brand-input"
          />
          <p className="font-body-sm text-body-sm text-outline">1–2 characters shown as the client avatar.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tier" className="font-label-md text-label-md text-on-surface-variant">
            Tier
          </label>
          <select id="tier" name="tier" required className="brand-input">
            <option value="">Select tier…</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="googleSheetId" className="font-label-md text-label-md text-on-surface-variant">
            Google Sheet ID
          </label>
          <input
            id="googleSheetId"
            name="googleSheetId"
            type="text"
            required
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            className="brand-input font-mono"
          />
          <p className="font-body-sm text-body-sm text-outline">
            Copy from the sheet URL: /spreadsheets/d/<strong>ID</strong>/edit
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="defaultLeadTimeDays" className="font-label-md text-label-md text-on-surface-variant">
            Default Lead Time (days)
          </label>
          <input
            id="defaultLeadTimeDays"
            name="defaultLeadTimeDays"
            type="number"
            required
            min={1}
            max={365}
            defaultValue={21}
            className="brand-input"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-label-md text-label-md text-on-surface-variant">Enabled Marketplaces</p>
        <div className="flex flex-wrap gap-4">
          {MARKETPLACES.map((m) => (
            <label key={m.value} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name={`marketplace_${m.value}`}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="font-body-md text-body-md text-on-surface">{m.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isPending} className="btn-primary-indigo">
          {isPending ? (
            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">add</span>
          )}
          {isPending ? 'Creating…' : 'Create Client'}
        </button>
        <Link
          href="/admin"
          className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import type { InventoryRow } from '@/lib/mock-data'
import { createInboundOrders } from '@/app/actions/inbound-orders'

interface Props {
  clientSlug: string
  inventory: InventoryRow[]
  onClose: () => void
}

interface OrderRow {
  _key: number
  sku: string
  asin: string
  productName: string
  marketplace: string
  quantity: string
  estimatedDaysToFba: string
}

const MARKETPLACES = ['Amazon.com', 'Amazon.ca', 'Amazon UK', 'Shopify', 'Walmart'] as const

let _nextKey = 1
function nextKey() { return _nextKey++ }

function emptyRow(): OrderRow {
  return {
    _key: nextKey(),
    sku: '',
    asin: '',
    productName: '',
    marketplace: 'Amazon.com',
    quantity: '',
    estimatedDaysToFba: '',
  }
}

export default function AddInboundOrderModal({ clientSlug, inventory, onClose }: Props) {
  const [rows, setRows] = useState<OrderRow[]>([emptyRow()])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Build a lookup: sku → all inventory rows for that SKU
  const skuMap = new Map<string, InventoryRow[]>()
  for (const row of inventory) {
    const existing = skuMap.get(row.sku) ?? []
    skuMap.set(row.sku, [...existing, row])
  }
  // Deduplicated SKU list (unique sku+productName pairs)
  const uniqueSkus = Array.from(
    new Map(inventory.map((r) => [r.sku, r])).values()
  )

  function handleSkuChange(key: number, sku: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r._key !== key) return r
        const match = skuMap.get(sku)?.[0]
        return {
          ...r,
          sku,
          asin: match?.asin ?? '',
          productName: match?.productName ?? '',
          marketplace: match?.marketplace ?? 'Amazon USA',
        }
      })
    )
  }

  function handleFieldChange(key: number, field: keyof Omit<OrderRow, '_key' | 'sku'>, value: string) {
    setRows((prev) =>
      prev.map((r) => (r._key === key ? { ...r, [field]: value } : r))
    )
  }

  function addRow() {
    if (rows.length >= 15) return
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(key: number) {
    if (rows.length <= 1) return
    setRows((prev) => prev.filter((r) => r._key !== key))
  }

  function handleSave() {
    setError(null)

    // Client-side validation before hitting the server
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const label = `Row ${i + 1}`
      if (!r.sku) { setError(`${label}: Please select a SKU.`); return }

      const qty = parseInt(r.quantity, 10)
      if (r.quantity === '' || isNaN(qty) || qty < 1) {
        setError(`${label}: Quantity must be a whole number of at least 1.`)
        return
      }

      const days = parseInt(r.estimatedDaysToFba, 10)
      if (r.estimatedDaysToFba === '' || isNaN(days) || days < 0) {
        setError(`${label}: Days to FBA must be 0 or greater.`)
        return
      }
    }

    startTransition(async () => {
      const payload = rows.map((r) => ({
        sku: r.sku,
        asin: r.asin || null,
        productName: r.productName,
        marketplace: r.marketplace,
        quantity: parseInt(r.quantity, 10),
        estimatedDaysToFba: parseInt(r.estimatedDaysToFba, 10),
      }))

      const result = await createInboundOrders(clientSlug, payload)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal
      title="Add Inbound Order"
      icon="move_to_inbox"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="btn-ghost-glass focus:outline-none focus:ring-2 focus:ring-outline/30"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="btn-primary-indigo"
          >
            {isPending ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">add_task</span>
            )}
            {isPending ? 'Saving…' : `Save ${rows.length > 1 ? `${rows.length} Orders` : 'Order'}`}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 -mx-6 px-6 overflow-x-auto">
        {error && (
          <div className="flex items-start gap-3 p-3 rounded-xl border border-error/40 bg-error-container/40 backdrop-blur-sm text-error">
            <span className="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0">error</span>
            <p className="font-body-sm text-body-sm">{error}</p>
          </div>
        )}

        {/* Column headers */}
        <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-2 min-w-[640px]">
          {['SKU', 'Product', 'Marketplace', 'Qty', 'Days to FBA', ''].map((h) => (
            <p key={h} className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider px-1">
              {h}
            </p>
          ))}
        </div>

        {/* Order rows */}
        <div className="flex flex-col gap-2 min-w-[640px]">
          {rows.map((row) => (
            <div key={row._key} className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-2 items-center">
              {/* SKU dropdown */}
              <div className="relative">
                <select
                  value={row.sku}
                  onChange={(e) => handleSkuChange(row._key, e.target.value)}
                  className="brand-input appearance-none pr-7 text-[13px]"
                  required
                >
                  <option value="">Select SKU…</option>
                  {uniqueSkus.map((s) => (
                    <option key={s.sku} value={s.sku}>
                      {s.sku}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">
                  expand_more
                </span>
              </div>

              {/* Product name — auto-filled, read-only */}
              <input
                type="text"
                value={row.productName}
                readOnly
                placeholder="Auto-filled"
                className="brand-input text-on-surface-variant/75 text-[13px] cursor-default"
                tabIndex={-1}
              />

              {/* Marketplace */}
              <div className="relative">
                <select
                  value={row.marketplace}
                  onChange={(e) => handleFieldChange(row._key, 'marketplace', e.target.value)}
                  className="brand-input appearance-none pr-7 text-[13px]"
                >
                  {MARKETPLACES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">
                  expand_more
                </span>
              </div>

              {/* Quantity */}
              <input
                type="number"
                min={1}
                value={row.quantity}
                onChange={(e) => handleFieldChange(row._key, 'quantity', e.target.value)}
                placeholder="0"
                className="brand-input text-right font-numeric-data text-[13px]"
                required
              />

              {/* Days to FBA */}
              <input
                type="number"
                min={0}
                max={365}
                value={row.estimatedDaysToFba}
                onChange={(e) => handleFieldChange(row._key, 'estimatedDaysToFba', e.target.value)}
                placeholder="0"
                className="brand-input text-right text-[13px]"
                required
              />

              {/* Remove row */}
              <button
                type="button"
                onClick={() => removeRow(row._key)}
                disabled={rows.length <= 1}
                aria-label="Remove row"
                className="p-1.5 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">remove_circle</span>
              </button>
            </div>
          ))}
        </div>

        {/* Add row button */}
        {rows.length < 15 && (
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 self-start px-3 py-1.5 rounded-full border border-dashed border-outline-variant/45 bg-white/[0.05] text-on-surface-variant font-label-sm text-label-sm hover:border-tertiary/50 hover:text-tertiary hover:bg-white/[0.09] backdrop-blur-sm transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Another Row
          </button>
        )}

        <p className="font-body-sm text-body-sm text-outline">
          Expected arrival date is calculated from today + days to FBA and stored at save time.
        </p>
      </div>
    </Modal>
  )
}

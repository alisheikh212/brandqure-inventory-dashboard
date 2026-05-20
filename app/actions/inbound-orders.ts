'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getClientConfig } from '@/lib/clients'
import type { InboundOrder } from '@/lib/types'

// Admin: can create/mark orders for any client.
// Client: can only create/mark orders for their own clientSlug.
async function requireAuthForClient(clientSlug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const role = user.app_metadata?.role as string | undefined
  if (role === 'admin') return user

  if (role === 'client') {
    const allowedSlug = user.app_metadata?.clientSlug as string | undefined
    if (allowedSlug !== clientSlug) throw new Error('Unauthorized')
    return user
  }

  throw new Error('Unauthorized')
}

// Admin-only guard — used for markOrderReceived to prevent clients
// from marking other operations they shouldn't control.
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return user
}

export interface InboundOrderRow {
  sku: string
  asin: string | null
  productName: string
  marketplace: string
  quantity: number
  estimatedDaysToFba: number
}

export type InboundOrderResult =
  | { success: true }
  | { success: false; error: string }

export async function createInboundOrders(
  clientSlug: string,
  rows: InboundOrderRow[],
): Promise<InboundOrderResult> {
  let user: Awaited<ReturnType<typeof requireAuthForClient>>
  try {
    user = await requireAuthForClient(clientSlug)
  } catch {
    return { success: false, error: 'Unauthorized' }
  }

  if (!rows.length) {
    return { success: false, error: 'At least one order row is required.' }
  }

  // Validate client exists
  const clientConfig = await getClientConfig(clientSlug)
  if (!clientConfig) {
    return { success: false, error: `Client "${clientSlug}" does not exist.` }
  }

  // Validate each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row.sku) return { success: false, error: `Row ${i + 1}: SKU is required.` }
    if (!row.productName) return { success: false, error: `Row ${i + 1}: Product name is required.` }
    if (!row.marketplace) return { success: false, error: `Row ${i + 1}: Marketplace is required.` }
    if (!row.quantity || row.quantity < 1) return { success: false, error: `Row ${i + 1}: Quantity must be at least 1.` }
    if (row.estimatedDaysToFba < 0) return { success: false, error: `Row ${i + 1}: Days to FBA cannot be negative.` }
  }

  // Compute expected arrival date for each row: today + estimatedDaysToFba
  const today = new Date()
  const inserts = rows.map((row) => {
    const arrival = new Date(today)
    arrival.setDate(arrival.getDate() + row.estimatedDaysToFba)
    return {
      client_slug: clientSlug,
      sku: row.sku,
      asin: row.asin ?? null,
      product_name: row.productName,
      marketplace: row.marketplace,
      quantity: row.quantity,
      estimated_days_to_fba: row.estimatedDaysToFba,
      expected_arrival_date: arrival.toISOString().split('T')[0],
      status: 'pending',
      created_by: user.id,
    }
  })

  const admin = createAdminClient()
  const { error } = await admin.from('inbound_orders').insert(inserts)
  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function markOrderReceived(orderId: string): Promise<InboundOrderResult> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: 'Unauthorized' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('inbound_orders')
    .update({ status: 'received', received_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

// Fetch pending inbound orders for a client — called server-side from the dashboard page
export async function getPendingInboundOrders(clientSlug: string): Promise<InboundOrder[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inbound_orders')
    .select('*')
    .eq('client_slug', clientSlug)
    .eq('status', 'pending')
    .order('expected_arrival_date', { ascending: true })

  if (error) {
    // Non-fatal: dashboard still loads from Google Sheets; log and return empty
    console.error('[inbound_orders] fetch error:', error.message)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    clientSlug: row.client_slug,
    sku: row.sku,
    asin: row.asin,
    productName: row.product_name,
    marketplace: row.marketplace,
    quantity: row.quantity,
    estimatedDaysToFba: row.estimated_days_to_fba,
    expectedArrivalDate: row.expected_arrival_date,
    status: row.status,
    createdAt: row.created_at,
    receivedAt: row.received_at,
    createdBy: row.created_by,
  }))
}

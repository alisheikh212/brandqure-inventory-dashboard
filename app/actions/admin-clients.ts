'use server'

import { createClient } from '@/lib/supabase/server'
import { createClientConfig, updateClientConfig } from '@/lib/clients'
import { redirect } from 'next/navigation'

const SLUG_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
const VALID_TIERS = ['Enterprise', 'Pro', 'Basic'] as const
const VALID_MARKETPLACES = ['Amazon USA', 'Amazon Canada', 'Amazon UK', 'Shopify', 'Walmart'] as const

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

export type ActionResult = { success: true } | { success: false; error: string }

export async function addClient(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: 'Unauthorized' }
  }

  const clientSlug = formData.get('clientSlug')?.toString().trim() ?? ''
  const clientName = formData.get('clientName')?.toString().trim() ?? ''
  const logoInitial = formData.get('logoInitial')?.toString().trim() ?? ''
  const tier = formData.get('tier')?.toString().trim() ?? ''
  const googleSheetId = formData.get('googleSheetId')?.toString().trim() ?? ''
  const defaultLeadTimeDays = parseInt(formData.get('defaultLeadTimeDays')?.toString() ?? '0', 10)
  const enabledMarketplaces = VALID_MARKETPLACES.filter(
    (m) => formData.get(`marketplace_${m}`) === 'on'
  )

  if (!clientSlug || !SLUG_RE.test(clientSlug)) {
    return { success: false, error: 'Client slug must be lowercase letters, numbers, and hyphens only.' }
  }
  if (!clientName) {
    return { success: false, error: 'Client name is required.' }
  }
  if (!logoInitial || logoInitial.length > 2) {
    return { success: false, error: 'Logo initial must be 1–2 characters.' }
  }
  if (!VALID_TIERS.includes(tier as typeof VALID_TIERS[number])) {
    return { success: false, error: 'Invalid tier.' }
  }
  if (!googleSheetId) {
    return { success: false, error: 'Google Sheet ID is required.' }
  }
  if (!defaultLeadTimeDays || defaultLeadTimeDays < 1 || defaultLeadTimeDays > 365) {
    return { success: false, error: 'Default lead time must be between 1 and 365 days.' }
  }
  if (enabledMarketplaces.length === 0) {
    return { success: false, error: 'At least one marketplace must be selected.' }
  }

  try {
    await createClientConfig({
      clientSlug,
      clientName,
      logoInitial,
      tier,
      googleSheetId,
      defaultLeadTimeDays,
      enabledMarketplaces,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return { success: false, error: `A client with slug "${clientSlug}" already exists.` }
    }
    return { success: false, error: msg }
  }

  redirect('/admin')
}

export async function editClient(slug: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: 'Unauthorized' }
  }

  const clientName = formData.get('clientName')?.toString().trim() ?? ''
  const logoInitial = formData.get('logoInitial')?.toString().trim() ?? ''
  const tier = formData.get('tier')?.toString().trim() ?? ''
  const googleSheetId = formData.get('googleSheetId')?.toString().trim() ?? ''
  const defaultLeadTimeDays = parseInt(formData.get('defaultLeadTimeDays')?.toString() ?? '0', 10)
  const enabledMarketplaces = VALID_MARKETPLACES.filter(
    (m) => formData.get(`marketplace_${m}`) === 'on'
  )

  if (!clientName) return { success: false, error: 'Client name is required.' }
  if (!logoInitial || logoInitial.length > 2) return { success: false, error: 'Logo initial must be 1–2 characters.' }
  if (!VALID_TIERS.includes(tier as typeof VALID_TIERS[number])) return { success: false, error: 'Invalid tier.' }
  if (!googleSheetId) return { success: false, error: 'Google Sheet ID is required.' }
  if (!defaultLeadTimeDays || defaultLeadTimeDays < 1 || defaultLeadTimeDays > 365) {
    return { success: false, error: 'Default lead time must be between 1 and 365 days.' }
  }
  if (enabledMarketplaces.length === 0) return { success: false, error: 'At least one marketplace must be selected.' }

  try {
    await updateClientConfig(slug, {
      clientName,
      logoInitial,
      tier,
      googleSheetId,
      defaultLeadTimeDays,
      enabledMarketplaces,
    })
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }

  redirect('/admin')
}

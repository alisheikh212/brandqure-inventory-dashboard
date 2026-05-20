import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ClientInput {
  clientSlug: string
  clientName: string
  logoInitial: string
  tier: string
  googleSheetId: string
  defaultLeadTimeDays: number
  enabledMarketplaces: string[]
}

export interface ClientConfig {
  clientSlug: string
  clientName: string
  logoInitial: string
  tier: string
  googleSheetId: string
  defaultLeadTimeDays: number
  enabledMarketplaces: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): ClientConfig {
  return {
    clientSlug: row.client_slug,
    clientName: row.client_name,
    logoInitial: row.logo_initial,
    tier: row.tier,
    googleSheetId: row.google_sheet_id,
    defaultLeadTimeDays: row.default_lead_time_days,
    enabledMarketplaces: row.enabled_marketplaces,
  }
}

export async function getClientConfig(slug: string): Promise<ClientConfig | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('client_slug', slug)
    .single()

  // PGRST116 = "no rows returned" — not an error, just means client doesn't exist
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to load client config for "${slug}": ${error.message}`)
  }
  return data ? mapRow(data) : null
}

export async function getAllClientConfigs(): Promise<ClientConfig[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('clients').select('*')

  if (error) {
    throw new Error(`Failed to load client list: ${error.message}`)
  }
  return (data ?? []).map(mapRow)
}

export async function createClientConfig(input: ClientInput): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('clients').insert({
    client_slug: input.clientSlug,
    client_name: input.clientName,
    logo_initial: input.logoInitial,
    tier: input.tier,
    google_sheet_id: input.googleSheetId,
    default_lead_time_days: input.defaultLeadTimeDays,
    enabled_marketplaces: input.enabledMarketplaces,
  })
  if (error) {
    throw new Error(`Failed to create client "${input.clientSlug}": ${error.message}`)
  }
}

export async function updateClientConfig(slug: string, input: Partial<Omit<ClientInput, 'clientSlug'>>): Promise<void> {
  const admin = createAdminClient()
  const patch: Record<string, unknown> = {}
  if (input.clientName !== undefined) patch.client_name = input.clientName
  if (input.logoInitial !== undefined) patch.logo_initial = input.logoInitial
  if (input.tier !== undefined) patch.tier = input.tier
  if (input.googleSheetId !== undefined) patch.google_sheet_id = input.googleSheetId
  if (input.defaultLeadTimeDays !== undefined) patch.default_lead_time_days = input.defaultLeadTimeDays
  if (input.enabledMarketplaces !== undefined) patch.enabled_marketplaces = input.enabledMarketplaces

  const { error } = await admin.from('clients').update(patch).eq('client_slug', slug)
  if (error) {
    throw new Error(`Failed to update client "${slug}": ${error.message}`)
  }
}

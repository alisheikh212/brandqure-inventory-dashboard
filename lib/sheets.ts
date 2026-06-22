import 'server-only'
import crypto from 'crypto'
import { unstable_cache } from 'next/cache'
import type { InventoryRow, Marketplace } from '@/lib/mock-data'
import { normalizeMarketplace } from '@/lib/mock-data'
import { deriveInventoryStatus } from '@/lib/reorder'
import type { ClientConfig } from '@/lib/clients'

function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

async function getGoogleAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL!
  // .env.local stores the key as a single line with literal \n sequences
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY!.replace(/\\n/g, '\n')

  const now = Math.floor(Date.now() / 1000)
  const header = base64urlEncode(
    Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  )
  const payload = base64urlEncode(
    Buffer.from(JSON.stringify({
      iss: email,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }))
  )

  const signingInput = `${header}.${payload}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signingInput)
  sign.end()
  const signature = base64urlEncode(sign.sign(privateKey))
  const jwt = `${signingInput}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(
      `Google OAuth token exchange failed (${res.status}): ${await res.text()}`
    )
  }

  const data = await res.json() as { access_token: string }
  return data.access_token
}

async function fetchSheetRows(
  googleSheetId: string,
  accessToken: string,
): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetId}/values/Inventory!A2:J`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(
      `Google Sheets fetch failed (${res.status}): ${await res.text()}`
    )
  }

  const json = await res.json() as { values?: string[][] }
  return json.values ?? []
}

// Canonical marketplace values after normalization.
// Legacy values ("Amazon USA", "Amazon Canada") are accepted by normalizeMarketplace()
// and converted to "Amazon.com" / "Amazon.ca" before this check.
const VALID_MARKETPLACES = new Set<Marketplace>([
  'Amazon.com', 'Amazon.ca', 'Amazon UK', 'Shopify', 'Walmart',
])

function parseSheetRows(
  rows: string[][],
  clientSlug: string,
  defaultLeadTimeDays: number,
): InventoryRow[] {
  return rows
    .filter((row) => {
      // Skip empty rows and rows missing the three required identity fields:
      // col A (SKU), col C (Product Name), col D (Marketplace).
      // This catches wrong column order and partial header bleed-through.
      const sku = row[0]?.trim()
      const productName = row[2]?.trim()
      const marketplace = row[3]?.trim()
      return sku && productName && marketplace
    })
    .map((row) => {
      const sku            = row[0]?.trim() ?? ''
      const asin           = row[1]?.trim() ?? ''
      const productName    = row[2]?.trim() ?? ''
      const marketplaceRaw = row[3]?.trim() ?? ''
      // Normalize handles both legacy ("Amazon USA") and current ("Amazon.com") values.
      const normalized = normalizeMarketplace(marketplaceRaw)
      const marketplace: Marketplace = VALID_MARKETPLACES.has(normalized)
        ? normalized
        : 'Amazon.com'
      const fbaAvailable  = parseInt(row[4] ?? '0', 10) || 0
      const inboundUnits  = parseInt(row[5] ?? '0', 10) || 0
      const reservedUnits = parseInt(row[6] ?? '0', 10) || 0
      const avgDailySales = parseFloat(row[7] ?? '0') || 0
      const overrideRaw   = row[8]?.trim()
      const leadTimeDays  = overrideRaw
        ? (parseInt(overrideRaw, 10) || defaultLeadTimeDays)
        : defaultLeadTimeDays
      const lastUpdated   = row[9]?.trim() ?? ''

      const base = {
        id:              `${clientSlug}-${sku}-${marketplace}`,
        clientSlug,
        productName,
        asin,
        sku,
        marketplace,
        fbaAvailable,
        inboundUnits,
        reservedUnits,
        avgDailySales,
        leadTimeDays,
        // 3PL data is not in the Google Sheet — Phase 3C will wire this via Supabase
        threePlInventory: 0,
        threePlLocation:  '',
        lastUpdated,
      }

      return {
        ...base,
        // status is always computed by the app — never read from the sheet
        status: deriveInventoryStatus({ ...base, status: 'Healthy' as const }),
      } satisfies InventoryRow
    })
}

// Cache parsed inventory per client for 5 minutes to stay within the
// 60 read requests/minute/user quota on the free Sheets API tier.
// A per-client tag ('sheets-inventory-{clientSlug}') enables targeted
// on-demand invalidation via updateTag() without affecting other clients.
export async function getInventoryFromSheet(config: ClientConfig): Promise<InventoryRow[]> {
  return unstable_cache(
    async (
      googleSheetId: string,
      clientSlug: string,
      defaultLeadTimeDays: number,
    ): Promise<InventoryRow[]> => {
      const accessToken = await getGoogleAccessToken()
      const rows = await fetchSheetRows(googleSheetId, accessToken)
      return parseSheetRows(rows, clientSlug, defaultLeadTimeDays)
    },
    ['sheets-inventory', config.clientSlug],
    {
      revalidate: 300,
      tags: [`sheets-inventory-${config.clientSlug}`],
    },
  )(config.googleSheetId, config.clientSlug, config.defaultLeadTimeDays)
}

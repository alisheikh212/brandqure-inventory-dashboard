import 'server-only'
import crypto from 'crypto'
import { unstable_cache } from 'next/cache'
import type { InventoryRow } from '@/lib/mock-data'
import { parseSheetRows } from '@/lib/sheets-parser'
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
  // Fetch the header row (row 1) along with data so columns can be resolved
  // by header text rather than trusting a hardcoded position.
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetId}/values/Inventory!A1:J`
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

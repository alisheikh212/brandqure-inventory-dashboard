// Shared application types that are not mock data.
// These mirror real Supabase table shapes.

export interface InboundOrder {
  id: string
  clientSlug: string
  sku: string
  asin: string | null
  productName: string
  marketplace: string
  quantity: number
  estimatedDaysToFba: number
  expectedArrivalDate: string   // ISO date string "YYYY-MM-DD"
  status: 'pending' | 'received' | 'cancelled'
  createdAt: string             // ISO timestamp
  receivedAt: string | null
  createdBy: string | null
}

'use server'

import { updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function refreshSheetData(clientSlug: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const role = user.app_metadata?.role as string | undefined
  if (role === 'client') {
    const allowedSlug = user.app_metadata?.clientSlug as string | undefined
    if (allowedSlug !== clientSlug) throw new Error('Unauthorized')
  }

  updateTag(`sheets-inventory-${clientSlug}`)
}

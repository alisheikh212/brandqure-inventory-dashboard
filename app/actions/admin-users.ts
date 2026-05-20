'use server'

import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getClientConfig } from '@/lib/clients'

export type CreateLoginResult =
  | { success: true; email: string; password: string }
  | { success: false; error: string }

export async function createClientLogin(
  clientSlug: string,
  _prev: CreateLoginResult | null,
  formData: FormData,
): Promise<CreateLoginResult> {
  // Verify the requesting user is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  // Validate the clientSlug exists in the database
  const clientConfig = await getClientConfig(clientSlug)
  if (!clientConfig) {
    return { success: false, error: `Client "${clientSlug}" does not exist.` }
  }

  const email = formData.get('email')?.toString().trim() ?? ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'A valid email address is required.' }
  }

  // Generate a secure random password server-side
  const password = crypto.randomBytes(12).toString('base64url')

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      role: 'client',
      clientSlug,
      name: clientConfig.clientName,
    },
  })

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      return { success: false, error: `An account with email "${email}" already exists.` }
    }
    return { success: false, error: error.message }
  }

  return { success: true, email, password }
}

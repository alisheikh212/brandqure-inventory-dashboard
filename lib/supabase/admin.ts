import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Returns a Supabase client with the service role key.
// Bypasses RLS — only call after verifying the requesting user is an admin.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

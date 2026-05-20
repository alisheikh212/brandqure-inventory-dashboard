import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChangePasswordForm from '@/components/settings/ChangePasswordForm'

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, { label: string; colors: string }> = {
  admin: {
    label: 'Admin',
    colors: 'bg-[#ede7f6] text-[#4527a0]',
  },
  client: {
    label: 'Client',
    colors: 'bg-[#e3f2fd] text-[#0d47a1]',
  },
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = (user.app_metadata?.role as string | undefined) ?? 'unknown'
  const name = (user.app_metadata?.name as string | undefined) ?? user.email ?? '—'
  const clientSlug = user.app_metadata?.clientSlug as string | undefined
  const roleInfo = ROLE_LABELS[role]

  return (
    <main className="flex-1 px-4 md:px-8 py-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Account Settings</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Manage your account information and security.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl">

        {/* Account info card */}
        <div data-card className="p-6 lg:col-span-1 flex flex-col gap-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
              <span className="font-headline-md text-headline-md text-white">
                {name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-headline-sm text-on-surface font-semibold leading-snug">{name}</p>
              {roleInfo && (
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${roleInfo.colors}`}>
                  {roleInfo.label}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-surface-variant pt-4 space-y-3">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-0.5">
                Email
              </p>
              <p className="font-body-md text-body-md text-on-surface break-all">{user.email}</p>
            </div>

            {clientSlug && (
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-0.5">
                  Assigned Dashboard
                </p>
                <p className="font-mono text-body-md text-on-surface">{clientSlug}</p>
              </div>
            )}

            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-0.5">
                Account Created
              </p>
              <p className="font-body-md text-body-md text-on-surface">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Change password card */}
        <div data-card className="p-6 lg:col-span-2">
          <div className="mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-1">Change Password</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Choose a strong password you don&apos;t use anywhere else.
            </p>
          </div>
          <ChangePasswordForm />
        </div>

      </div>
    </main>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AddClientForm from '@/components/admin/AddClientForm'

export const dynamic = 'force-dynamic'

export default async function NewClientPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const role = user?.app_metadata?.role
  if (role !== 'admin') {
    const slug = user?.app_metadata?.clientSlug
    redirect(role === 'client' && slug ? `/dashboard/${slug}` : '/login')
  }

  return (
    <main className="flex-1 px-4 md:px-8 py-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/admin"
            className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Admin
          </Link>
          <span className="text-outline">/</span>
          <span className="font-label-md text-label-md text-on-surface">New Client</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Add New Client</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Create a new client configuration and connect their Google Sheet.
        </p>
      </div>

      <div data-card className="p-6 md:p-8">
        <AddClientForm />
      </div>
    </main>
  )
}

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getClientConfig } from '@/lib/clients'
import EditClientForm from '@/components/admin/EditClientForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ clientSlug: string }>
}

export default async function EditClientPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const role = user?.app_metadata?.role
  if (role !== 'admin') {
    const slug = user?.app_metadata?.clientSlug
    redirect(role === 'client' && slug ? `/dashboard/${slug}` : '/login')
  }

  const { clientSlug } = await params
  const clientConfig = await getClientConfig(clientSlug)
  if (!clientConfig) notFound()

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
          <span className="font-label-md text-label-md text-on-surface">Edit Client</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">
          Edit {clientConfig.clientName}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Update client configuration and Google Sheet connection.
        </p>
      </div>

      <div data-card className="p-6 md:p-8">
        <EditClientForm client={clientConfig} />
      </div>
    </main>
  )
}

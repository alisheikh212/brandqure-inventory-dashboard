import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getClientConfig } from '@/lib/clients'
import CreateLoginForm from '@/components/admin/CreateLoginForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ clientSlug: string }>
}

export default async function CreateLoginPage({ params }: Props) {
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
          <span className="font-label-md text-label-md text-on-surface">
            Create Login — {clientConfig.clientName}
          </span>
        </div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">
          Create Client Login
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Create a Supabase auth account for <strong>{clientConfig.clientName}</strong>. A secure temporary password will be generated.
        </p>
      </div>

      <div data-card className="p-6 md:p-8">
        <CreateLoginForm
          clientSlug={clientConfig.clientSlug}
          clientName={clientConfig.clientName}
        />
      </div>
    </main>
  )
}

'use client'

import { useActionState, useState } from 'react'
import { createClientLogin, type CreateLoginResult } from '@/app/actions/admin-users'
import { useCallback } from 'react'
import Link from 'next/link'

interface Props {
  clientSlug: string
  clientName: string
}

export default function CreateLoginForm({ clientSlug, clientName }: Props) {
  const [copied, setCopied] = useState(false)

  const boundAction = useCallback(
    (prev: CreateLoginResult | null, formData: FormData) =>
      createClientLogin(clientSlug, prev, formData),
    [clientSlug],
  )

  const [state, action, isPending] = useActionState<CreateLoginResult | null, FormData>(
    boundAction,
    null,
  )

  async function handleCopy() {
    if (state?.success) {
      await navigator.clipboard.writeText(
        `Email: ${state.email}\nPassword: ${state.password}`,
      )
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (state?.success) {
    return (
      <div className="max-w-lg space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-xl border border-[#1b5e20] bg-[#e8f5e9]">
          <span className="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0 text-[#1b5e20]">
            check_circle
          </span>
          <p className="font-body-md text-body-md text-[#1b5e20]">
            Login created successfully for <strong>{clientName}</strong>.
          </p>
        </div>

        <div className="bg-surface-container rounded-xl border border-outline-variant p-5 space-y-4">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Credentials — share securely
          </p>

          <div className="space-y-3">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Email</p>
              <p className="font-mono text-body-md text-on-surface bg-white border border-outline-variant rounded-lg px-3 py-2">
                {state.email}
              </p>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Temporary Password</p>
              <p className="font-mono text-body-md text-on-surface bg-white border border-outline-variant rounded-lg px-3 py-2 break-all">
                {state.password}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="btn-primary-teal"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied ? 'Copied!' : 'Copy Credentials'}
            </button>
            <Link
              href="/admin"
              className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Back to Admin
            </Link>
          </div>
        </div>

        <p className="font-body-sm text-body-sm text-outline">
          This password is shown only once. Ask the client to change it after first login.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-6 max-w-lg">
      {state && !state.success && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-error bg-error-container/30 text-error">
          <span className="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0">error</span>
          <p className="font-body-md text-body-md">{state.error}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="font-label-md text-label-md text-on-surface-variant">
          Client Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="client@example.com"
          className="brand-input"
        />
        <p className="font-body-sm text-body-sm text-outline">
          A secure temporary password will be generated automatically.
        </p>
      </div>

      <div className="bg-surface-container rounded-xl border border-outline-variant p-4 space-y-1.5">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
          Will be assigned to
        </p>
        <p className="font-body-md text-body-md text-on-surface">
          <span className="font-semibold">{clientName}</span>{' '}
          <span className="font-mono text-on-surface-variant">({clientSlug})</span>
        </p>
        <p className="font-body-sm text-body-sm text-outline">
          Role: client · Can only access their own dashboard.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className="btn-primary-indigo">
          {isPending ? (
            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">person_add</span>
          )}
          {isPending ? 'Creating…' : 'Create Login'}
        </button>
        <Link
          href="/admin"
          className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}

'use client'

import { useActionState } from 'react'
import { updatePassword, type UpdatePasswordResult } from '@/app/actions/update-password'

export default function ChangePasswordForm() {
  const [state, action, isPending] = useActionState<UpdatePasswordResult | null, FormData>(
    updatePassword,
    null,
  )

  return (
    <form action={action} className="space-y-5">
      {state?.success && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-[#1b5e20] bg-[#e8f5e9]">
          <span className="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0 text-[#1b5e20]">
            check_circle
          </span>
          <p className="font-body-md text-body-md text-[#1b5e20]">
            Password updated successfully.
          </p>
        </div>
      )}

      {state && !state.success && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-error bg-error-container/30 text-error">
          <span className="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0">error</span>
          <p className="font-body-md text-body-md">{state.error}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="currentPassword" className="font-label-md text-label-md text-on-surface-variant">
          Current Password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="brand-input"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="newPassword" className="font-label-md text-label-md text-on-surface-variant">
          New Password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="brand-input"
        />
        <p className="font-body-sm text-body-sm text-outline">Minimum 8 characters.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="font-label-md text-label-md text-on-surface-variant">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="brand-input"
        />
      </div>

      <div className="pt-1">
        <button type="submit" disabled={isPending} className="btn-primary-indigo">
          {isPending ? (
            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">lock_reset</span>
          )}
          {isPending ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </form>
  )
}

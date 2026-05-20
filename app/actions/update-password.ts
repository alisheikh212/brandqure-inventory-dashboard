'use server'

import { createClient } from '@/lib/supabase/server'

export type UpdatePasswordResult =
  | { success: true }
  | { success: false; error: string }

export async function updatePassword(
  _prev: UpdatePasswordResult | null,
  formData: FormData,
): Promise<UpdatePasswordResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return { success: false, error: 'Not authenticated.' }
  }

  const currentPassword = formData.get('currentPassword')?.toString() ?? ''
  const newPassword = formData.get('newPassword')?.toString() ?? ''
  const confirmPassword = formData.get('confirmPassword')?.toString() ?? ''

  if (!currentPassword) {
    return { success: false, error: 'Current password is required.' }
  }
  if (newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters.' }
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: 'New passwords do not match.' }
  }
  if (currentPassword === newPassword) {
    return { success: false, error: 'New password must be different from your current password.' }
  }

  // Verify the current password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) {
    return { success: false, error: 'Current password is incorrect.' }
  }

  // Update to the new password
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

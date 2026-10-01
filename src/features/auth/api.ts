import { supabase } from '@/lib/supabase'
import { rememberNext } from './safeNext'

export async function signInWithGoogle(next: string) {
  rememberNext(next)
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) throw error
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

/** Returns false when the project requires email confirmation (no session yet). */
export async function signUpWithPassword(email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data.session !== null
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export async function setNewPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

/** `local` clears this device's session without calling the server (e.g. the user no longer exists). */
export async function signOut(scope: 'global' | 'local' = 'global') {
  const { error } = await supabase.auth.signOut({ scope })
  if (error) throw error
}

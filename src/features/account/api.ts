import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type Profile = Database['public']['Tables']['profiles']['Row']
/** The only columns the client may write (see the profiles migration grants). */
export type ProfilePatch = Partial<Pick<Profile, 'display_name' | 'upi_vpa' | 'onboarded_at'>>

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, patch: ProfilePatch): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

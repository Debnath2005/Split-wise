import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { fetchProfile, updateProfile, type ProfilePatch } from './api'

export const profileKey = (userId: string | undefined) => ['profile', userId] as const

export function useProfile() {
  const { session } = useAuth()
  const userId = session?.user.id
  return useQuery({
    queryKey: profileKey(userId),
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
  })
}

export function useUpdateProfile() {
  const { session } = useAuth()
  const userId = session?.user.id
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: ProfilePatch) => {
      if (!userId) throw new Error('Not signed in')
      return updateProfile(userId, patch)
    },
    onSuccess: (profile) => queryClient.setQueryData(profileKey(userId), profile),
  })
}

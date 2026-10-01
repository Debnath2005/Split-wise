import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { Alert, Button, PageHeader, Spinner } from '@/components/ui'
import type { Profile } from './api'
import { ProfileFields } from './ProfileFields'
import { ProfileLoadError } from './ProfileLoadError'
import { profileSchema, toProfilePatch, type ProfileForm } from './profileSchema'
import { useProfile, useUpdateProfile } from './useProfile'

export function OnboardingPage() {
  const profile = useProfile()
  if (profile.isPending) return <Spinner fullPage />
  if (profile.isError) {
    return <ProfileLoadError error={profile.error} onRetry={() => void profile.refetch()} />
  }
  if (profile.data.onboarded_at) return <Navigate to="/" replace />
  return <OnboardingForm profile={profile.data} />
}

function OnboardingForm({ profile }: { profile: Profile }) {
  const navigate = useNavigate()
  const update = useUpdateProfile()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: profile.display_name, upiVpa: profile.upi_vpa ?? '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        ...toProfilePatch(values),
        onboarded_at: new Date().toISOString(),
      })
    } catch {
      return // shown via update.isError
    }
    navigate('/', { replace: true })
  })

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-[max(env(safe-area-inset-bottom),24px)]">
      <PageHeader title="Welcome" />
      <p className="text-body text-muted">
        Check your name and add your UPI ID so friends can pay you.
      </p>
      <form
        noValidate
        onSubmit={(e) => void onSubmit(e)}
        className="mt-6 flex flex-1 flex-col gap-5"
      >
        <ProfileFields register={register} errors={errors} />
        <div className="mt-auto flex flex-col gap-3 pt-6">
          {update.isError && <Alert>Couldn't save. Please try again.</Alert>}
          <Button type="submit" fullWidth loading={update.isPending}>
            Continue
          </Button>
        </div>
      </form>
    </main>
  )
}

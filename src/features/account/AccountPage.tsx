import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert, Avatar, Button, Card, PageHeader, Spinner } from '@/components/ui'
import { signOut } from '@/features/auth/api'
import type { Profile } from './api'
import { ProfileFields } from './ProfileFields'
import { profileSchema, toProfilePatch, type ProfileForm } from './profileSchema'
import { useProfile, useUpdateProfile } from './useProfile'

export function AccountPage() {
  const profile = useProfile()
  return (
    <>
      <PageHeader title="Account" />
      {profile.isPending ? (
        <Spinner />
      ) : profile.isError ? (
        <Alert>Couldn't load your profile.</Alert>
      ) : (
        <AccountDetails profile={profile.data} />
      )}
    </>
  )
}

function AccountDetails({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const [saved, setSaved] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: profile.display_name, upiVpa: profile.upi_vpa ?? '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSaved(false)
    let updated
    try {
      updated = await update.mutateAsync(toProfilePatch(values))
    } catch {
      return // shown via update.isError
    }
    reset({ displayName: updated.display_name, upiVpa: updated.upi_vpa ?? '' })
    setSaved(true)
  })

  async function onSignOut() {
    setSigningOut(true)
    setSignOutError(false)
    try {
      await signOut() // AuthProvider sees SIGNED_OUT; guards redirect to /login
    } catch {
      setSignOutError(true)
      setSigningOut(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex items-center gap-4">
        <Avatar name={profile.display_name} src={profile.avatar_url} size={56} />
        <div className="min-w-0">
          <p className="truncate text-h3 text-fg">{profile.display_name}</p>
          <p className="truncate text-small text-muted">{profile.email}</p>
        </div>
      </Card>

      <Card>
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
          <ProfileFields register={register} errors={errors} />
          {update.isError && <Alert>Couldn't save. Please try again.</Alert>}
          {saved && !isDirty && (
            <p role="status" className="text-small text-muted">
              Saved.
            </p>
          )}
          <Button type="submit" loading={update.isPending} disabled={!isDirty} fullWidth>
            Save
          </Button>
        </form>
      </Card>

      {signOutError && <Alert>Couldn't sign out. Please try again.</Alert>}
      <Button variant="danger" fullWidth loading={signingOut} onClick={() => void onSignOut()}>
        Sign out
      </Button>
    </div>
  )
}

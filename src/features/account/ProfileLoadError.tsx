import { useEffect, useState } from 'react'
import { Alert, Button, Spinner } from '@/components/ui'
import { signOut } from '@/features/auth/api'

/** PostgREST "0 rows for a single object": the session's user has no profile (account deleted). */
function isMissingProfile(error: unknown) {
  return (
    typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'PGRST116'
  )
}

type Props = { error: unknown; onRetry: () => void }

/** Shown when the profile can't be loaded, so the user is never stuck without a way out. */
export function ProfileLoadError({ error, onRetry }: Props) {
  const missing = isMissingProfile(error)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    // Stale session for an account that no longer exists: drop it; RequireAuth sends us to /login.
    if (missing) void signOut('local').catch(() => undefined)
  }, [missing])

  if (missing) return <Spinner fullPage label="Signing you out" />

  async function onSignOut() {
    setSigningOut(true)
    await signOut('local').catch(() => setSigningOut(false))
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-3 p-4">
      <Alert>Couldn't load your profile. Check your connection and try again.</Alert>
      <Button fullWidth onClick={onRetry}>
        Retry
      </Button>
      <Button variant="secondary" fullWidth loading={signingOut} onClick={() => void onSignOut()}>
        Sign out
      </Button>
    </main>
  )
}

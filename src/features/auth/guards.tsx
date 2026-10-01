import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Alert, Spinner } from '@/components/ui'
import { useProfile } from '@/features/account/useProfile'
import { useAuth } from './AuthContext'

/** Requires a session; otherwise sends the user to /login, remembering where they were going. */
export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner fullPage />
  if (!session) {
    const next = location.pathname + location.search
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }
  return <Outlet />
}

/** Requires a finished onboarding; otherwise sends the user to /onboarding. */
export function RequireOnboarded() {
  const profile = useProfile()
  if (profile.isPending) return <Spinner fullPage />
  if (profile.isError) {
    return (
      <div className="mx-auto max-w-md p-4">
        <Alert>Couldn't load your profile. Check your connection and refresh.</Alert>
      </div>
    )
  }
  if (!profile.data.onboarded_at) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

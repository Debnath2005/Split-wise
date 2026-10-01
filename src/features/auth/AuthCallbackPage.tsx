import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Alert, Spinner } from '@/components/ui'
import { useAuth } from './AuthContext'
import { takeNext } from './safeNext'

/** Google redirects here; supabase-js exchanges the ?code= for a session on load. */
export function AuthCallbackPage() {
  const { session, loading } = useAuth()
  const [params] = useSearchParams()
  const [next] = useState(takeNext)
  const providerError = params.get('error_description') ?? params.get('error')

  if (!providerError && loading) {
    return <Spinner fullPage label="Signing you in" />
  }
  if (session) return <Navigate to={next} replace />

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <Alert>{providerError ?? 'Sign-in did not complete.'}</Alert>
      <Link to="/login" className="inline-flex min-h-tap items-center text-label text-link">
        Back to sign in
      </Link>
    </main>
  )
}

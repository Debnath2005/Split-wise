import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, GoogleLogo, Spinner, TextField } from '@/components/ui'
import { signInWithPassword, signUpWithPassword } from './api'
import { useAuth } from './AuthContext'
import { authErrorMessage } from './authErrors'
import { AuthScreen } from './AuthScreen'
import { signInSchema, signUpSchema, type SignInForm } from './authSchemas'
import { safeNext } from './safeNext'

type Mode = 'signIn' | 'signUp'

export function LoginPage() {
  const { session, loading } = useAuth()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const [mode, setMode] = useState<Mode>('signIn')

  if (loading) return <Spinner fullPage />
  // After sign-in/sign-up the session arrives via onAuthStateChange and this redirects.
  if (session) return <Navigate to={next} replace />

  return (
    <AuthScreen
      title="Split-Wise"
      intro="Split bills with friends and groups, see who owes whom, and settle up with UPI."
    >
      {/* key resets the form (values + errors) when switching modes */}
      <PasswordForm key={mode} mode={mode} onSwitchMode={setMode} />
      <GoogleSection />
    </AuthScreen>
  )
}

function PasswordForm({ mode, onSwitchMode }: { mode: Mode; onSwitchMode: (m: Mode) => void }) {
  const isSignUp = mode === 'signUp'
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const typedEmail = useWatch({ control, name: 'email' })

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null)
    setNotice(null)
    try {
      if (isSignUp) {
        const signedIn = await signUpWithPassword(email, password)
        if (!signedIn) setNotice('Check your email to confirm your account, then sign in.')
      } else {
        await signInWithPassword(email, password)
      }
    } catch (e) {
      setError(
        authErrorMessage(
          e,
          isSignUp
            ? "Couldn't create your account. Please try again."
            : "Couldn't sign in. Please try again.",
        ),
      )
    }
  })

  return (
    <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
      <h2 className="text-h3 text-fg">{isSignUp ? 'Create account' : 'Sign in'}</h2>
      <TextField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        hint={isSignUp ? 'At least 8 characters.' : undefined}
        error={errors.password?.message}
        {...register('password')}
      />
      {error && <Alert>{error}</Alert>}
      {notice && (
        <p role="status" className="text-small text-muted">
          {notice}
        </p>
      )}
      <Button type="submit" fullWidth loading={isSubmitting}>
        {isSignUp ? 'Create account' : 'Sign in'}
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-small text-muted">
        {!isSignUp && (
          <Link
            to={`/forgot-password?email=${encodeURIComponent(typedEmail.trim())}`}
            className="inline-flex min-h-tap items-center text-label text-link"
          >
            Forgot password?
          </Link>
        )}
        <span className="inline-flex items-center gap-1">
          {isSignUp ? 'Have an account?' : 'New here?'}
          <Button variant="link" onClick={() => onSwitchMode(isSignUp ? 'signIn' : 'signUp')}>
            {isSignUp ? 'Sign in' : 'Create account'}
          </Button>
        </span>
      </div>
    </form>
  )
}

/** Google sign-in is deferred (ADR 0018): shown, but disabled. */
function GoogleSection() {
  return (
    <section className="mt-auto flex flex-col gap-3 pt-8">
      <p className="text-center text-small text-muted">or</p>
      <Button variant="secondary" fullWidth disabled aria-describedby="google-soon">
        <GoogleLogo />
        Continue with Google
      </Button>
      <p id="google-soon" className="text-center text-small text-muted">
        Google sign-in is coming soon.
      </p>
    </section>
  )
}

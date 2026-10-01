import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Spinner, TextField } from '@/components/ui'
import { setNewPassword } from './api'
import { useAuth } from './AuthContext'
import { authErrorMessage } from './authErrors'
import { AuthScreen } from './AuthScreen'
import { resetPasswordSchema, type ResetPasswordForm } from './authSchemas'

/** Target of the reset email. supabase-js exchanges ?code= for a recovery session on load. */
export function ResetPasswordPage() {
  const { session, loading } = useAuth()
  const [params] = useSearchParams()
  const linkError = params.get('error_description')

  if (loading) return <Spinner fullPage />

  if (linkError || !session) {
    return (
      <AuthScreen title="Reset password">
        <Alert>
          {linkError ??
            'This reset link is invalid or has expired. Links work once, on the device and browser where you requested them.'}
        </Alert>
        <Link
          to="/forgot-password"
          className="mt-6 inline-flex min-h-tap items-center text-label text-link"
        >
          Send a new link
        </Link>
      </AuthScreen>
    )
  }

  return <NewPasswordForm />
}

function NewPasswordForm() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  })

  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null)
    try {
      await setNewPassword(password)
    } catch (e) {
      setError(authErrorMessage(e, "Couldn't update your password. Please try again."))
      return
    }
    navigate('/', { replace: true })
  })

  return (
    <AuthScreen title="Set a new password">
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          error={errors.password?.message}
          {...register('password')}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        {error && <Alert>{error}</Alert>}
        <Button type="submit" fullWidth loading={isSubmitting}>
          Save password
        </Button>
      </form>
    </AuthScreen>
  )
}

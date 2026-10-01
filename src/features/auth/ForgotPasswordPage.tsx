import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, Button, TextField } from '@/components/ui'
import { requestPasswordReset } from './api'
import { authErrorMessage } from './authErrors'
import { AuthScreen } from './AuthScreen'
import { forgotPasswordSchema, type ForgotPasswordForm } from './authSchemas'

export function ForgotPasswordPage() {
  const [params] = useSearchParams()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: params.get('email') ?? '' },
  })

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (e) {
      setError(authErrorMessage(e, "Couldn't send the email. Please try again."))
    }
  })

  return (
    <AuthScreen title="Reset password" intro="We'll email you a link to set a new password.">
      {sent ? (
        <p role="status" className="text-body text-fg">
          If an account exists for that email, we've sent a reset link. Open it on this device and
          browser.
        </p>
      ) : (
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
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
          {error && <Alert>{error}</Alert>}
          <Button type="submit" fullWidth loading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
      <Link to="/login" className="mt-6 inline-flex min-h-tap items-center text-label text-link">
        Back to sign in
      </Link>
    </AuthScreen>
  )
}

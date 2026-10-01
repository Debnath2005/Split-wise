/** Maps Supabase Auth error codes to user-facing messages. */
export function authErrorMessage(error: unknown, fallback: string): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''
  switch (code) {
    case 'invalid_credentials':
      return 'Wrong email or password.'
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Sign in instead.'
    case 'weak_password':
      return 'Choose a stronger password (at least 8 characters).'
    case 'same_password':
      return 'Choose a password different from your current one.'
    case 'email_address_invalid':
      return 'Enter a valid email address.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Please wait a minute and try again.'
    default:
      return fallback
  }
}

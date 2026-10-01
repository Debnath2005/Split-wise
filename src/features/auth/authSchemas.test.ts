import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './authErrors'
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from './authSchemas'

describe('auth schemas', () => {
  it('trims and lower-cases the email', () => {
    expect(signInSchema.parse({ email: '  Asha@Example.COM ', password: 'x' }).email).toBe(
      'asha@example.com',
    )
  })

  it.each(['', 'asha', 'asha@', '@example.com'])('rejects email %j', (email) => {
    expect(forgotPasswordSchema.safeParse({ email }).success).toBe(false)
  })

  it('sign-in only needs a non-empty password', () => {
    expect(signInSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true)
    expect(signInSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false)
  })

  it.each([
    ['1234567', false],
    ['12345678', true],
    ['x'.repeat(72), true],
    ['x'.repeat(73), false],
  ])('sign-up password %j valid=%s', (password, ok) => {
    expect(signUpSchema.safeParse({ email: 'a@b.co', password }).success).toBe(ok)
  })

  it('reset requires matching passwords, error on confirm', () => {
    const result = resetPasswordSchema.safeParse({ password: '12345678', confirm: '12345679' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['confirm'])
    expect(
      resetPasswordSchema.safeParse({ password: '12345678', confirm: '12345678' }).success,
    ).toBe(true)
  })
})

describe('authErrorMessage', () => {
  it.each([
    ['invalid_credentials', 'Wrong email or password.'],
    ['user_already_exists', 'An account with this email already exists. Sign in instead.'],
    ['over_email_send_rate_limit', 'Too many attempts. Please wait a minute and try again.'],
  ])('%s', (code, message) => {
    expect(authErrorMessage({ code }, 'fallback')).toBe(message)
  })

  it('falls back for unknown errors', () => {
    expect(authErrorMessage(new Error('x'), 'fallback')).toBe('fallback')
    expect(authErrorMessage(null, 'fallback')).toBe('fallback')
  })
})

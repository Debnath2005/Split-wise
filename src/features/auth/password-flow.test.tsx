import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '@/test/renderApp'
import {
  authError,
  makeProfile,
  makeSession,
  resetMock,
  state,
  supabase,
} from '@/test/supabaseMock'

vi.mock('@/lib/supabase', () => import('@/test/supabaseMock'))

beforeEach(() => {
  resetMock()
  sessionStorage.clear()
})

async function fill(label: string, value: string) {
  const field = await screen.findByLabelText(label)
  await userEvent.clear(field)
  await userEvent.type(field, value)
}

describe('email sign-in', () => {
  it('signs in and continues to next', async () => {
    state.profile = makeProfile()
    const router = renderApp('/login?next=%2Ffriends')
    await fill('Email', ' Asha@Example.com ')
    await fill('Password', 'secret-pass')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'asha@example.com',
      password: 'secret-pass',
    })
    await screen.findByRole('heading', { level: 1, name: 'Friends' })
    expect(router.state.location.pathname).toBe('/friends')
  })

  it('shows "Wrong email or password" on bad credentials', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: null },
      error: authError('invalid_credentials'),
    } as never)
    renderApp('/login')
    await fill('Email', 'asha@example.com')
    await fill('Password', 'nope')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password.')
  })

  it('validates before calling Supabase', async () => {
    renderApp('/login')
    await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled()
  })
})

describe('email sign-up', () => {
  async function openSignUp() {
    await userEvent.click(await screen.findByRole('button', { name: 'Create account' }))
    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument()
  }

  it('creates an account and lands on onboarding', async () => {
    state.profile = makeProfile({ onboarded_at: null, display_name: 'asha' })
    const router = renderApp('/login')
    await openSignUp()
    await fill('Email', 'asha@example.com')
    await fill('Password', 'long-enough')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'asha@example.com',
      password: 'long-enough',
    })
    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/onboarding')
  })

  it('requires at least 8 characters', async () => {
    renderApp('/login')
    await openSignUp()
    await fill('Email', 'asha@example.com')
    await fill('Password', 'short')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('Use at least 8 characters')).toBeInTheDocument()
    expect(supabase.auth.signUp).not.toHaveBeenCalled()
  })

  it('explains when the email is already registered', async () => {
    supabase.auth.signUp.mockResolvedValueOnce({
      data: { session: null },
      error: authError('user_already_exists'),
    } as never)
    renderApp('/login')
    await openSignUp()
    await fill('Email', 'asha@example.com')
    await fill('Password', 'long-enough')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists')
  })

  it('asks the user to check their email when confirmation is on', async () => {
    supabase.auth.signUp.mockResolvedValueOnce({ data: { session: null }, error: null } as never)
    renderApp('/login')
    await openSignUp()
    await fill('Email', 'asha@example.com')
    await fill('Password', 'long-enough')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Check your email')
  })

  it('switches back to sign in', async () => {
    renderApp('/login')
    await openSignUp()
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })
})

describe('forgot password', () => {
  it('carries the typed email over and sends the reset link', async () => {
    renderApp('/login')
    await fill('Email', 'asha@example.com')
    await userEvent.click(screen.getByRole('link', { name: 'Forgot password?' }))

    expect(await screen.findByLabelText('Email')).toHaveValue('asha@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('asha@example.com', {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    expect(await screen.findByRole('status')).toHaveTextContent(
      "If an account exists for that email, we've sent a reset link",
    )
  })

  it('shows a rate-limit error', async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: {},
      error: authError('over_email_send_rate_limit'),
    } as never)
    renderApp('/forgot-password?email=asha%40example.com')
    await userEvent.click(await screen.findByRole('button', { name: 'Send reset link' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts')
  })
})

describe('reset password', () => {
  it('sets a new password from a recovery session and goes home', async () => {
    state.session = makeSession()
    state.profile = makeProfile()
    const router = renderApp('/reset-password?code=abc')
    await fill('New password', 'brand-new-pass')
    await fill('Confirm new password', 'brand-new-pass')
    await userEvent.click(screen.getByRole('button', { name: 'Save password' }))

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'brand-new-pass' })
    await screen.findByRole('heading', { level: 1, name: 'Home' })
    expect(router.state.location.pathname).toBe('/')
  })

  it('rejects mismatched passwords', async () => {
    state.session = makeSession()
    renderApp('/reset-password')
    await fill('New password', 'brand-new-pass')
    await fill('Confirm new password', 'different-pass')
    await userEvent.click(screen.getByRole('button', { name: 'Save password' }))
    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument()
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('shows an error if Supabase rejects the new password', async () => {
    state.session = makeSession()
    supabase.auth.updateUser.mockResolvedValueOnce({
      data: {},
      error: authError('same_password'),
    } as never)
    renderApp('/reset-password')
    await fill('New password', 'brand-new-pass')
    await fill('Confirm new password', 'brand-new-pass')
    await userEvent.click(screen.getByRole('button', { name: 'Save password' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('different from your current one')
  })

  it('explains an expired link and offers a new one', async () => {
    renderApp('/reset-password?code=stale')
    expect(await screen.findByRole('alert')).toHaveTextContent('invalid or has expired')
    expect(screen.getByRole('link', { name: 'Send a new link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
  })

  it('shows the error from the link itself', async () => {
    renderApp('/reset-password?error=access_denied&error_description=Email+link+is+invalid')
    expect(await screen.findByRole('alert')).toHaveTextContent('Email link is invalid')
  })
})

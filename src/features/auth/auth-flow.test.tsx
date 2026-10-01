import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '@/test/renderApp'
import { makeProfile, makeSession, resetMock, state, supabase } from '@/test/supabaseMock'

vi.mock('@/lib/supabase', () => import('@/test/supabaseMock'))

beforeEach(() => {
  resetMock()
  sessionStorage.clear()
})

describe('route guards', () => {
  it('sends a signed-out user to /login and remembers where they were going', async () => {
    const router = renderApp('/groups?x=1')
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe('?next=%2Fgroups%3Fx%3D1')
  })

  it('sends a signed-in, not-onboarded user to /onboarding', async () => {
    state.session = makeSession()
    state.profile = makeProfile({ onboarded_at: null })
    const router = renderApp('/friends')
    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/onboarding')
  })

  it('lets an onboarded user reach the dashboard', async () => {
    state.session = makeSession()
    state.profile = makeProfile()
    renderApp('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument()
  })

  it('redirects an onboarded user away from /onboarding', async () => {
    state.session = makeSession()
    state.profile = makeProfile()
    const router = renderApp('/onboarding')
    await screen.findByRole('heading', { level: 1, name: 'Home' })
    expect(router.state.location.pathname).toBe('/')
  })

  it('redirects a signed-in user away from /login to next', async () => {
    state.session = makeSession()
    state.profile = makeProfile()
    const router = renderApp('/login?next=%2Ffriends')
    await screen.findByRole('heading', { level: 1, name: 'Friends' })
    expect(router.state.location.pathname).toBe('/friends')
  })
})

describe('login', () => {
  it('shows Google sign-in as disabled and "coming soon"', async () => {
    renderApp('/login')
    const google = await screen.findByRole('button', { name: /continue with google/i })
    expect(google).toBeDisabled()
    expect(google).toHaveAccessibleDescription('Google sign-in is coming soon.')
    await userEvent.click(google)
    expect(supabase.auth.signInWithOAuth).not.toHaveBeenCalled()
  })
})

describe('auth callback', () => {
  it('goes to the remembered destination once the session exists', async () => {
    sessionStorage.setItem('auth.next', '/friends')
    state.session = makeSession()
    state.profile = makeProfile()
    const router = renderApp('/auth/callback?code=abc')
    await screen.findByRole('heading', { level: 1, name: 'Friends' })
    expect(router.state.location.pathname).toBe('/friends')
  })

  it('ignores an unsafe remembered destination', async () => {
    sessionStorage.setItem('auth.next', '//evil.example')
    state.session = makeSession()
    state.profile = makeProfile()
    const router = renderApp('/auth/callback?code=abc')
    await screen.findByRole('heading', { level: 1, name: 'Home' })
    expect(router.state.location.pathname).toBe('/')
  })

  it('shows the provider error and a way back', async () => {
    renderApp('/auth/callback?error=access_denied&error_description=User+cancelled')
    expect(await screen.findByRole('alert')).toHaveTextContent('User cancelled')
    expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/login')
  })
})

describe('onboarding', () => {
  beforeEach(() => {
    state.session = makeSession()
    state.profile = makeProfile({ onboarded_at: null, display_name: 'Asha Rao' })
  })

  it('pre-fills the Google name and saves name, UPI ID and onboarded_at', async () => {
    const router = renderApp('/onboarding')
    const name = await screen.findByLabelText('Your name')
    expect(name).toHaveValue('Asha Rao')
    await userEvent.type(screen.getByLabelText('UPI ID (optional)'), 'asha@okaxis')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await screen.findByRole('heading', { level: 1, name: 'Home' })
    expect(router.state.location.pathname).toBe('/')
    expect(state.updates).toHaveLength(1)
    const [update] = state.updates
    expect(update?.filters).toEqual({ id: 'user-1' })
    expect(update?.patch).toMatchObject({ display_name: 'Asha Rao', upi_vpa: 'asha@okaxis' })
    expect(typeof (update?.patch as { onboarded_at?: unknown }).onboarded_at).toBe('string')
  })

  it('shows validation errors and does not save', async () => {
    renderApp('/onboarding')
    await userEvent.clear(await screen.findByLabelText('Your name'))
    await userEvent.type(screen.getByLabelText('UPI ID (optional)'), 'not-a-vpa')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('Enter your name')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid UPI ID, like name@okaxis')).toBeInTheDocument()
    expect(screen.getByLabelText('Your name')).toHaveAttribute('aria-invalid', 'true')
    expect(state.updates).toHaveLength(0)
  })

  it('shows an error if saving fails', async () => {
    state.failProfileUpdate = true
    renderApp('/onboarding')
    await userEvent.click(await screen.findByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save")
  })
})

describe('account', () => {
  beforeEach(() => {
    state.session = makeSession()
    state.profile = makeProfile({ upi_vpa: 'asha@okaxis' })
  })

  it('shows the profile and saves edits', async () => {
    renderApp('/account')
    expect(await screen.findByText('asha@example.com')).toBeInTheDocument()
    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toBeDisabled()

    const upi = screen.getByLabelText('UPI ID (optional)')
    await userEvent.clear(upi)
    await userEvent.type(upi, 'asha@ybl')
    await userEvent.click(save)

    expect(await screen.findByText('Saved.')).toBeInTheDocument()
    expect(state.updates[0]?.patch).toEqual({ display_name: 'Asha Rao', upi_vpa: 'asha@ybl' })
  })

  it('signs out and returns to /login', async () => {
    const router = renderApp('/account')
    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }))
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'global' })
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })
})

describe('account save failure', () => {
  it('shows an error and keeps the edit', async () => {
    state.session = makeSession()
    state.profile = makeProfile()
    state.failProfileUpdate = true
    renderApp('/account')
    const name = await screen.findByLabelText('Your name')
    await userEvent.type(name, ' K')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save")
    expect(name).toHaveValue('Asha Rao K')
  })
})

describe('profile load failures', () => {
  it('signs out locally when the account no longer exists (PGRST116)', async () => {
    state.session = makeSession()
    state.profile = null // e.g. local db reset or deleted account, but a stale session remains
    const router = renderApp('/groups')
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(router.state.location.pathname).toBe('/login')
  })

  it('offers Retry and Sign out on other errors', async () => {
    state.session = makeSession()
    state.profile = makeProfile()
    state.failProfileFetch = true
    renderApp('/')
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load your profile")
    expect(supabase.auth.signOut).not.toHaveBeenCalled()

    state.failProfileFetch = false
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument()
  })

  it('lets the user sign out from the error screen', async () => {
    state.session = makeSession()
    state.profile = makeProfile()
    state.failProfileFetch = true
    const router = renderApp('/')
    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }))
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })

  it('handles a missing profile on /onboarding too', async () => {
    state.session = makeSession()
    state.profile = null
    const router = renderApp('/onboarding')
    await screen.findByRole('button', { name: 'Sign in' })
    expect(router.state.location.pathname).toBe('/login')
  })
})

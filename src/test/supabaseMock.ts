// In-memory stand-in for `@/lib/supabase`, used via
//   vi.mock('@/lib/supabase', () => import('@/test/supabaseMock'))
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { vi } from 'vitest'
import type { Profile } from '@/features/account/api'

type AuthResult = { data: { session: Session | null }; error: unknown }
type Listener = (event: AuthChangeEvent, session: Session | null) => void

export const state: {
  session: Session | null
  profile: Profile | null
  failProfileUpdate: boolean
  updates: { table: string; patch: unknown; filters: Record<string, unknown> }[]
  listeners: Set<Listener>
} = { session: null, profile: null, failProfileUpdate: false, updates: [], listeners: new Set() }

export function makeSession(userId = 'user-1'): Session {
  return {
    access_token: 'token',
    refresh_token: 'refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: { id: userId, aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '' },
  }
}

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    display_name: 'Asha Rao',
    email: 'asha@example.com',
    avatar_url: null,
    upi_vpa: null,
    onboarded_at: '2026-10-01T00:00:00Z',
    activity_seen_at: '2026-10-01T00:00:00Z',
    created_at: '2026-10-01T00:00:00Z',
    ...overrides,
  }
}

/** Supabase-style auth error, e.g. authError('invalid_credentials'). */
export function authError(code: string) {
  return { name: 'AuthApiError', message: code, code, status: 400 }
}

export function resetMock() {
  state.session = null
  state.profile = null
  state.failProfileUpdate = false
  state.updates = []
  state.listeners.clear()
  for (const fn of Object.values(supabase.auth)) fn.mockClear()
}

function emit(event: AuthChangeEvent) {
  for (const l of state.listeners) l(event, state.session)
}

function from(table: string) {
  let patch: Record<string, unknown> | null = null
  const filters: Record<string, unknown> = {}
  const run = () => {
    if (table !== 'profiles') return { data: null, error: { message: `no table ${table}` } }
    const matches = state.profile && filters.id === state.profile.id
    if (patch) {
      if (state.failProfileUpdate) return { data: null, error: { message: 'update failed' } }
      state.updates.push({ table, patch, filters: { ...filters } })
      if (matches && state.profile) state.profile = { ...state.profile, ...patch }
    }
    return matches
      ? { data: state.profile, error: null }
      : { data: null, error: { message: 'no rows' } }
  }
  const builder = {
    select: () => builder,
    update: (p: Record<string, unknown>) => ((patch = p), builder),
    eq: (col: string, val: unknown) => ((filters[col] = val), builder),
    single: () => Promise.resolve(run()),
  }
  return builder
}

export const supabase = {
  auth: {
    getSession: vi.fn(() => Promise.resolve({ data: { session: state.session }, error: null })),
    onAuthStateChange: vi.fn((listener: Listener) => {
      state.listeners.add(listener)
      return { data: { subscription: { unsubscribe: () => state.listeners.delete(listener) } } }
    }),
    signInWithOAuth: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    signInWithPassword: vi.fn<(creds: { email: string; password: string }) => Promise<AuthResult>>(
      () => {
        state.session = makeSession()
        emit('SIGNED_IN')
        return Promise.resolve({ data: { session: state.session }, error: null })
      },
    ),
    signUp: vi.fn<(creds: { email: string; password: string }) => Promise<AuthResult>>(() => {
      state.session = makeSession()
      emit('SIGNED_IN')
      return Promise.resolve({ data: { session: state.session }, error: null })
    }),
    resetPasswordForEmail: vi.fn<
      (email: string, opts: { redirectTo: string }) => Promise<{ data: object; error: unknown }>
    >(() => Promise.resolve({ data: {}, error: null })),
    updateUser: vi.fn<(attrs: { password: string }) => Promise<{ data: object; error: unknown }>>(
      () => Promise.resolve({ data: {}, error: null }),
    ),
    signOut: vi.fn(() => {
      state.session = null
      emit('SIGNED_OUT')
      return Promise.resolve({ error: null })
    }),
  },
  from,
}

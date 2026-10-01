import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeProfile, makeSession, resetMock, state } from '@/test/supabaseMock'
import { renderApp } from '@/test/renderApp'
import { NAV_ITEMS } from './nav'

vi.mock('@/lib/supabase', () => import('@/test/supabaseMock'))

beforeEach(() => {
  resetMock()
  state.session = makeSession()
  state.profile = makeProfile()
})

// TabBar and Sidebar both render a "Primary" nav (CSS decides which is visible).
const navs = () => screen.findAllByRole('navigation', { name: 'Primary' })

describe('AppLayout', () => {
  it('renders every nav item in both the tab bar and the sidebar', async () => {
    renderApp('/')
    const all = await navs()
    expect(all).toHaveLength(2)
    for (const nav of all) {
      for (const item of NAV_ITEMS) {
        expect(within(nav).getByRole('link', { name: item.label })).toHaveAttribute('href', item.to)
      }
    }
  })

  it.each(NAV_ITEMS.map((i) => [i.to, i.label] as const))(
    'marks %s (%s) as the active tab',
    async (path, label) => {
      renderApp(path)
      for (const nav of await navs()) {
        expect(within(nav).getByRole('link', { name: label })).toHaveAttribute(
          'aria-current',
          'page',
        )
        const others = within(nav)
          .getAllByRole('link')
          .filter((l) => l.textContent !== label)
        for (const other of others) expect(other).not.toHaveAttribute('aria-current')
      }
    },
  )

  it('navigates when a tab is tapped', async () => {
    const router = renderApp('/')
    const [tabBar] = await navs()
    if (!tabBar) throw new Error('tab bar missing')
    await userEvent.click(within(tabBar).getByRole('link', { name: 'Groups' }))
    expect(router.state.location.pathname).toBe('/groups')
    expect(screen.getByRole('heading', { level: 1, name: 'Groups' })).toBeInTheDocument()
  })

  it('shows the add-expense button linking to /expenses/new', async () => {
    renderApp('/')
    expect(await screen.findByRole('link', { name: 'Add expense' })).toHaveAttribute(
      'href',
      '/expenses/new',
    )
  })

  it('shows a not-found page for unknown routes', async () => {
    renderApp('/does-not-exist')
    expect(await screen.findByRole('heading', { level: 1, name: 'Not found' })).toBeInTheDocument()
  })
})

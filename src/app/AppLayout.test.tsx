import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { NAV_ITEMS } from './nav'
import { routes } from './routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

// TabBar and Sidebar both render a "Primary" nav (CSS decides which is visible).
const navs = () => screen.getAllByRole('navigation', { name: 'Primary' })

describe('AppLayout', () => {
  it('renders every nav item in both the tab bar and the sidebar', () => {
    renderAt('/')
    expect(navs()).toHaveLength(2)
    for (const nav of navs()) {
      for (const item of NAV_ITEMS) {
        expect(within(nav).getByRole('link', { name: item.label })).toHaveAttribute('href', item.to)
      }
    }
  })

  it.each(NAV_ITEMS.map((i) => [i.to, i.label] as const))(
    'marks %s (%s) as the active tab',
    (path, label) => {
      renderAt(path)
      for (const nav of navs()) {
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
    const router = renderAt('/')
    const [tabBar] = navs()
    if (!tabBar) throw new Error('tab bar missing')
    await userEvent.click(within(tabBar).getByRole('link', { name: 'Groups' }))
    expect(router.state.location.pathname).toBe('/groups')
    expect(screen.getByRole('heading', { level: 1, name: 'Groups' })).toBeInTheDocument()
  })

  it('shows the add-expense button linking to /expenses/new', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: 'Add expense' })).toHaveAttribute(
      'href',
      '/expenses/new',
    )
  })

  it('shows a not-found page for unknown routes', () => {
    renderAt('/does-not-exist')
    expect(screen.getByRole('heading', { level: 1, name: 'Not found' })).toBeInTheDocument()
  })
})

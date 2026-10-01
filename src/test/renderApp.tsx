import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/AppProviders'
import { createQueryClient } from '@/app/queryClient'
import { routes } from '@/app/routes'

/** Renders the full app (providers + routes) at `path`. Mock `@/lib/supabase` first. */
export function renderApp(path: string) {
  const client = createQueryClient()
  client.setDefaultOptions({ queries: { retry: false } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <AppProviders client={client}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return router
}

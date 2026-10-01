import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppProviders } from './AppProviders'
import { createQueryClient } from './queryClient'
import { routes } from './routes'

const router = createBrowserRouter(routes)

export function App() {
  const [queryClient] = useState(createQueryClient)
  return (
    <AppProviders client={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

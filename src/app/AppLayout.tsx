import { Outlet } from 'react-router-dom'
import { Fab, Sidebar, TabBar } from '@/components/ui'
import { NAV_ITEMS } from './nav'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh">
      <Sidebar items={NAV_ITEMS} title="Split-Wise" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-[calc(theme(spacing.tab-bar)+env(safe-area-inset-bottom)+88px)] md:px-8 md:pb-24">
        <Outlet />
      </main>
      <Fab to="/expenses/new" label="Add expense" />
      <TabBar items={NAV_ITEMS} />
    </div>
  )
}

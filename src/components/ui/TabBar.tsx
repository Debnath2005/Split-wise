import { NavLink } from 'react-router-dom'
import { Icon } from './Icon'
import type { NavItem } from './nav-types'

/** Bottom navigation for small screens (hidden from `md`). */
export function TabBar({ items }: { items: readonly NavItem[] }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex h-tab-bar max-w-lg items-stretch">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end ?? false}
              className={({ isActive }) =>
                [
                  'flex h-full min-h-tap flex-col items-center justify-center gap-0.5 text-[11px] font-semibold',
                  isActive ? 'text-nav-active-fg' : 'text-muted',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'flex h-7 w-12 items-center justify-center rounded-full',
                      isActive ? 'bg-nav-active' : '',
                    ].join(' ')}
                  >
                    <Icon name={item.icon} width={22} height={22} />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

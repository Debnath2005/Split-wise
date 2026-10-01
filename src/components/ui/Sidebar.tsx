import { NavLink } from 'react-router-dom'
import { Icon } from './Icon'
import type { NavItem } from './nav-types'

/** Left navigation for `md` and wider (hidden below). */
export function Sidebar({ items, title }: { items: readonly NavItem[]; title: string }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-line bg-surface px-3 py-6 md:flex">
      <div className="px-3 text-h3 text-fg">{title}</div>
      <nav aria-label="Primary">
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) =>
                  [
                    'flex min-h-tap items-center gap-3 rounded-control px-3 text-label',
                    isActive
                      ? 'bg-nav-active text-nav-active-fg'
                      : 'hover:bg-nav-active/60 text-muted hover:text-fg',
                  ].join(' ')
                }
              >
                <Icon name={item.icon} width={20} height={20} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

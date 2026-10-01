import { Link } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

type FabProps = { to: string; label: string; icon?: IconName }

/** Floating primary action. Sits above the TabBar on mobile, bottom-right on desktop. */
export function Fab({ to, label, icon = 'plus' }: FabProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="fixed bottom-[calc(theme(spacing.tab-bar)+env(safe-area-inset-bottom)+16px)] right-4 z-30 flex h-14 min-w-14 items-center justify-center gap-2 rounded-full bg-primary px-4 text-label text-ink shadow-overlay hover:bg-primary-strong hover:text-white md:bottom-8 md:right-8"
    >
      <Icon name={icon} />
      <span className="hidden md:inline">{label}</span>
    </Link>
  )
}

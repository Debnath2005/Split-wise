import type { NavItem } from '@/components/ui'

export const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/groups', label: 'Groups', icon: 'groups' },
  { to: '/friends', label: 'Friends', icon: 'friends' },
  { to: '/activity', label: 'Activity', icon: 'activity' },
  { to: '/account', label: 'Account', icon: 'account' },
] as const satisfies readonly NavItem[]

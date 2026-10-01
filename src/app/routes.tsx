import type { RouteObject } from 'react-router-dom'
import { AccountPage } from '@/features/account/AccountPage'
import { ActivityPage } from '@/features/activity/ActivityPage'
import { DashboardPage } from '@/features/balances/DashboardPage'
import { AddExpensePage } from '@/features/expenses/AddExpensePage'
import { FriendsPage } from '@/features/friends/FriendsPage'
import { GroupsPage } from '@/features/groups/GroupsPage'
import { AppLayout } from './AppLayout'
import { NotFoundPage } from './NotFoundPage'

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'groups', element: <GroupsPage /> },
      { path: 'friends', element: <FriendsPage /> },
      { path: 'activity', element: <ActivityPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'expenses/new', element: <AddExpensePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

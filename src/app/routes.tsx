import type { RouteObject } from 'react-router-dom'
import { AccountPage } from '@/features/account/AccountPage'
import { OnboardingPage } from '@/features/account/OnboardingPage'
import { ActivityPage } from '@/features/activity/ActivityPage'
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { RequireAuth, RequireOnboarded } from '@/features/auth/guards'
import { LoginPage } from '@/features/auth/LoginPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { DashboardPage } from '@/features/balances/DashboardPage'
import { AddExpensePage } from '@/features/expenses/AddExpensePage'
import { FriendsPage } from '@/features/friends/FriendsPage'
import { GroupsPage } from '@/features/groups/GroupsPage'
import { AppLayout } from './AppLayout'
import { NotFoundPage } from './NotFoundPage'

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        element: <RequireOnboarded />,
        children: [
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
        ],
      },
    ],
  },
]

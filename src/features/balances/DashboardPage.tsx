import { EmptyState, PageHeader } from '@/components/ui'

export function DashboardPage() {
  return (
    <>
      <PageHeader title="Home" />
      <EmptyState title="You're all settled up">Balances arrive in M5.</EmptyState>
    </>
  )
}

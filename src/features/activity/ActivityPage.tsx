import { EmptyState, PageHeader } from '@/components/ui'

export function ActivityPage() {
  return (
    <>
      <PageHeader title="Activity" />
      <EmptyState title="No activity yet">The activity feed arrives in M7.</EmptyState>
    </>
  )
}

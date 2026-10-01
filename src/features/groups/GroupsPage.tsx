import { EmptyState, PageHeader } from '@/components/ui'

export function GroupsPage() {
  return (
    <>
      <PageHeader title="Groups" />
      <EmptyState title="No groups yet">Groups arrive in M4.</EmptyState>
    </>
  )
}

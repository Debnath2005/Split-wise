import { EmptyState, PageHeader } from '@/components/ui'

export function FriendsPage() {
  return (
    <>
      <PageHeader title="Friends" />
      <EmptyState title="No friends yet">Invites arrive in M3.</EmptyState>
    </>
  )
}

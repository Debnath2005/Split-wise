import { Link } from 'react-router-dom'
import { EmptyState, PageHeader } from '@/components/ui'

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Not found" />
      <EmptyState title="This page doesn't exist">
        <Link to="/" className="inline-flex min-h-tap items-center font-semibold text-link">
          Go home
        </Link>
      </EmptyState>
    </>
  )
}

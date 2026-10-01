import type { ReactNode } from 'react'

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-6 text-center">
      <h2 className="text-h3 text-fg">{title}</h2>
      {children && <div className="mt-2 text-small text-muted">{children}</div>}
    </section>
  )
}

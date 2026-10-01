import type { ReactNode } from 'react'

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-4 pb-4 pt-[max(env(safe-area-inset-top),16px)] md:pt-8">
      <h1 className="text-h2 text-fg md:text-h1">{title}</h1>
      {actions}
    </header>
  )
}

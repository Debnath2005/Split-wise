import type { ReactNode } from 'react'

/** Inline error message for a form or screen. */
export function Alert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-control border border-danger px-3 py-2 text-small text-danger"
    >
      {children}
    </p>
  )
}

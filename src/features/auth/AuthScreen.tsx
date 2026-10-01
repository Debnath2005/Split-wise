import type { ReactNode } from 'react'

/** Full-screen, nav-less layout shared by the sign-in / password screens. */
export function AuthScreen({
  title,
  intro,
  children,
}: {
  title: string
  intro?: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-[max(env(safe-area-inset-bottom),24px)] pt-[max(env(safe-area-inset-top),48px)]">
      <h1 className="text-h1 text-fg">{title}</h1>
      {intro && <p className="mt-3 text-body text-muted">{intro}</p>}
      <div className="mt-8 flex flex-1 flex-col">{children}</div>
    </main>
  )
}

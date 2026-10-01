/** Only same-origin absolute paths are allowed as post-login destinations. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/'
  const authPages = ['/login', '/auth/callback', '/forgot-password', '/reset-password']
  if (
    authPages.some(
      (page) => next === page || next.startsWith(`${page}?`) || next.startsWith(`${page}/`),
    )
  )
    return '/'
  return next
}

const KEY = 'auth.next'

export function rememberNext(next: string) {
  try {
    sessionStorage.setItem(KEY, safeNext(next))
  } catch {
    // storage unavailable (private mode); fall back to "/"
  }
}

export function takeNext(): string {
  try {
    const value = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    return safeNext(value)
  } catch {
    return '/'
  }
}

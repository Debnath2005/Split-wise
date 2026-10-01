type SpinnerProps = { size?: number; label?: string; fullPage?: boolean }

/** Loading indicator. Pass `label=""` when the surrounding control already announces state. */
export function Spinner({ size = 24, label = 'Loading', fullPage = false }: SpinnerProps) {
  const svg = (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="animate-spin motion-reduce:animate-none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
  const content = label ? (
    <span role="status" className="inline-flex items-center gap-2 text-muted">
      {svg}
      <span className="sr-only">{label}</span>
    </span>
  ) : (
    svg
  )
  if (!fullPage) return content
  return <div className="flex min-h-dvh items-center justify-center">{content}</div>
}

import { useState } from 'react'

type AvatarProps = { name: string; src?: string | null | undefined; size?: number }

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? '?'
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

export function Avatar({ name, src, size = 40 }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const style = { width: size, height: size }

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        style={style}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full object-cover"
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      style={{ ...style, fontSize: Math.round(size * 0.4) }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-ink"
    >
      {initials(name)}
    </span>
  )
}

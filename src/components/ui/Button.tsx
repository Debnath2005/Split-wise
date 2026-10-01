import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'danger' | 'link'

const variants: Record<Variant, string> = {
  primary:
    'border-primary bg-primary text-ink hover:border-primary-strong hover:bg-primary-strong hover:text-white',
  secondary: 'border-control-border bg-surface text-fg hover:bg-nav-active',
  danger: 'border-danger bg-surface text-danger hover:bg-danger hover:text-white',
  link: 'border-transparent bg-transparent px-1 text-link underline-offset-2 hover:underline',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'inline-flex min-h-tap items-center justify-center gap-2 rounded-control border px-4 text-label transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading && <Spinner size={18} label="" />}
      {children}
    </button>
  )
}

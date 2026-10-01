import { forwardRef, useId, type InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string | undefined
  error?: string | undefined
}

/** Labelled text input. 16px text so iOS does not zoom on focus. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, id, className = '', ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={['flex flex-col gap-1.5', className].join(' ')}>
      <label htmlFor={inputId} className="text-label text-fg">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          'min-h-tap w-full rounded-control border bg-surface px-3 text-body text-fg placeholder:text-muted',
          'focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,237,100,0.14)] focus:outline-none focus-visible:ring-0',
          error ? 'border-danger' : 'border-control-border',
        ].join(' ')}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-small text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      )}
    </div>
  )
})

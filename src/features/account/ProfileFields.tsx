import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { TextField } from '@/components/ui'
import type { ProfileForm } from './profileSchema'

type Props = { register: UseFormRegister<ProfileForm>; errors: FieldErrors<ProfileForm> }

export function ProfileFields({ register, errors }: Props) {
  return (
    <>
      <TextField
        label="Your name"
        autoComplete="name"
        error={errors.displayName?.message}
        {...register('displayName')}
      />
      <TextField
        label="UPI ID (optional)"
        hint="Friends use this to pay you through any UPI app."
        placeholder="name@okaxis"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        inputMode="email"
        error={errors.upiVpa?.message}
        {...register('upiVpa')}
      />
    </>
  )
}

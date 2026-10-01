import { z } from 'zod'

// SPEC §4.6 VPA format; local part 2–256 chars.
const VPA_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$/

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter your name').max(60, 'Keep it under 60 characters'),
  upiVpa: z
    .string()
    .trim()
    .refine((v) => v === '' || VPA_RE.test(v), 'Enter a valid UPI ID, like name@okaxis'),
})

export type ProfileForm = z.infer<typeof profileSchema>

/** Form values → profile columns. An empty UPI ID is stored as null. */
export function toProfilePatch(values: ProfileForm) {
  return { display_name: values.displayName, upi_vpa: values.upiVpa === '' ? null : values.upiVpa }
}

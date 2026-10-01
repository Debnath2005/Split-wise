import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('Enter a valid email address')

// 72 is bcrypt's input limit; 8 matches the Supabase minimum_password_length.
const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
})

export const signUpSchema = z.object({ email, password: newPassword })

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  })

export type SignInForm = z.infer<typeof signInSchema>
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

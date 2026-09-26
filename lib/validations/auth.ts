import { z } from "zod"

const passwordSchema = z
  .string()
  .min(8, { error: "Password must be at least 8 characters." })

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, { error: "Enter your email or username." }),
  password: passwordSchema,
})

export type LoginValues = z.infer<typeof loginSchema>

export const merchantLoginSchema = z.object({
  email: z.email({ error: "Enter a valid email." }),
  password: passwordSchema,
  fullName: z.string().trim().min(1, { error: "Enter a name." }),
  merchantId: z.uuid({ error: "Choose a merchant." }),
})

export const adminLoginSchema = z.object({
  email: z.email({ error: "Enter a valid email." }),
  password: passwordSchema,
  fullName: z.string().trim().min(1, { error: "Enter a name." }),
})

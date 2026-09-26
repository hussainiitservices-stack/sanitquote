import { z } from "zod"

export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    error: "Use lowercase letters, numbers, and hyphens.",
  })

export const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
  error: "Use a hex color such as #123c3e.",
})

export const moneySchema = z.number().nonnegative()

import { z } from "zod"

import { hexColorSchema, slugSchema } from "@/lib/validations/common"

const optionalEmail = z.union([
  z.literal(""),
  z.email({ error: "Enter a valid email." }),
])

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  error: "Choose a date.",
})

export const merchantFormSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2, { error: "Enter the showroom name." }),
    username: slugSchema.min(3, { error: "Use at least 3 characters." }),
    password: z.string(),
    status: z.enum(["active", "suspended"]),
    subscriptionStartsOn: dateField,
    subscriptionEndsOn: dateField,
    contactEmail: optionalEmail,
    contactPhone: z.string().trim().max(30),
    displayName: z.string().trim().min(2, { error: "Enter the name printed on quotations." }),
    tagline: z.string().trim().max(140),
    primaryColor: hexColorSchema,
    secondaryColor: hexColorSchema,
    accentColor: hexColorSchema,
    address: z.string().trim().max(240),
    city: z.string().trim().max(80),
    state: z.string().trim().max(80),
    pincode: z.string().trim().max(12),
    phone: z.string().trim().max(30),
    email: optionalEmail,
    website: z.string().trim().max(200),
    gstin: z.string().trim().max(20),
    footerNote: z.string().trim().max(500),
    terms: z.string().trim().max(2000),
  })
  .superRefine((value, ctx) => {
    const creating = !value.id
    if (creating && value.password.trim().length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Password must be at least 8 characters.",
      })
    }
    if (!creating && value.password.trim() && value.password.trim().length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Password must be at least 8 characters.",
      })
    }
    if (value.subscriptionEndsOn < value.subscriptionStartsOn) {
      ctx.addIssue({
        code: "custom",
        path: ["subscriptionEndsOn"],
        message: "The end date must be on or after the start date.",
      })
    }
  })

export type MerchantFormValues = z.infer<typeof merchantFormSchema>

export const companyFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, { error: "Enter the brand name." }),
  slug: slugSchema,
  description: z.string().trim().max(500),
  isActive: z.enum(["true", "false"]),
})

export type CompanyFormValues = z.infer<typeof companyFormSchema>

export const productFormSchema = z.object({
  id: z.string().optional(),
  companyId: z.uuid({ error: "Choose a brand." }),
  sku: z.string().trim().min(1, { error: "Enter a SKU." }).max(60),
  name: z.string().trim().min(2, { error: "Enter the product name." }),
  description: z.string().trim().max(1000),
  category: z.string().trim().max(80),
  finish: z.string().trim().max(80),
  unit: z.string().trim().min(1, { error: "Enter a unit." }).max(20),
  hsnCode: z.string().trim().max(20),
  listPrice: z
    .string()
    .trim()
    .refine((value) => {
      const amount = Number(value)
      return Number.isFinite(amount) && amount >= 0
    }, { error: "Enter a price of zero or more." }),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, { error: "Use a 3-letter currency code." }),
  details: z.string().trim().max(1000),
  isActive: z.enum(["true", "false"]),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const settingsFormSchema = z.object({
  platformName: z.string().trim().min(2, { error: "Enter the platform name." }),
  supportEmail: optionalEmail,
  defaultCurrency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, { error: "Use a 3-letter currency code." }),
  defaultTaxRate: z
    .string()
    .trim()
    .refine((value) => {
      const amount = Number(value)
      return Number.isFinite(amount) && amount >= 0 && amount <= 100
    }, { error: "Enter a tax rate from 0 to 100." }),
})

export type SettingsFormValues = z.infer<typeof settingsFormSchema>

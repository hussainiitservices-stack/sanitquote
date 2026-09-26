import { z } from "zod"

import { hexColorSchema } from "@/lib/validations/common"

const optionalEmail = z.union([
  z.literal(""),
  z.email({ error: "Enter a valid email." }),
])

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  error: "Choose a date.",
})

const amountField = z
  .string()
  .trim()
  .refine((value) => {
    const amount = Number(value)
    return Number.isFinite(amount) && amount >= 0
  }, { error: "Enter an amount of zero or more." })

const quantityField = z
  .string()
  .trim()
  .refine((value) => {
    const amount = Number(value)
    return Number.isFinite(amount) && amount > 0
  }, { error: "Enter a quantity greater than zero." })

const taxField = z
  .string()
  .trim()
  .refine((value) => {
    const amount = Number(value)
    return Number.isFinite(amount) && amount >= 0 && amount <= 100
  }, { error: "Enter a tax rate from 0 to 100." })

export const clientFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, { error: "Enter the client name." }),
  phone: z.string().trim().max(30),
  email: optionalEmail,
  address: z.string().trim().max(240),
  city: z.string().trim().max(80),
  state: z.string().trim().max(80),
  pincode: z.string().trim().max(12),
  gstin: z.string().trim().max(20),
  notes: z.string().trim().max(1000),
})

export type ClientFormValues = z.infer<typeof clientFormSchema>

export const showroomSettingsSchema = z.object({
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

export type ShowroomSettingsValues = z.infer<typeof showroomSettingsSchema>

export const quotationLineSchema = z.object({
  productId: z.uuid({ error: "Choose a product." }),
  quantity: quantityField,
  unitPrice: amountField,
  discountAmount: amountField,
  taxRate: taxField,
})

const quotationHeaderFields = z.object({
  id: z.string().optional(),
  clientId: z.uuid({ error: "Choose a client." }),
  siteAddress: z.string().trim().max(240),
  issueDate: dateField,
  validUntil: z.union([z.literal(""), dateField]),
  notes: z.string().trim().max(2000),
  terms: z.string().trim().max(2000),
})

function refineQuoteDates(
  value: { issueDate: string; validUntil: string },
  ctx: z.RefinementCtx,
) {
  if (value.validUntil && value.validUntil < value.issueDate) {
    ctx.addIssue({
      code: "custom",
      path: ["validUntil"],
      message: "Valid until must be on or after the issue date.",
    })
  }
}

export const quotationHeaderSchema = quotationHeaderFields.superRefine(refineQuoteDates)

export const quotationFormSchema = quotationHeaderFields
  .extend({
    items: z.array(quotationLineSchema).min(1, { error: "Add at least one product." }),
  })
  .superRefine(refineQuoteDates)

export type QuotationFormValues = z.infer<typeof quotationFormSchema>
export type QuotationHeaderValues = z.infer<typeof quotationHeaderSchema>

export const quotationStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired", "cancelled"]),
})

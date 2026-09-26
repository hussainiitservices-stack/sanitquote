import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { adminLoginSchema, merchantLoginSchema } from "@/lib/validations/auth"

export async function createAdminLogin(input: {
  email: string
  password: string
  fullName: string
}) {
  const parsed = adminLoginSchema.parse(input)
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.email,
    password: parsed.password,
    email_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: { full_name: parsed.fullName },
  })

  if (error) throw error
  return data.user
}

export async function createMerchantLogin(input: {
  email: string
  password: string
  fullName: string
  merchantId: string
}) {
  const parsed = merchantLoginSchema.parse(input)
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.email,
    password: parsed.password,
    email_confirm: true,
    app_metadata: {
      role: "merchant",
      merchant_id: parsed.merchantId,
    },
    user_metadata: { full_name: parsed.fullName },
  })

  if (error) throw error
  return data.user
}

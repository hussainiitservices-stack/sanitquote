import "server-only"

import { requireMerchant } from "@/lib/auth/guards"
import { getMerchantWorkspace } from "@/lib/data/merchants"
import { createClient } from "@/lib/supabase/server"

export async function merchantDb() {
  const user = await requireMerchant()
  const supabase = await createClient()
  const workspace = await getMerchantWorkspace(user.merchantId)
  if (!workspace) {
    throw new Error("Could not load the merchant workspace.")
  }
  return { supabase, user, workspace }
}

export function writeBlocked(subscriptionActive: boolean): { ok: false; message: string } | null {
  if (subscriptionActive) return null
  return {
    ok: false,
    message: "This subscription is not active, so records cannot be changed.",
  }
}

export function formatAddress(
  parts: Array<string | null | undefined>,
) {
  const value = parts.map((part) => part?.trim()).filter(Boolean).join(", ")
  return value || null
}

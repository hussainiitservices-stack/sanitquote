import "server-only"

import { unstable_rethrow } from "next/navigation"
import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import type { SessionUser, UserRole } from "@/types/domain"

const ROLES: UserRole[] = ["admin", "merchant", "pending"]

function isUserRole(value: string): value is UserRole {
  return ROLES.includes(value as UserRole)
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, merchant_id")
      .eq("id", data.user.id)
      .maybeSingle()

    if (profileError || !profile || !isUserRole(profile.role)) {
      if (profileError) {
        console.error("profile lookup failed", profileError.code)
      }
      return null
    }

    return {
      id: profile.id,
      email: profile.email ?? data.user.email ?? "",
      fullName: profile.full_name,
      role: profile.role,
      merchantId: profile.merchant_id,
    }
  } catch (error) {
    unstable_rethrow(error)
    const message = error instanceof Error ? error.message : ""
    if (!message.includes("Missing Supabase")) {
      console.error("session lookup failed")
    }
    return null
  }
})

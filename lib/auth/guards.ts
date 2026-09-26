import "server-only"

import { redirect } from "next/navigation"

import { homeForRole } from "@/lib/auth/paths"
import { getSessionUser } from "@/lib/auth/session"
import type { SessionUser } from "@/types/domain"

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role === "admin") return user
  redirect(homeForRole(user.role))
}

export async function requireMerchant(): Promise<
  SessionUser & { merchantId: string }
> {
  const user = await requireUser()
  if (user.role === "merchant" && user.merchantId) {
    return { ...user, merchantId: user.merchantId }
  }
  redirect(homeForRole(user.role))
}

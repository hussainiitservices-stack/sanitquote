import "server-only"

import { jsonError } from "@/lib/api/http"
import { getSessionUser } from "@/lib/auth/session"
import type { SessionUser } from "@/types/domain"

export async function withSession(
  handler: (user: SessionUser) => Promise<Response>,
) {
  const user = await getSessionUser()
  if (!user) return jsonError("Sign in required.", 401, "unauthorized")
  return handler(user)
}

export async function withRole(
  role: "admin" | "merchant",
  handler: (user: SessionUser) => Promise<Response>,
) {
  return withSession(async (user) => {
    if (user.role !== role) {
      return jsonError("You cannot open this resource.", 403, "forbidden")
    }
    return handler(user)
  })
}

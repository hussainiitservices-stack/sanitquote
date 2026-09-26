import type { UserRole } from "@/types/domain"

const HOMES = {
  admin: "/admin",
  merchant: "/merchant",
  pending: "/account-pending",
} as const

export function homeForRole(role: UserRole) {
  return HOMES[role]
}

export function safeNextPath(next: string | undefined, role: Exclude<UserRole, "pending">) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return HOMES[role]
  }

  const prefix = HOMES[role]
  if (next === prefix || next.startsWith(`${prefix}/`)) return next
  return HOMES[role]
}

import type {
  MerchantStatus,
  QuotationStatus,
  UserRole,
} from "@/types/database"

export type { MerchantStatus, QuotationStatus, UserRole }

export type SessionUser = {
  id: string
  email: string
  fullName: string
  role: UserRole
  merchantId: string | null
}

export type MerchantBrandingSummary = {
  displayName: string
  logoPath: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

export type MerchantWorkspace = {
  id: string
  name: string
  slug: string
  status: MerchantStatus
  subscriptionStartsOn: string
  subscriptionEndsOn: string
  subscriptionActive: boolean
  branding: MerchantBrandingSummary | null
}

import type { MerchantStatus } from "@/types/domain"

type SubscriptionWindow = {
  status: MerchantStatus
  subscriptionStartsOn: string
  subscriptionEndsOn: string
}

function todayIso(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

/**
 * Mirrors public.merchant_subscription_active. Keep the date comparison in UTC
 * date form so the app banner and the database policy agree.
 */
export function isSubscriptionActive(
  merchant: SubscriptionWindow,
  now = new Date(),
) {
  if (merchant.status !== "active") return false
  const today = todayIso(now)
  return (
    merchant.subscriptionStartsOn <= today &&
    merchant.subscriptionEndsOn >= today
  )
}

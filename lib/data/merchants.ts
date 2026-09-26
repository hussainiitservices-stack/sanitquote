import "server-only"

import { cache } from "react"

import { isSubscriptionActive } from "@/lib/domain/subscription"
import { createClient } from "@/lib/supabase/server"
import type { MerchantWorkspace } from "@/types/domain"

export const getMerchantWorkspace = cache(
  async (merchantId: string): Promise<MerchantWorkspace | null> => {
    const supabase = await createClient()
    const { data: merchant, error } = await supabase
      .from("merchants")
      .select(
        "id, name, slug, status, subscription_starts_on, subscription_ends_on",
      )
      .eq("id", merchantId)
      .maybeSingle()

    if (error) {
      console.error("merchant lookup failed", error.code)
      throw new Error("Could not load the merchant workspace.")
    }

    if (!merchant) return null

    const { data: branding, error: brandingError } = await supabase
      .from("merchant_branding")
      .select(
        "display_name, logo_path, primary_color, secondary_color, accent_color",
      )
      .eq("merchant_id", merchantId)
      .maybeSingle()

    if (brandingError) {
      console.error("branding lookup failed", brandingError.code)
      throw new Error("Could not load merchant branding.")
    }

    const workspace: MerchantWorkspace = {
      id: merchant.id,
      name: merchant.name,
      slug: merchant.slug,
      status: merchant.status,
      subscriptionStartsOn: merchant.subscription_starts_on,
      subscriptionEndsOn: merchant.subscription_ends_on,
      subscriptionActive: false,
      branding: branding
        ? {
            displayName: branding.display_name,
            logoPath: branding.logo_path,
            primaryColor: branding.primary_color,
            secondaryColor: branding.secondary_color,
            accentColor: branding.accent_color,
          }
        : null,
    }

    workspace.subscriptionActive = isSubscriptionActive({
      status: workspace.status,
      subscriptionStartsOn: workspace.subscriptionStartsOn,
      subscriptionEndsOn: workspace.subscriptionEndsOn,
    })

    return workspace
  },
)

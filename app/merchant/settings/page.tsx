import type { Metadata } from "next"

import { ShowroomSettingsForm } from "@/components/merchant/settings-form"
import { PageHeader } from "@/components/layout/page-header"
import { getShowroomSettings } from "@/lib/merchant/queries"
import { publicObjectUrl, STORAGE_BUCKETS } from "@/lib/storage/buckets"

export const metadata: Metadata = { title: "Branding" }

export default async function MerchantSettingsPage() {
  const settings = await getShowroomSettings()

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Showroom details"
        description="Name, logo, colors, and terms are copied onto each new quotation. Subscription dates stay with the administrator."
      />
      <ShowroomSettingsForm
        logoUrl={
          settings.logoPath
            ? publicObjectUrl(STORAGE_BUCKETS.merchantLogos, settings.logoPath)
            : null
        }
        values={{
          displayName: settings.displayName,
          tagline: settings.tagline,
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor,
          accentColor: settings.accentColor,
          address: settings.address,
          city: settings.city,
          state: settings.state,
          pincode: settings.pincode,
          phone: settings.phone,
          email: settings.email,
          website: settings.website,
          gstin: settings.gstin,
          footerNote: settings.footerNote,
          terms: settings.terms,
        }}
      />
    </div>
  )
}

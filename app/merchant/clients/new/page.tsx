import type { Metadata } from "next"

import { ClientForm } from "@/components/merchant/client-form"
import { PageHeader } from "@/components/layout/page-header"
import { getMerchantWorkspace } from "@/lib/data/merchants"
import { requireMerchant } from "@/lib/auth/guards"

export const metadata: Metadata = { title: "New client" }

export default async function NewClientPage() {
  const user = await requireMerchant()
  const workspace = await getMerchantWorkspace(user.merchantId)

  return (
    <div className="grid gap-5">
      <PageHeader title="New client" description="This record stays in this showroom." />
      <ClientForm
        canWrite={Boolean(workspace?.subscriptionActive)}
        values={{
          name: "",
          phone: "",
          email: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          gstin: "",
          notes: "",
        }}
      />
    </div>
  )
}

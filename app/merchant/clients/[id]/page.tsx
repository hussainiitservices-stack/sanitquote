import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ClientForm } from "@/components/merchant/client-form"
import { PageHeader } from "@/components/layout/page-header"
import { getMerchantWorkspace } from "@/lib/data/merchants"
import { requireMerchant } from "@/lib/auth/guards"
import { getClient } from "@/lib/merchant/queries"

export const metadata: Metadata = { title: "Client" }

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireMerchant()
  const [client, workspace] = await Promise.all([
    getClient(id),
    getMerchantWorkspace(user.merchantId),
  ])
  if (!client) notFound()
  const canWrite = Boolean(workspace?.subscriptionActive)

  return (
    <div className="grid gap-5">
      <PageHeader title={client.name} description="Client details are copied onto a quotation when you create it." />
      <ClientForm
        canWrite={canWrite}
        values={{
          id: client.id,
          name: client.name,
          phone: client.phone ?? "",
          email: client.email ?? "",
          address: client.address ?? "",
          city: client.city ?? "",
          state: client.state ?? "",
          pincode: client.pincode ?? "",
          gstin: client.gstin ?? "",
          notes: client.notes ?? "",
        }}
      />
    </div>
  )
}

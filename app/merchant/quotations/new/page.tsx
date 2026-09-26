import type { Metadata } from "next"
import Link from "next/link"

import { EmptyState } from "@/components/admin/empty-state"
import { QuotationEditor } from "@/components/merchant/quotation-editor"
import { PageHeader } from "@/components/layout/page-header"
import { getMerchantWorkspace } from "@/lib/data/merchants"
import { requireMerchant } from "@/lib/auth/guards"
import {
  getPlatformDefaults,
  getShowroomSettings,
  listClientOptions,
} from "@/lib/merchant/queries"

export const metadata: Metadata = { title: "New quotation" }

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export default async function NewQuotationPage() {
  const user = await requireMerchant()
  const [clients, defaults, settings, workspace] = await Promise.all([
    listClientOptions(),
    getPlatformDefaults(),
    getShowroomSettings(),
    getMerchantWorkspace(user.merchantId),
  ])

  const start = new Date()
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 30)

  return (
    <div className="grid gap-5">
      <PageHeader
        title="New quotation"
        description="Pick a client, add a site address, then add products and save a draft."
      />
      {clients.length === 0 ? (
        <EmptyState
          title="Add a client first"
          description="A quotation needs someone to bill."
          href="/merchant/clients/new"
          action="Add client"
        />
      ) : (
        <QuotationEditor
          canWrite={Boolean(workspace?.subscriptionActive)}
          clients={clients}
          currency={defaults.currency}
          defaultTaxRate={String(defaults.taxRate)}
          values={{
            clientId: clients[0]?.id ?? "",
            siteAddress: "",
            issueDate: isoDate(start),
            validUntil: isoDate(end),
            notes: "",
            terms: settings.terms,
            items: [],
          }}
        />
      )}
      {clients.length === 0 ? null : (
        <p className="text-sm text-muted-foreground">
          Need another client?{" "}
          <Link href="/merchant/clients/new" className="font-medium text-primary">
            Add one
          </Link>
          .
        </p>
      )}
    </div>
  )
}

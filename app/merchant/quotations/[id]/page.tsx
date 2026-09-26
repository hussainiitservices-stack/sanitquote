import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { QuotationStatusBadge } from "@/components/admin/status-badge"
import { QuotationEditor } from "@/components/merchant/quotation-editor"
import { QuotationTools } from "@/components/merchant/quotation-tools"
import { PageHeader } from "@/components/layout/page-header"
import { getMerchantWorkspace } from "@/lib/data/merchants"
import { requireMerchant } from "@/lib/auth/guards"
import { quotationIsFrozen } from "@/lib/domain/quotations"
import { formatDate } from "@/lib/format/date"
import { formatMoney } from "@/lib/format/money"
import {
  getMerchantQuotation,
  getPlatformDefaults,
  listClientOptions,
} from "@/lib/merchant/queries"

export const metadata: Metadata = { title: "Quotation" }

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireMerchant()
  const [record, workspace] = await Promise.all([
    getMerchantQuotation(id),
    getMerchantWorkspace(user.merchantId),
  ])
  if (!record) notFound()

  const canWrite = Boolean(workspace?.subscriptionActive)
  const frozen = quotationIsFrozen(record.status)

  if (!frozen) {
    const [clients, defaults] = await Promise.all([
      listClientOptions(),
      getPlatformDefaults(),
    ])
    return (
      <div className="grid gap-5">
        <PageHeader
          title={record.number}
          description="This draft can still change. Saving copies the latest client, site address, and product names."
          action={<QuotationStatusBadge status={record.status} />}
        />
        <QuotationTools id={record.id} number={record.number} status={record.status} canWrite={canWrite} />
        <QuotationEditor
          canWrite={canWrite}
          clients={clients}
          currency={record.currency || defaults.currency}
          defaultTaxRate={String(defaults.taxRate)}
          lines={record.items.map((item) => ({
            productId: item.productId ?? "",
            productName: item.productName,
            companyName: item.companyName,
            sku: item.sku ?? "",
            unit: item.unit,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            discountAmount: String(item.discountAmount),
            taxRate: String(item.taxRate),
          }))}
          values={{
            id: record.id,
            clientId: record.clientId ?? clients[0]?.id ?? "",
            siteAddress: record.siteAddress ?? "",
            issueDate: record.issueDate,
            validUntil: record.validUntil ?? "",
            notes: record.notes,
            terms: record.terms,
            items: record.items
              .filter((item) => item.productId)
              .map((item) => ({
                productId: item.productId as string,
                quantity: String(item.quantity),
                unitPrice: String(item.unitPrice),
                discountAmount: String(item.discountAmount),
                taxRate: String(item.taxRate),
              })),
          }}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        title={record.number}
        description={`Issued ${formatDate(record.issueDate)}`}
        action={<QuotationStatusBadge status={record.status} />}
      />
      <QuotationTools id={record.id} number={record.number} status={record.status} canWrite={canWrite} />
      <section className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Client</h2>
          <p className="mt-1 text-sm font-medium">{record.clientName}</p>
          {record.siteAddress ? <p className="text-sm text-muted-foreground">{record.siteAddress}</p> : null}
        </div>
        <div>
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Validity</h2>
          <p className="mt-1 text-sm">{record.validUntil ? formatDate(record.validUntil) : "No end date"}</p>
        </div>
      </section>
      <ul className="grid gap-2">
        {record.items.map((item) => (
          <li key={item.id} className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{item.productName}</p>
                <p className="text-sm text-muted-foreground">
                  {item.companyName}
                  {item.sku ? ` · ${item.sku}` : ""}
                </p>
              </div>
              <p className="text-sm font-medium">{formatMoney(item.lineTotal, record.currency)}</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {item.quantity} {item.unit} × {formatMoney(item.unitPrice, record.currency)}
            </p>
          </li>
        ))}
      </ul>
      <dl className="grid gap-2 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{formatMoney(record.totals.subtotal, record.currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Discount</dt>
          <dd>{formatMoney(record.totals.discount, record.currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Tax</dt>
          <dd>{formatMoney(record.totals.tax, record.currency)}</dd>
        </div>
        <div className="flex justify-between text-base font-medium">
          <dt>Total</dt>
          <dd>{formatMoney(record.totals.grandTotal, record.currency)}</dd>
        </div>
      </dl>
      {record.notes ? <p className="text-sm text-muted-foreground">{record.notes}</p> : null}
    </div>
  )
}

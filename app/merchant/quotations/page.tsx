import type { Metadata } from "next"
import Link from "next/link"

import { EmptyState } from "@/components/admin/empty-state"
import { Pager } from "@/components/admin/pager"
import { QuotationStatusBadge } from "@/components/admin/status-badge"
import { SelectField } from "@/components/forms/select-field"
import { TextField } from "@/components/forms/text-field"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { getMerchantWorkspace } from "@/lib/data/merchants"
import { requireMerchant } from "@/lib/auth/guards"
import { QUOTATION_STATUSES } from "@/lib/domain/quotations"
import { formatDate } from "@/lib/format/date"
import { formatMoney } from "@/lib/format/money"
import { listMerchantQuotations } from "@/lib/merchant/queries"

export const metadata: Metadata = { title: "Quotations" }

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>
}) {
  const user = await requireMerchant()
  const params = await searchParams
  const [result, workspace] = await Promise.all([
    listMerchantQuotations(params),
    getMerchantWorkspace(user.merchantId),
  ])
  const canWrite = Boolean(workspace?.subscriptionActive)
  const filtered = Boolean(params.q || params.status)

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Quotations"
        description="Each quote stores the client, site address, branding, and line prices from the moment it is saved."
        action={
          canWrite ? (
            <Button asChild className="h-11">
              <Link href="/merchant/quotations/new">New quotation</Link>
            </Button>
          ) : undefined
        }
      />
      <form action="/merchant/quotations" className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <TextField label="Search" name="q" defaultValue={params.q ?? ""} placeholder="Number or client" />
        <SelectField label="Status" name="status" defaultValue={params.status ?? ""}>
          <option value="">All</option>
          {QUOTATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </SelectField>
        <Button type="submit" variant="secondary" className="h-11">
          Search
        </Button>
      </form>
      {result.rows.length === 0 ? (
        <EmptyState
          title={filtered ? "No quotations match" : "No quotations yet"}
          description={filtered ? "Try another status or number." : "Create a draft from a client and the catalog."}
          href={filtered || !canWrite ? undefined : "/merchant/quotations/new"}
          action={filtered || !canWrite ? undefined : "New quotation"}
        />
      ) : (
        <ul className="grid gap-2">
          {result.rows.map((quote) => (
            <li key={quote.id}>
              <Link
                href={`/merchant/quotations/${quote.id}`}
                className="grid gap-1 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{quote.number}</span>
                  <QuotationStatusBadge status={quote.status} />
                </span>
                <span className="text-sm text-muted-foreground">
                  {quote.clientName}
                  {quote.siteAddress ? ` · ${quote.siteAddress}` : ""}
                </span>
                <span className="flex items-center justify-between text-sm">
                  <span>{formatDate(quote.issueDate)}</span>
                  <span className="font-medium">{formatMoney(quote.total, quote.currency)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pager
        page={result.page}
        pageCount={result.pageCount}
        path="/merchant/quotations"
        params={{ q: params.q, status: params.status }}
      />
    </div>
  )
}

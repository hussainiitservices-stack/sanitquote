import type { Metadata } from "next"
import Link from "next/link"

import { QuotationStatusBadge } from "@/components/admin/status-badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getMerchantDashboard } from "@/lib/merchant/queries"
import { getMerchantWorkspace } from "@/lib/data/merchants"
import { requireMerchant } from "@/lib/auth/guards"
import { formatDate } from "@/lib/format/date"
import { formatMoney } from "@/lib/format/money"

export const metadata: Metadata = { title: "Showroom" }

export default async function MerchantHomePage() {
  const user = await requireMerchant()
  const [stats, workspace] = await Promise.all([
    getMerchantDashboard(),
    getMerchantWorkspace(user.merchantId),
  ])

  const cards = [
    { href: "/merchant/quotations", label: "Quotations", value: stats.quotations, note: `${stats.drafts} drafts` },
    { href: "/merchant/clients", label: "Clients", value: stats.clients, note: "People you quote for" },
    { href: "/merchant/catalog", label: "Brands", value: stats.companies, note: "Enabled for this showroom" },
  ]

  return (
    <div className="grid gap-5">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight break-words">
          {workspace?.branding?.displayName || workspace?.name || "Showroom"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Build a quote from the catalog, then share the PDF from your phone.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Card className="h-full">
              <CardHeader>
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="text-3xl">{card.value}</CardTitle>
                <CardDescription>{card.note}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Recent quotations</h2>
          <Link href="/merchant/quotations" className="text-sm font-medium text-primary">
            View all
          </Link>
        </div>
        {stats.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quotations yet.</p>
        ) : (
          <ul className="grid gap-2">
            {stats.recent.map((quote) => (
              <li key={quote.id}>
                <Link
                  href={`/merchant/quotations/${quote.id}`}
                  className="grid min-w-0 gap-1 overflow-hidden rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
                >
                  <span className="flex min-w-0 items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium">{quote.number}</span>
                    <QuotationStatusBadge status={quote.status} />
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {quote.clientName} · {formatDate(quote.issueDate)}
                  </span>
                  <span className="text-sm">{formatMoney(quote.total, quote.currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

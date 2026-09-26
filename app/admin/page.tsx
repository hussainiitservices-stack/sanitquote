import type { Metadata } from "next";
import Link from "next/link";

import { QuotationStatusBadge } from "@/components/admin/status-badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard } from "@/lib/admin/queries";
import { formatMoney } from "@/lib/format/money";
import { formatDate } from "@/lib/format/date";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminHomePage() {
  const stats = await getDashboard();
  const cards = [
    { href: "/admin/merchants", label: "Merchants", value: stats.merchants, note: `${stats.activeMerchants} subscribed` },
    { href: "/admin/companies", label: "Brands", value: stats.companies, note: "Global catalog" },
    { href: "/admin/products", label: "Products", value: stats.products, note: "Priced by brand" },
    { href: "/admin/quotations", label: "Quotations", value: stats.quotations, note: "Across showrooms" },
  ];

  return (
    <div className="grid gap-5">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Platform</h1>
        <p className="text-sm text-muted-foreground">
          Brands and products are shared. Each showroom keeps its own quotations.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
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
        <h2 className="text-sm font-medium">Subscriptions ending within 30 days</h2>
        {stats.expiring.length === 0 ? (
          <p className="text-sm text-muted-foreground">None right now.</p>
        ) : (
          <ul className="grid gap-2">
            {stats.expiring.map((merchant) => (
              <li key={merchant.id}>
                <Link href={`/admin/merchants/${merchant.id}`} className="flex min-h-12 items-center justify-between rounded-xl bg-card px-4 ring-1 ring-foreground/10">
                  <span className="text-sm font-medium">{merchant.name}</span>
                  <span className="text-sm text-muted-foreground">{formatDate(merchant.subscription_ends_on)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Recent quotations</h2>
          <Link href="/admin/quotations" className="text-sm font-medium text-primary">View all</Link>
        </div>
        {stats.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quotations yet.</p>
        ) : (
          <ul className="grid gap-2">
            {stats.recent.map((quote) => (
              <li key={quote.id}>
                <Link href={`/admin/quotations/${quote.id}`} className="grid gap-1 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{quote.quotation_number}</span>
                    <QuotationStatusBadge status={quote.status} />
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {quote.client_name} · {quote.merchantName}
                  </span>
                  <span className="text-sm">{formatMoney(quote.total, quote.currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

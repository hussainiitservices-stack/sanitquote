import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/admin/empty-state";
import { Pager } from "@/components/admin/pager";
import { QuotationStatusBadge } from "@/components/admin/status-badge";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { listMerchantOptions, listQuotations } from "@/lib/admin/queries";
import { formatDate } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";
import type { QuotationStatus } from "@/types/database";

export const metadata: Metadata = { title: "Quotations" };

const statuses: QuotationStatus[] = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "cancelled",
];

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string; merchant?: string }>;
}) {
  const params = await searchParams;
  const [result, merchants] = await Promise.all([
    listQuotations(params),
    listMerchantOptions(),
  ]);
  const filtered = Boolean(params.q || params.status || params.merchant);

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Quotations"
        description="Read-only view of quotes, including the prices saved when they were created."
      />
      <form action="/admin/quotations" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem_auto] lg:items-end">
        <TextField label="Search" name="q" defaultValue={params.q ?? ""} placeholder="Number or client" />
        <SelectField label="Merchant" name="merchant" defaultValue={params.merchant ?? ""}>
          <option value="">All merchants</option>
          {merchants.map((merchant) => (
            <option key={merchant.id} value={merchant.id}>
              {merchant.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Status" name="status" defaultValue={params.status ?? ""}>
          <option value="">All statuses</option>
          {statuses.map((status) => (
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
          description={filtered ? "Try another merchant or status." : "Quotes appear here after a merchant creates them."}
        />
      ) : (
        <ul className="grid gap-2">
          {result.rows.map((quote) => (
            <li key={quote.id}>
              <Link
                href={`/admin/quotations/${quote.id}`}
                className="grid min-w-0 gap-1 overflow-hidden rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
              >
                <span className="flex min-w-0 items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">{quote.number}</span>
                  <QuotationStatusBadge status={quote.status} />
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {quote.clientName} · {quote.merchantName}
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
        path="/admin/quotations"
        params={{ q: params.q, status: params.status, merchant: params.merchant }}
      />
    </div>
  );
}

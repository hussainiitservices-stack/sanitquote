import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QuotationStatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { getQuotation } from "@/lib/admin/queries";
import { formatDate } from "@/lib/format/date";
import { asNumber, formatMoney } from "@/lib/format/money";

export const metadata: Metadata = { title: "Quotation" };

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getQuotation(id);
  if (!record) notFound();

  const { quotation, merchantName, items } = record;

  return (
    <div className="grid gap-5">
      <PageHeader
        title={quotation.quotation_number}
        description={`${merchantName} · issued ${formatDate(quotation.issue_date)}`}
        action={<QuotationStatusBadge status={quotation.status} />}
      />
      <section className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Showroom</h2>
          <p className="mt-1 text-sm font-medium">{quotation.branding_display_name}</p>
          {quotation.branding_phone ? <p className="text-sm text-muted-foreground">{quotation.branding_phone}</p> : null}
          {quotation.branding_email ? <p className="text-sm text-muted-foreground">{quotation.branding_email}</p> : null}
        </div>
        <div>
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Client</h2>
          <p className="mt-1 text-sm font-medium">{quotation.client_name}</p>
          {quotation.site_address || quotation.site_name ? (
            <p className="text-sm text-muted-foreground">{quotation.site_address || quotation.site_name}</p>
          ) : null}
          {quotation.client_phone ? <p className="text-sm text-muted-foreground">{quotation.client_phone}</p> : null}
        </div>
      </section>
      <ul className="grid gap-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{item.product_name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.company_name}
                  {item.sku ? ` · ${item.sku}` : ""}
                </p>
              </div>
              <p className="text-sm font-medium">{formatMoney(asNumber(item.line_total), quotation.currency)}</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {asNumber(item.quantity)} {item.unit} × {formatMoney(asNumber(item.unit_price), quotation.currency)}
            </p>
          </li>
        ))}
      </ul>
      <dl className="grid gap-2 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{formatMoney(asNumber(quotation.subtotal), quotation.currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Discount</dt>
          <dd>{formatMoney(asNumber(quotation.discount_total), quotation.currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Tax</dt>
          <dd>{formatMoney(asNumber(quotation.tax_total), quotation.currency)}</dd>
        </div>
        <div className="flex justify-between text-base font-medium">
          <dt>Total</dt>
          <dd>{formatMoney(asNumber(quotation.grand_total), quotation.currency)}</dd>
        </div>
      </dl>
      {quotation.notes ? <p className="text-sm text-muted-foreground">{quotation.notes}</p> : null}
    </div>
  );
}

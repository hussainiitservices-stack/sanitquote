import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/admin/empty-state";
import { Pager } from "@/components/admin/pager";
import { MerchantStatusBadge } from "@/components/admin/status-badge";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { listMerchants } from "@/lib/admin/queries";
import { formatDate } from "@/lib/format/date";

export const metadata: Metadata = { title: "Merchants" };

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const result = await listMerchants(params);
  const filtered = Boolean(params.q || params.status);

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Merchants"
        description="Showroom logins, subscription dates, and quotation branding."
        action={
          <Button asChild className="h-11">
            <Link href="/admin/merchants/new">Add merchant</Link>
          </Button>
        }
      />
      <form action="/admin/merchants" className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <TextField label="Search" name="q" defaultValue={params.q ?? ""} placeholder="Name or username" />
        <SelectField label="Status" name="status" defaultValue={params.status ?? ""}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </SelectField>
        <Button type="submit" variant="secondary" className="h-11">
          Search
        </Button>
      </form>
      {result.rows.length === 0 ? (
        <EmptyState
          title={filtered ? "No merchants match" : "No merchants yet"}
          description={filtered ? "Try a different name or status." : "Create the first showroom account."}
          href={filtered ? undefined : "/admin/merchants/new"}
          action={filtered ? undefined : "Add merchant"}
        />
      ) : (
        <ul className="grid gap-2">
          {result.rows.map((merchant) => (
            <li key={merchant.id}>
              <Link
                href={`/admin/merchants/${merchant.id}`}
                className="flex min-h-16 min-w-0 items-center justify-between gap-3 overflow-hidden rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: merchant.primaryColor ?? "#123c3e" }}
                    />
                    <span className="truncate text-sm font-medium">{merchant.name}</span>
                  </span>
                  <span className="mt-1 block truncate text-sm text-muted-foreground">
                    {merchant.username} · {formatDate(merchant.subscriptionStartsOn)} – {formatDate(merchant.subscriptionEndsOn)}
                  </span>
                </span>
                <MerchantStatusBadge
                  status={merchant.status}
                  subscriptionActive={merchant.subscriptionActive}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pager
        page={result.page}
        pageCount={result.pageCount}
        path="/admin/merchants"
        params={{ q: params.q, status: params.status }}
      />
    </div>
  );
}

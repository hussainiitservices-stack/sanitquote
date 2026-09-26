import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { EmptyState } from "@/components/admin/empty-state";
import { Pager } from "@/components/admin/pager";
import { ActiveBadge } from "@/components/admin/status-badge";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { listCompanies } from "@/lib/admin/queries";
import { publicObjectUrl, STORAGE_BUCKETS } from "@/lib/storage/buckets";

export const metadata: Metadata = { title: "Brands" };

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const result = await listCompanies(params);
  const filtered = Boolean(params.q || params.status);

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Brands"
        description="Sanitaryware companies whose products can appear on a quotation."
        action={
          <Button asChild className="h-11">
            <Link href="/admin/companies/new">Add brand</Link>
          </Button>
        }
      />
      <form action="/admin/companies" className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <TextField label="Search" name="q" defaultValue={params.q ?? ""} placeholder="Name or slug" />
        <SelectField label="Visibility" name="status" defaultValue={params.status ?? ""}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
        </SelectField>
        <Button type="submit" variant="secondary" className="h-11">
          Search
        </Button>
      </form>
      {result.rows.length === 0 ? (
        <EmptyState
          title={filtered ? "No brands match" : "No brands yet"}
          description={filtered ? "Try another search." : "Add the first sanitaryware company."}
          href={filtered ? undefined : "/admin/companies/new"}
          action={filtered ? undefined : "Add brand"}
        />
      ) : (
        <ul className="grid gap-2">
          {result.rows.map((company) => (
            <li key={company.id}>
              <Link
                href={`/admin/companies/${company.id}`}
                className="flex min-h-16 items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
              >
                {company.logoPath ? (
                  <Image
                    src={publicObjectUrl(STORAGE_BUCKETS.brandAssets, company.logoPath)}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-sm font-medium">
                    {company.name.slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{company.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {company.productCount} {company.productCount === 1 ? "product" : "products"}
                  </span>
                </span>
                <ActiveBadge active={company.isActive} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pager
        page={result.page}
        pageCount={result.pageCount}
        path="/admin/companies"
        params={{ q: params.q, status: params.status }}
      />
    </div>
  );
}

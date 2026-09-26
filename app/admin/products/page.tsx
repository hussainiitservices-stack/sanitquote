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
import { listCompanyOptions, listProducts } from "@/lib/admin/queries";
import { formatMoney } from "@/lib/format/money";
import { publicObjectUrl, STORAGE_BUCKETS } from "@/lib/storage/buckets";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; company?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [result, companies] = await Promise.all([
    listProducts(params),
    listCompanyOptions(),
  ]);
  const filtered = Boolean(params.q || params.company || params.status);

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Products"
        description="Prices here are copied onto a quotation when it is created."
        action={
          <Button asChild className="h-11">
            <Link href="/admin/products/new">Add product</Link>
          </Button>
        }
      />
      <form action="/admin/products" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_10rem_auto] lg:items-end">
        <TextField label="Search" name="q" defaultValue={params.q ?? ""} placeholder="Name or SKU" />
        <SelectField label="Brand" name="company" defaultValue={params.company ?? ""}>
          <option value="">All brands</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </SelectField>
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
          title={filtered ? "No products match" : "No products yet"}
          description={filtered ? "Try another brand or search." : "Add a product under one of the brands."}
          href={filtered ? undefined : "/admin/products/new"}
          action={filtered ? undefined : "Add product"}
        />
      ) : (
        <ul className="grid gap-2">
          {result.rows.map((product) => (
            <li key={product.id}>
              <Link
                href={`/admin/products/${product.id}`}
                className="flex min-h-16 min-w-0 items-center gap-3 overflow-hidden rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
              >
                {product.imagePath ? (
                  <Image
                    src={publicObjectUrl(STORAGE_BUCKETS.brandAssets, product.imagePath)}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="size-12 shrink-0 rounded-lg bg-muted" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{product.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {product.companyName} · {product.sku}
                  </span>
                </span>
                <span className="grid shrink-0 justify-items-end gap-1">
                  <span className="text-sm font-medium">{formatMoney(product.listPrice, product.currency)}</span>
                  <ActiveBadge active={product.isActive} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pager
        page={result.page}
        pageCount={result.pageCount}
        path="/admin/products"
        params={{ q: params.q, company: params.company, status: params.status }}
      />
    </div>
  );
}

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { EmptyState } from "@/components/admin/empty-state"
import { Pager } from "@/components/admin/pager"
import { SelectField } from "@/components/forms/select-field"
import { TextField } from "@/components/forms/text-field"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/format/money"
import { listCatalog, listGrantedCompanies } from "@/lib/merchant/queries"
import { publicObjectUrl, STORAGE_BUCKETS } from "@/lib/storage/buckets"

export const metadata: Metadata = { title: "Catalog" }

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; company?: string }>
}) {
  const params = await searchParams
  const [result, companies] = await Promise.all([listCatalog(params), listGrantedCompanies()])
  const filtered = Boolean(params.q || params.company)

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Catalog"
        description="Products from the brands enabled for this showroom. Prices are copied onto a quotation when you add them."
      />
      <form action="/merchant/catalog" className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <TextField label="Search" name="q" defaultValue={params.q ?? ""} placeholder="Name or SKU" />
        <SelectField label="Brand" name="company" defaultValue={params.company ?? ""}>
          <option value="">All brands</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </SelectField>
        <Button type="submit" variant="secondary" className="h-11">
          Search
        </Button>
      </form>
      {result.rows.length === 0 ? (
        <EmptyState
          title={filtered ? "No products match" : "No products available"}
          description={
            filtered
              ? "Try another brand or search."
              : "Ask an administrator to enable brands for this showroom."
          }
        />
      ) : (
        <ul className="grid gap-2">
          {result.rows.map((product) => (
            <li key={product.id}>
              <Link
                href={`/merchant/catalog/${product.id}`}
                className="flex min-h-16 items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
              >
                {product.imagePath ? (
                  <Image
                    src={publicObjectUrl(STORAGE_BUCKETS.brandAssets, product.imagePath)}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 rounded-lg object-cover"
                  />
                ) : (
                  <span className="size-12 rounded-lg bg-muted" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{product.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {product.companyName} · {product.sku}
                  </span>
                </span>
                <span className="text-sm font-medium">{formatMoney(product.listPrice, product.currency)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pager
        page={result.page}
        pageCount={result.pageCount}
        path="/merchant/catalog"
        params={{ q: params.q, company: params.company }}
      />
    </div>
  )
}

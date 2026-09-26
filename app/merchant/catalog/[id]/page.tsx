import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/format/money"
import { getCatalogProduct } from "@/lib/merchant/queries"
import { publicObjectUrl, STORAGE_BUCKETS } from "@/lib/storage/buckets"

export const metadata: Metadata = { title: "Product" }

export default async function CatalogProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getCatalogProduct(id)
  if (!product) notFound()

  return (
    <div className="grid gap-5">
      <PageHeader title={product.name} description={`${product.companyName} · ${product.sku}`} />
      {product.imagePath ? (
        <Image
          src={publicObjectUrl(STORAGE_BUCKETS.brandAssets, product.imagePath)}
          alt=""
          width={640}
          height={480}
          className="h-56 w-full rounded-xl object-cover"
        />
      ) : null}
      <dl className="grid gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Price</dt>
          <dd className="font-medium">{formatMoney(product.listPrice, product.currency)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Unit</dt>
          <dd>{product.unit}</dd>
        </div>
        {product.category ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Category</dt>
            <dd>{product.category}</dd>
          </div>
        ) : null}
        {product.finish ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Finish</dt>
            <dd>{product.finish}</dd>
          </div>
        ) : null}
      </dl>
      {product.description ? <p className="text-sm text-muted-foreground">{product.description}</p> : null}
      <Button asChild className="h-11">
        <Link href="/merchant/quotations/new">Start a quotation</Link>
      </Button>
    </div>
  )
}

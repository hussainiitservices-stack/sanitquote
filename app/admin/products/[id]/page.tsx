import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/layout/page-header";
import { getProduct, listCompanyOptions, specDetails } from "@/lib/admin/queries";
import { asNumber } from "@/lib/format/money";
import { publicObjectUrl, STORAGE_BUCKETS } from "@/lib/storage/buckets";

export const metadata: Metadata = { title: "Product" };

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, companies] = await Promise.all([getProduct(id), listCompanyOptions()]);
  if (!product) notFound();

  return (
    <div className="grid gap-5">
      <PageHeader title={product.name} description={`${product.sku} · edit price and brand`} />
      <ProductForm
        companies={companies}
        imageUrl={
          product.image_path
            ? publicObjectUrl(STORAGE_BUCKETS.brandAssets, product.image_path)
            : null
        }
        values={{
          id: product.id,
          companyId: product.company_id,
          sku: product.sku,
          name: product.name,
          description: product.description ?? "",
          category: product.category ?? "",
          finish: product.finish ?? "",
          unit: product.unit,
          hsnCode: product.hsn_code ?? "",
          listPrice: String(asNumber(product.list_price)),
          currency: product.currency,
          details: specDetails(product.specifications),
          isActive: product.is_active ? "true" : "false",
        }}
      />
    </div>
  );
}

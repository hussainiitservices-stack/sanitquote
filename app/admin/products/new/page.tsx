import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/admin/empty-state";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/layout/page-header";
import { getSettings, listCompanyOptions } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const [companies, settings] = await Promise.all([listCompanyOptions(), getSettings()]);
  const currency = settings.missing ? "INR" : settings.defaultCurrency;

  return (
    <div className="grid gap-5">
      <PageHeader title="New product" description="Choose the brand this product belongs to." />
      {companies.length === 0 ? (
        <EmptyState
          title="Add a brand first"
          description="Products belong to a sanitaryware company."
          href="/admin/companies/new"
          action="Add brand"
        />
      ) : (
        <ProductForm
          companies={companies}
          values={{
            companyId: companies[0]?.id ?? "",
            sku: "",
            name: "",
            description: "",
            category: "",
            finish: "",
            unit: "pcs",
            hsnCode: "",
            listPrice: "0",
            currency,
            details: "",
            isActive: "true",
          }}
        />
      )}
      {companies.length === 0 ? null : (
        <p className="text-sm text-muted-foreground">
          Need another brand? <Link href="/admin/companies/new" className="font-medium text-primary">Add one</Link>.
        </p>
      )}
    </div>
  );
}

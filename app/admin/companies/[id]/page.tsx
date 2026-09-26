import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompanyForm } from "@/components/admin/company-form";
import { PageHeader } from "@/components/layout/page-header";
import { getCompany } from "@/lib/admin/queries";
import { publicObjectUrl, STORAGE_BUCKETS } from "@/lib/storage/buckets";

export const metadata: Metadata = { title: "Brand" };

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  return (
    <div className="grid gap-5">
      <PageHeader title={company.name} description="Edit the brand shown beside its products." />
      <CompanyForm
        logoUrl={
          company.logo_path
            ? publicObjectUrl(STORAGE_BUCKETS.brandAssets, company.logo_path)
            : null
        }
        values={{
          id: company.id,
          name: company.name,
          slug: company.slug,
          description: company.description ?? "",
          isActive: company.is_active ? "true" : "false",
        }}
      />
    </div>
  );
}

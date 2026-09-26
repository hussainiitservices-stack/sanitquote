import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccessEditor } from "@/components/admin/access-editor";
import { FormSection } from "@/components/admin/form-section";
import { MerchantForm } from "@/components/admin/merchant-form";
import { PageHeader } from "@/components/layout/page-header";
import { getMerchant, listAccess } from "@/lib/admin/queries";
import { publicObjectUrl, STORAGE_BUCKETS } from "@/lib/storage/buckets";

export const metadata: Metadata = { title: "Merchant" };

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const merchant = await getMerchant(id);
  if (!merchant) notFound();
  const companies = await listAccess(id);

  return (
    <div className="grid gap-5">
      <PageHeader
        title={merchant.name}
        description={`Signs in as ${merchant.username}`}
        action={
          <Link href={`/admin/access?merchant=${merchant.id}`} className="text-sm font-medium text-primary">
            Company access
          </Link>
        }
      />
      <MerchantForm
        logoUrl={
          merchant.logoPath
            ? publicObjectUrl(STORAGE_BUCKETS.merchantLogos, merchant.logoPath)
            : null
        }
        values={{
          id: merchant.id,
          name: merchant.name,
          username: merchant.username,
          password: "",
          status: merchant.status,
          subscriptionStartsOn: merchant.subscriptionStartsOn,
          subscriptionEndsOn: merchant.subscriptionEndsOn,
          contactEmail: merchant.contactEmail,
          contactPhone: merchant.contactPhone,
          displayName: merchant.displayName,
          tagline: merchant.tagline,
          primaryColor: merchant.primaryColor,
          secondaryColor: merchant.secondaryColor,
          accentColor: merchant.accentColor,
          address: merchant.address,
          city: merchant.city,
          state: merchant.state,
          pincode: merchant.pincode,
          phone: merchant.phone,
          email: merchant.email,
          website: merchant.website,
          gstin: merchant.gstin,
          footerNote: merchant.footerNote,
          terms: merchant.terms,
        }}
      />
      <FormSection title="Enabled brands" description="Turn a brand on to let this showroom quote its products.">
        <AccessEditor merchantId={merchant.id} companies={companies} />
      </FormSection>
    </div>
  );
}

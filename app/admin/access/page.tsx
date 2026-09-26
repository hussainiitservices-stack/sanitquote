import type { Metadata } from "next";

import { AccessEditor } from "@/components/admin/access-editor";
import { EmptyState } from "@/components/admin/empty-state";
import { SelectField } from "@/components/forms/select-field";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { listAccess, listMerchantOptions } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Access" };

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ merchant?: string }>;
}) {
  const params = await searchParams;
  const merchants = await listMerchantOptions();
  const selected = merchants.find((merchant) => merchant.id === params.merchant) ?? null;
  const companies = selected ? await listAccess(selected.id) : [];

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Company access"
        description="Choose which brands each merchant can use on a quotation."
      />
      {merchants.length === 0 ? (
        <EmptyState
          title="No merchants yet"
          description="Create a showroom before granting brand access."
          href="/admin/merchants/new"
          action="Add merchant"
        />
      ) : (
        <form action="/admin/access" className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <SelectField label="Merchant" name="merchant" defaultValue={selected?.id ?? ""}>
            <option value="">Choose a merchant</option>
            {merchants.map((merchant) => (
              <option key={merchant.id} value={merchant.id}>
                {merchant.name}
              </option>
            ))}
          </SelectField>
          <Button type="submit" className="h-11">
            Show brands
          </Button>
        </form>
      )}
      {selected && companies.length === 0 ? (
        <EmptyState
          title="No brands yet"
          description="Add a sanitaryware company before enabling it."
          href="/admin/companies/new"
          action="Add brand"
        />
      ) : null}
      {selected && companies.length > 0 ? (
        <AccessEditor merchantId={selected.id} companies={companies} />
      ) : null}
    </div>
  );
}

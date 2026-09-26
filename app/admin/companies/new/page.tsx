import type { Metadata } from "next";

import { CompanyForm } from "@/components/admin/company-form";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "New brand" };

export default function NewCompanyPage() {
  return (
    <div className="grid gap-5">
      <PageHeader title="New brand" description="Products added later belong to this company." />
      <CompanyForm
        values={{
          name: "",
          slug: "",
          description: "",
          isActive: "true",
        }}
      />
    </div>
  );
}

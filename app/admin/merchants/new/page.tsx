import type { Metadata } from "next";

import { MerchantForm } from "@/components/admin/merchant-form";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "New merchant" };

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function NewMerchantPage() {
  const start = new Date();
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);

  return (
    <div className="grid gap-5">
      <PageHeader title="New merchant" description="Create a username and password the showroom can use today." />
      <MerchantForm
        values={{
          name: "",
          username: "",
          password: "",
          status: "active",
          subscriptionStartsOn: isoDate(start),
          subscriptionEndsOn: isoDate(end),
          contactEmail: "",
          contactPhone: "",
          displayName: "",
          tagline: "",
          primaryColor: "#123c3e",
          secondaryColor: "#f4f1ea",
          accentColor: "#8a6232",
          address: "",
          city: "",
          state: "",
          pincode: "",
          phone: "",
          email: "",
          website: "",
          gstin: "",
          footerNote: "",
          terms: "",
        }}
      />
    </div>
  );
}

import type { Metadata } from "next";

import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/layout/page-header";
import { getSettings } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Settings"
        description="Platform name, support contact, and defaults used across the catalog."
      />
      {settings.missing ? (
        <p className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
          Apply `supabase/migrations/20260926140000_platform_settings.sql` before saving settings.
        </p>
      ) : (
        <SettingsForm
          values={{
            platformName: settings.platformName,
            supportEmail: settings.supportEmail,
            defaultCurrency: settings.defaultCurrency,
            defaultTaxRate: String(settings.defaultTaxRate),
          }}
        />
      )}
    </div>
  );
}

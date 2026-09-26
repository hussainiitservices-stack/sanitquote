import type { Metadata } from "next";

import { MerchantShell } from "@/components/layout/merchant-shell";
import { requireMerchant } from "@/lib/auth/guards";
import { getMerchantWorkspace } from "@/lib/data/merchants";
import { formatDate } from "@/lib/format/date";

export const metadata: Metadata = {
  title: "Showroom",
};

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireMerchant();
  const workspace = await getMerchantWorkspace(user.merchantId);
  const brand = workspace?.branding?.displayName || workspace?.name || "Showroom";

  return (
    <MerchantShell
      brand={brand}
      user={{ name: user.fullName || user.email, email: user.email }}
      banner={subscriptionBanner(workspace)}
    >
      {children}
    </MerchantShell>
  );
}

function subscriptionBanner(
  workspace: Awaited<ReturnType<typeof getMerchantWorkspace>>,
) {
  if (!workspace) {
    return "This workspace record could not be loaded.";
  }
  if (workspace.subscriptionActive) return null;
  if (workspace.status === "suspended") {
    return "This workspace is suspended. Existing records stay available, and new quotations stay locked.";
  }
  return `The subscription runs ${formatDate(workspace.subscriptionStartsOn)} to ${formatDate(workspace.subscriptionEndsOn)}. It is not active, so new quotations stay locked.`;
}

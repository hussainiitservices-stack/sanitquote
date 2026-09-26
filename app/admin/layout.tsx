import type { Metadata } from "next";

import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <AdminShell
      user={{
        name: user.fullName || user.email,
        email: user.email,
      }}
    >
      {children}
    </AdminShell>
  );
}

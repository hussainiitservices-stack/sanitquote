import type { Metadata } from "next";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { PublicFrame } from "@/components/layout/public-frame";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Account pending",
};

export default async function AccountPendingPage() {
  const user = await getSessionUser();

  return (
    <PublicFrame>
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Waiting for access</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {user?.email
            ? `${user.email} is signed in, but an administrator still needs to assign this account.`
            : "An administrator needs to assign this account before the workspace opens."}
        </p>
        {user ? (
          <SignOutButton className="w-fit" />
        ) : (
          <Button asChild className="h-11 w-fit">
            <Link href="/login">Sign in</Link>
          </Button>
        )}
      </div>
    </PublicFrame>
  );
}

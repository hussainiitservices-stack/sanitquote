import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { PublicFrame } from "@/components/layout/public-frame";
import { redirectIfSignedIn } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  await redirectIfSignedIn(params.next);

  return (
    <PublicFrame>
      <LoginForm next={params.next} authError={params.error} />
    </PublicFrame>
  );
}

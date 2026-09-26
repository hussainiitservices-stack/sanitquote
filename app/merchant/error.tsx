"use client";

import { RouteError } from "@/components/layout/route-error";

export default function MerchantError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} />;
}

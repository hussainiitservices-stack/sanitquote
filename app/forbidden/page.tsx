import type { Metadata } from "next";
import Link from "next/link";

import { PublicFrame } from "@/components/layout/public-frame";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Not allowed",
};

export default function ForbiddenPage() {
  return (
    <PublicFrame>
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Not allowed</h1>
        <p className="text-sm text-muted-foreground">
          This account cannot open that part of SanitQuote.
        </p>
        <Button asChild className="h-11 w-fit">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </PublicFrame>
  );
}

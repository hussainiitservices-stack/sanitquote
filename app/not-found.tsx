import Link from "next/link";

import { PublicFrame } from "@/components/layout/public-frame";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PublicFrame>
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          That address is not part of SanitQuote.
        </p>
        <Button asChild className="h-11 w-fit">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </PublicFrame>
  );
}

import type { Metadata } from "next"
import Link from "next/link"

import { PublicFrame } from "@/components/layout/public-frame"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Offline" }

export default function OfflinePage() {
  return (
    <PublicFrame>
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">You are offline</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          SanitQuote needs a connection to load quotations and the catalog. Reconnect, then try again.
        </p>
        <Button asChild className="h-11 w-fit">
          <Link href="/">Try again</Link>
        </Button>
      </div>
    </PublicFrame>
  )
}

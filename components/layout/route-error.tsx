"use client"

import { Button } from "@/components/ui/button"

export function RouteError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="grid max-w-md gap-3">
      <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        This screen could not be loaded. Try again, and check the server logs if it keeps failing.
      </p>
      <Button type="button" className="h-11 w-fit" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}

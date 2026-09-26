"use client"

import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth/actions"
import { cn } from "@/lib/utils"

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" className={cn("h-10", className)}>
        Sign out
      </Button>
    </form>
  )
}

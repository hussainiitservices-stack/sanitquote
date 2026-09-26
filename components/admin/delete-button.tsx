"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import type { ActionResult } from "@/lib/admin/result"

export function DeleteButton({
  label,
  onConfirm,
}: {
  label: string
  onConfirm: () => Promise<ActionResult | void>
}) {
  const [armed, setArmed] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="destructive"
        className="h-11"
        disabled={pending}
        onClick={() => {
          if (!armed) {
            setArmed(true)
            setMessage(null)
            return
          }
          startTransition(async () => {
            const result = await onConfirm()
            if (result && !result.ok) {
              setMessage(result.message)
              setArmed(false)
            }
          })
        }}
      >
        {pending ? "Deleting…" : armed ? "Confirm delete" : label}
      </Button>
      {message ? (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  )
}

"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { SelectField } from "@/components/forms/select-field"
import { Button } from "@/components/ui/button"
import { QUOTATION_STATUSES } from "@/lib/domain/quotations"
import { duplicateQuotation, setQuotationStatus } from "@/lib/merchant/quote-actions"
import type { QuotationStatus } from "@/types/database"

export function QuotationTools({
  id,
  number,
  status,
  canWrite,
}: {
  id: string
  number: string
  status: QuotationStatus
  canWrite: boolean
}) {
  const router = useRouter()
  const [nextStatus, setNextStatus] = useState(status)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const pdfHref = `/api/merchant/quotations/${id}/pdf`

  async function share() {
    const response = await fetch(pdfHref)
    if (!response.ok) {
      toast.error("The PDF could not be created.")
      return
    }
    const blob = await response.blob()
    const file = new File([blob], `${number}.pdf`, { type: "application/pdf" })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: number, text: number })
        return
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return
      }
    }
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${number}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild className="h-11">
          <a href={pdfHref}>Download PDF</a>
        </Button>
        <Button type="button" variant="secondary" className="h-11" onClick={() => void share()}>
          Share
        </Button>
      </div>
      {canWrite ? (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <SelectField
            label="Status"
            value={nextStatus}
            onValueChange={(status) => setNextStatus(status as QuotationStatus)}
          >
            {QUOTATION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </SelectField>
          <Button
            type="button"
            variant="secondary"
            className="h-11"
            disabled={pending || nextStatus === status}
            onClick={() => {
              startTransition(async () => {
                const result = await setQuotationStatus({ id, status: nextStatus })
                if (!result.ok) {
                  setMessage(result.message)
                  return
                }
                toast.success(result.message)
                router.refresh()
              })
            }}
          >
            {pending ? "Updating…" : "Update status"}
          </Button>
        </div>
      ) : null}
      {canWrite ? (
        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await duplicateQuotation(id)
              if (!result.ok) {
                setMessage(result.message)
                return
              }
              toast.success(result.message)
              if (result.href) router.push(result.href)
            })
          }}
        >
          Duplicate as draft
        </Button>
      ) : null}
      {message ? (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  )
}

"use client"

import { useEffect, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatMoney } from "@/lib/format/money"
import { searchCatalog, type CatalogPick } from "@/lib/merchant/quote-actions"

export function ProductPicker({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (product: CatalogPick) => void
}) {
  const [query, setQuery] = useState("")
  const [rows, setRows] = useState<CatalogPick[]>([])
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    startTransition(async () => {
      setRows(await searchCatalog(query))
    })
  }, [open, query])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        <SheetHeader>
          <SheetTitle>Add a product</SheetTitle>
          <SheetDescription>Only brands enabled for this showroom appear here.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-3 px-4 pb-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or SKU"
            className="h-11 rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {pending && rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Searching…</p>
          ) : null}
          <ul className="grid max-h-[50dvh] gap-2 overflow-y-auto">
            {rows.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(product)
                    onOpenChange(false)
                    setQuery("")
                  }}
                  className="flex min-h-14 w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-xl bg-card px-4 py-3 text-left ring-1 ring-foreground/10"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{product.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {product.companyName} · {product.sku}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium">
                    {formatMoney(product.listPrice, product.currency)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!pending && rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products match that search.</p>
          ) : null}
          <Button type="button" variant="secondary" className="h-11" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

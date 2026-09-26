"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import { DeleteButton } from "@/components/admin/delete-button"
import { FormSection } from "@/components/admin/form-section"
import { applyFormResult } from "@/components/merchant/form-result"
import { ProductPicker } from "@/components/merchant/product-picker"
import { SelectField } from "@/components/forms/select-field"
import { TextAreaField } from "@/components/forms/textarea-field"
import { TextField } from "@/components/forms/text-field"
import { Button } from "@/components/ui/button"
import { calculateLine, calculateQuoteTotals } from "@/lib/domain/quotations"
import { formatMoney } from "@/lib/format/money"
import { deleteQuotation, saveQuotation } from "@/lib/merchant/quote-actions"
import {
  quotationHeaderSchema,
  type QuotationFormValues,
  type QuotationHeaderValues,
} from "@/lib/validations/merchant"

export type QuotationEditorLine = {
  productId: string
  productName: string
  companyName: string
  sku: string
  unit: string
  quantity: string
  unitPrice: string
  discountAmount: string
  taxRate: string
}

type EditorLine = QuotationEditorLine & { key: string }

export function QuotationEditor({
  values,
  lines: initialLines,
  clients,
  currency,
  defaultTaxRate,
  canWrite,
}: {
  values: QuotationFormValues
  lines?: QuotationEditorLine[]
  clients: Array<{ id: string; name: string }>
  currency: string
  defaultTaxRate: string
  canWrite: boolean
}) {
  const router = useRouter()
  const form = useForm<QuotationHeaderValues>({
    resolver: zodResolver(quotationHeaderSchema),
    defaultValues: values,
  })
  const [lines, setLines] = useState<EditorLine[]>(
    (initialLines ?? []).map((item, index) => ({
      ...item,
      key: `${item.productId}-${index}`,
    })),
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [lineError, setLineError] = useState<string | null>(null)

  const preview = useMemo(() => {
    const computed = lines.map((line) => {
      const quantity = Number(line.quantity)
      const unitPrice = Number(line.unitPrice)
      const discountAmount = Number(line.discountAmount)
      const taxRate = Number(line.taxRate)
      return {
        quantity,
        unitPrice,
        discountAmount,
        taxRate,
        ...calculateLine({ quantity, unitPrice, discountAmount, taxRate }),
      }
    })
    return calculateQuoteTotals(computed)
  }, [lines])

  const onSubmit = form.handleSubmit(async (fields) => {
    const items = lines
      .filter((line) => line.productId)
      .map(({ productId, quantity, unitPrice, discountAmount, taxRate }) => ({
        productId,
        quantity,
        unitPrice,
        discountAmount,
        taxRate,
      }))
    if (items.length === 0) {
      setLineError("Add at least one product.")
      return
    }
    setLineError(null)
    const result = await saveQuotation({
      ...fields,
      items,
    } satisfies QuotationFormValues)
    applyFormResult(form, router, result)
  })

  return (
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start" noValidate>
      <div className="grid gap-4">
        {form.formState.errors.root?.message ? (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <FormSection title="For whom">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Client" control={form.control} name="clientId">
              <option value="">Choose a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </SelectField>
            <TextField label="Issue date" type="date" {...form.register("issueDate")} />
            <TextField label="Valid until" type="date" {...form.register("validUntil")} />
          </div>
          <TextAreaField
            label="Site address"
            className="min-h-20"
            placeholder="Project location for this quotation"
            {...form.register("siteAddress")}
          />
        </FormSection>

        <FormSection title="Products">
          <ul className="grid gap-3">
            {lines.map((line) => (
              <li key={line.key} className="grid gap-3 rounded-xl bg-muted/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{line.productName || "Product"}</p>
                    <p className="text-sm text-muted-foreground">
                      {line.companyName}
                      {line.sku ? ` · ${line.sku}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-medium text-destructive"
                    onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label={`Qty (${line.unit})`}
                    inputMode="decimal"
                    value={line.quantity}
                    onChange={(event) => updateLine(setLines, line.key, { quantity: event.target.value })}
                  />
                  <TextField
                    label="Price"
                    inputMode="decimal"
                    value={line.unitPrice}
                    onChange={(event) => updateLine(setLines, line.key, { unitPrice: event.target.value })}
                  />
                  <TextField
                    label="Discount"
                    inputMode="decimal"
                    value={line.discountAmount}
                    onChange={(event) => updateLine(setLines, line.key, { discountAmount: event.target.value })}
                  />
                  <TextField
                    label="Tax %"
                    inputMode="decimal"
                    value={line.taxRate}
                    onChange={(event) => updateLine(setLines, line.key, { taxRate: event.target.value })}
                  />
                </div>
              </li>
            ))}
          </ul>
          {lineError ? (
            <p className="text-sm text-destructive" role="alert">
              {lineError}
            </p>
          ) : null}
          {canWrite ? (
            <Button type="button" variant="secondary" className="h-11" onClick={() => setPickerOpen(true)}>
              Add product
            </Button>
          ) : null}
        </FormSection>

        <FormSection title="Notes">
          <TextAreaField label="Notes" {...form.register("notes")} />
          <TextAreaField label="Terms" {...form.register("terms")} />
        </FormSection>
      </div>

      <div className="sticky bottom-[5.5rem] z-10 grid gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 md:bottom-4 lg:top-20">
        <p className="text-sm font-medium">Totals</p>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatMoney(preview.subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Discount</dt>
            <dd>{formatMoney(preview.discount, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tax</dt>
            <dd>{formatMoney(preview.tax, currency)}</dd>
          </div>
          <div className="flex justify-between text-base font-medium">
            <dt>Total</dt>
            <dd>{formatMoney(preview.grandTotal, currency)}</dd>
          </div>
        </dl>
        {canWrite ? (
          <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving…" : values.id ? "Save draft" : "Create draft"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">This subscription is not active, so quotations stay locked.</p>
        )}
        {values.id && canWrite ? (
          <DeleteButton label="Delete draft" onConfirm={() => deleteQuotation(values.id!)} />
        ) : null}
      </div>

      <ProductPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(product) => {
          setLineError(null)
          setLines((current) => [
            ...current,
            {
              key: `${product.id}-${Date.now()}`,
              productId: product.id,
              productName: product.name,
              companyName: product.companyName,
              sku: product.sku,
              unit: product.unit,
              quantity: "1",
              unitPrice: String(product.listPrice),
              discountAmount: "0",
              taxRate: defaultTaxRate,
            },
          ])
        }}
      />
    </form>
  )
}

function updateLine(
  setLines: React.Dispatch<React.SetStateAction<EditorLine[]>>,
  key: string,
  patch: Partial<EditorLine>,
) {
  setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)))
}


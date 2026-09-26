"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { DeleteButton } from "@/components/admin/delete-button"
import { FormSection } from "@/components/admin/form-section"
import { SelectField } from "@/components/forms/select-field"
import { TextAreaField } from "@/components/forms/textarea-field"
import { TextField } from "@/components/forms/text-field"
import { Button } from "@/components/ui/button"
import { deleteProduct, saveProduct } from "@/lib/admin/catalog-actions"
import type { ActionResult } from "@/lib/admin/result"
import { productFormSchema, type ProductFormValues } from "@/lib/validations/admin"

export function ProductForm({
  values,
  imageUrl,
  companies,
}: {
  values: ProductFormValues
  imageUrl?: string | null
  companies: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [image, setImage] = useState<File | null>(null)
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: values,
  })

  const onSubmit = form.handleSubmit(async (fields) => {
    const body = new FormData()
    for (const [key, value] of Object.entries(fields)) {
      if (value != null) body.set(key, String(value))
    }
    if (image) body.set("image", image)
    const result = await saveProduct(body)
    finish(form, router, result)
  })

  const creating = !values.id

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {form.formState.errors.root?.message ? (
        <p className="text-sm text-destructive" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <FormSection title="Product">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Brand" control={form.control} name="companyId">
            <option value="">Choose a brand</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </SelectField>
          <TextField label="SKU" error={form.formState.errors.sku?.message} {...form.register("sku")} />
          <TextField label="Name" error={form.formState.errors.name?.message} {...form.register("name")} />
          <TextField label="Category" {...form.register("category")} />
          <TextField label="Finish" {...form.register("finish")} />
          <TextField label="Unit" error={form.formState.errors.unit?.message} {...form.register("unit")} />
          <TextField label="HSN" {...form.register("hsnCode")} />
          <TextField
            label="List price"
            inputMode="decimal"
            error={form.formState.errors.listPrice?.message}
            {...form.register("listPrice")}
          />
          <TextField
            label="Currency"
            error={form.formState.errors.currency?.message}
            {...form.register("currency")}
          />
          <SelectField label="Visibility" control={form.control} name="isActive">
            <option value="true">Active</option>
            <option value="false">Hidden from merchants</option>
          </SelectField>
        </div>
        <TextAreaField label="Description" {...form.register("description")} />
        <TextAreaField label="Details" {...form.register("details")} />
        <div className="grid gap-2">
          <span className="text-sm font-medium">Image</span>
          {imageUrl ? (
            <Image src={imageUrl} alt="" width={80} height={80} className="size-20 rounded-lg object-cover" />
          ) : null}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            className="text-sm file:mr-3 file:h-10 file:rounded-lg file:border-0 file:bg-muted file:px-3"
          />
        </div>
      </FormSection>
      <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : creating ? "Create product" : "Save product"}
      </Button>
      {values.id ? (
        <FormSection title="Remove product">
          <DeleteButton label="Delete product" onConfirm={() => deleteProduct(values.id!)} />
        </FormSection>
      ) : null}
    </form>
  )
}

function finish(
  form: { setError: (name: "root", error: { message: string }) => void },
  router: { push: (href: string) => void; refresh: () => void },
  result: ActionResult,
) {
  if (!result.ok) {
    form.setError("root", { message: result.message })
    return
  }
  toast.success(result.message ?? "Saved")
  if (result.href) router.push(result.href)
  else router.refresh()
}

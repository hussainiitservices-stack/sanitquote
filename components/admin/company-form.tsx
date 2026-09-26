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
import { deleteCompany, saveCompany } from "@/lib/admin/catalog-actions"
import type { ActionResult } from "@/lib/admin/result"
import { companyFormSchema, type CompanyFormValues } from "@/lib/validations/admin"

export function CompanyForm({
  values,
  logoUrl,
}: {
  values: CompanyFormValues
  logoUrl?: string | null
}) {
  const router = useRouter()
  const [logo, setLogo] = useState<File | null>(null)
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: values,
  })

  const onSubmit = form.handleSubmit(async (fields) => {
    const body = new FormData()
    for (const [key, value] of Object.entries(fields)) {
      if (value != null) body.set(key, String(value))
    }
    if (logo) body.set("logo", logo)
    const result = await saveCompany(body)
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
      <FormSection title="Brand">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name" error={form.formState.errors.name?.message} {...form.register("name")} />
          <TextField
            label="Slug"
            error={form.formState.errors.slug?.message}
            {...form.register("slug")}
          />
        </div>
        <TextAreaField label="Description" {...form.register("description")} />
        <SelectField label="Catalog visibility" control={form.control} name="isActive">
            <option value="true">Active</option>
            <option value="false">Hidden from merchants</option>
          </SelectField>
        <div className="grid gap-2">
          <span className="text-sm font-medium">Logo</span>
          {logoUrl ? (
            <Image src={logoUrl} alt="" width={64} height={64} className="size-16 rounded-lg object-cover" />
          ) : null}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
            className="text-sm file:mr-3 file:h-10 file:rounded-lg file:border-0 file:bg-muted file:px-3"
          />
        </div>
      </FormSection>
      <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : creating ? "Create brand" : "Save brand"}
      </Button>
      {values.id ? (
        <FormSection title="Remove brand">
          <DeleteButton label="Delete brand" onConfirm={() => deleteCompany(values.id!)} />
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

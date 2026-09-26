"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import { DeleteButton } from "@/components/admin/delete-button"
import { FormSection } from "@/components/admin/form-section"
import { applyFormResult } from "@/components/merchant/form-result"
import { TextAreaField } from "@/components/forms/textarea-field"
import { TextField } from "@/components/forms/text-field"
import { Button } from "@/components/ui/button"
import { deleteClient, saveClient } from "@/lib/merchant/client-actions"
import { clientFormSchema, type ClientFormValues } from "@/lib/validations/merchant"

export function ClientForm({
  values,
  canWrite,
}: {
  values: ClientFormValues
  canWrite: boolean
}) {
  const router = useRouter()
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: values,
  })

  const onSubmit = form.handleSubmit(async (fields) => {
    const body = new FormData()
    for (const [key, value] of Object.entries(fields)) {
      if (value != null) body.set(key, String(value))
    }
    applyFormResult(form, router, await saveClient(body))
  })

  const creating = !values.id

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {form.formState.errors.root?.message ? (
        <p className="text-sm text-destructive" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <FormSection title="Client">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name" error={form.formState.errors.name?.message} {...form.register("name")} />
          <TextField label="Phone" error={form.formState.errors.phone?.message} {...form.register("phone")} />
          <TextField
            label="Email"
            type="email"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
          <TextField label="GSTIN" {...form.register("gstin")} />
        </div>
        <TextAreaField label="Address" {...form.register("address")} />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="City" {...form.register("city")} />
          <TextField label="State" {...form.register("state")} />
          <TextField label="Pincode" {...form.register("pincode")} />
        </div>
        <TextAreaField label="Notes" {...form.register("notes")} />
      </FormSection>
      {canWrite ? (
        <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : creating ? "Create client" : "Save client"}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">This subscription is not active, so clients cannot be changed.</p>
      )}
      {values.id && canWrite ? (
        <FormSection title="Remove client" description="Quotations keep the saved client name.">
          <DeleteButton label="Delete client" onConfirm={() => deleteClient(values.id!)} />
        </FormSection>
      ) : null}
    </form>
  )
}

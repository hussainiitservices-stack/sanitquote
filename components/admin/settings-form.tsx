"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { FormSection } from "@/components/admin/form-section"
import { TextField } from "@/components/forms/text-field"
import { Button } from "@/components/ui/button"
import { saveSettings } from "@/lib/admin/settings-actions"
import { settingsFormSchema, type SettingsFormValues } from "@/lib/validations/admin"

export function SettingsForm({ values }: { values: SettingsFormValues }) {
  const router = useRouter()
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: values,
  })

  const onSubmit = form.handleSubmit(async (fields) => {
    const result = await saveSettings(fields)
    if (!result.ok) {
      form.setError("root", { message: result.message })
      return
    }
    toast.success(result.message ?? "Saved")
    router.refresh()
  })

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {form.formState.errors.root?.message ? (
        <p className="text-sm text-destructive" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <FormSection
        title="Platform"
        description="These defaults are available when quotations and prices are created."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Platform name"
            error={form.formState.errors.platformName?.message}
            {...form.register("platformName")}
          />
          <TextField
            label="Support email"
            type="email"
            error={form.formState.errors.supportEmail?.message}
            {...form.register("supportEmail")}
          />
          <TextField
            label="Default currency"
            error={form.formState.errors.defaultCurrency?.message}
            {...form.register("defaultCurrency")}
          />
          <TextField
            label="Default tax %"
            inputMode="decimal"
            error={form.formState.errors.defaultTaxRate?.message}
            {...form.register("defaultTaxRate")}
          />
        </div>
      </FormSection>
      <Button type="submit" className="h-11 w-fit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : "Save settings"}
      </Button>
    </form>
  )
}

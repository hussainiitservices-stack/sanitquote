"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { DeleteButton } from "@/components/admin/delete-button"
import { FormSection } from "@/components/admin/form-section"
import { SelectField } from "@/components/forms/select-field"
import { TextAreaField } from "@/components/forms/textarea-field"
import { TextField } from "@/components/forms/text-field"
import { Button } from "@/components/ui/button"
import { deleteMerchant, saveMerchant } from "@/lib/admin/merchant-actions"
import type { ActionResult } from "@/lib/admin/result"
import {
  merchantFormSchema,
  type MerchantFormValues,
} from "@/lib/validations/admin"

function isHex(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

export function MerchantForm({
  values,
  logoUrl,
}: {
  values: MerchantFormValues
  logoUrl?: string | null
}) {
  const router = useRouter()
  const [logo, setLogo] = useState<File | null>(null)
  const form = useForm<MerchantFormValues>({
    resolver: zodResolver(merchantFormSchema),
    defaultValues: values,
  })
  const primary = useWatch({ control: form.control, name: "primaryColor" })
  const secondary = useWatch({ control: form.control, name: "secondaryColor" })
  const accent = useWatch({ control: form.control, name: "accentColor" })

  const onSubmit = form.handleSubmit(async (fields) => {
    const body = new FormData()
    for (const [key, value] of Object.entries(fields)) {
      if (value != null) body.set(key, String(value))
    }
    if (logo) body.set("logo", logo)
    const result = await saveMerchant(body)
    applyResult(form, router, result)
  })

  const rootError = form.formState.errors.root?.message
  const creating = !values.id

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="flex justify-end">
        <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : creating ? "Create merchant" : "Save merchant"}
        </Button>
      </div>
      {rootError ? (
        <p className="text-sm text-destructive" role="alert">
          {rootError}
        </p>
      ) : null}

      <FormSection title="Account" description="The username is what the showroom uses to sign in.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Showroom name"
            error={form.formState.errors.name?.message}
            {...form.register("name")}
          />
          <TextField
            label="Username"
            autoComplete="off"
            error={form.formState.errors.username?.message}
            {...form.register("username")}
          />
          <TextField
            label={creating ? "Password" : "New password"}
            type="password"
            autoComplete="new-password"
            placeholder={creating ? "" : "Leave blank to keep the current password"}
            error={form.formState.errors.password?.message}
            {...form.register("password")}
          />
          <SelectField label="Status" control={form.control} name="status">
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </SelectField>
        </div>
      </FormSection>

      <FormSection title="Subscription">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Starts"
            type="date"
            error={form.formState.errors.subscriptionStartsOn?.message}
            {...form.register("subscriptionStartsOn")}
          />
          <TextField
            label="Ends"
            type="date"
            error={form.formState.errors.subscriptionEndsOn?.message}
            {...form.register("subscriptionEndsOn")}
          />
          <TextField
            label="Contact email"
            type="email"
            error={form.formState.errors.contactEmail?.message}
            {...form.register("contactEmail")}
          />
          <TextField
            label="Contact phone"
            error={form.formState.errors.contactPhone?.message}
            {...form.register("contactPhone")}
          />
        </div>
      </FormSection>

      <FormSection title="Quotation branding" description="Copied onto each quotation when it is created.">
        <div className="flex h-12 overflow-hidden rounded-lg ring-1 ring-foreground/10">
          <div className="flex-1" style={{ background: isHex(primary) ? primary : "#123c3e" }} />
          <div className="flex-1" style={{ background: isHex(secondary) ? secondary : "#f4f1ea" }} />
          <div className="flex-1" style={{ background: isHex(accent) ? accent : "#8a6232" }} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Display name"
            error={form.formState.errors.displayName?.message}
            {...form.register("displayName")}
          />
          <TextField label="Tagline" error={form.formState.errors.tagline?.message} {...form.register("tagline")} />
          <ColorField
            label="Primary"
            value={primary}
            error={form.formState.errors.primaryColor?.message}
            onPick={(color) => form.setValue("primaryColor", color, { shouldValidate: true })}
            registration={form.register("primaryColor")}
          />
          <ColorField
            label="Secondary"
            value={secondary}
            error={form.formState.errors.secondaryColor?.message}
            onPick={(color) => form.setValue("secondaryColor", color, { shouldValidate: true })}
            registration={form.register("secondaryColor")}
          />
          <ColorField
            label="Accent"
            value={accent}
            error={form.formState.errors.accentColor?.message}
            onPick={(color) => form.setValue("accentColor", color, { shouldValidate: true })}
            registration={form.register("accentColor")}
          />
          <div className="grid gap-2">
            <span className="text-sm font-medium">Logo</span>
            {logoUrl ? (
              <Image src={logoUrl} alt="" width={64} height={64} className="size-16 rounded-lg object-cover" />
            ) : null}
            <input
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
              className="text-sm file:mr-3 file:h-10 file:rounded-lg file:border-0 file:bg-muted file:px-3"
            />
          </div>
        </div>
        <TextAreaField label="Address" {...form.register("address")} />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="City" {...form.register("city")} />
          <TextField label="State" {...form.register("state")} />
          <TextField label="Pincode" {...form.register("pincode")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Phone on quote" {...form.register("phone")} />
          <TextField
            label="Email on quote"
            type="email"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
          <TextField label="Website" {...form.register("website")} />
          <TextField label="GSTIN" {...form.register("gstin")} />
        </div>
        <TextAreaField label="Footer note" {...form.register("footerNote")} />
        <TextAreaField label="Terms" {...form.register("terms")} />
      </FormSection>

      <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : creating ? "Create merchant" : "Save merchant"}
      </Button>

      {values.id ? (
        <FormSection title="Remove merchant" description="Deletes the login, branding, clients, and quotations for this showroom.">
          <DeleteButton label="Delete merchant" onConfirm={() => deleteMerchant(values.id!)} />
        </FormSection>
      ) : null}
    </form>
  )
}

function ColorField({
  label,
  value,
  error,
  onPick,
  registration,
}: {
  label: string
  value: string
  error?: string
  onPick: (color: string) => void
  registration: ReturnType<ReturnType<typeof useForm<MerchantFormValues>>["register"]>
}) {
  return (
    <div className="grid gap-2">
      <TextField label={label} error={error} {...registration} />
      <input
        type="color"
        aria-label={`${label} color`}
        value={isHex(value) ? value : "#123c3e"}
        onChange={(event) => onPick(event.target.value)}
        className="h-11 w-full cursor-pointer rounded-lg border border-input bg-transparent"
      />
    </div>
  )
}

function applyResult(
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

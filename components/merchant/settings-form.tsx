"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { FormSection } from "@/components/admin/form-section"
import { applyFormResult } from "@/components/merchant/form-result"
import { TextAreaField } from "@/components/forms/textarea-field"
import { TextField } from "@/components/forms/text-field"
import { Button } from "@/components/ui/button"
import { saveShowroomSettings } from "@/lib/merchant/settings-actions"
import {
  showroomSettingsSchema,
  type ShowroomSettingsValues,
} from "@/lib/validations/merchant"

function isHex(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

export function ShowroomSettingsForm({
  values,
  logoUrl,
}: {
  values: ShowroomSettingsValues
  logoUrl?: string | null
}) {
  const router = useRouter()
  const [logo, setLogo] = useState<File | null>(null)
  const form = useForm<ShowroomSettingsValues>({
    resolver: zodResolver(showroomSettingsSchema),
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
    applyFormResult(form, router, await saveShowroomSettings(body))
  })

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {form.formState.errors.root?.message ? (
        <p className="text-sm text-destructive" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <FormSection title="Printed on quotations" description="These details are copied when a quotation is created.">
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
          <TextField label="Tagline" {...form.register("tagline")} />
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
          <TextField label="Phone" {...form.register("phone")} />
          <TextField
            label="Email"
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
        {form.formState.isSubmitting ? "Saving…" : "Save details"}
      </Button>
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
  registration: ReturnType<ReturnType<typeof useForm<ShowroomSettingsValues>>["register"]>
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

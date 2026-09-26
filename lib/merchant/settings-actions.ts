"use server"

import { revalidatePath } from "next/cache"

import { isImageError, saveImage } from "@/lib/admin/images"
import { blankToNull, dbErrorMessage, type ActionResult } from "@/lib/admin/result"
import { merchantDb } from "@/lib/merchant/db"
import { STORAGE_BUCKETS } from "@/lib/storage/buckets"
import { showroomSettingsSchema } from "@/lib/validations/merchant"

function valuesFrom(formData: FormData) {
  const values: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value
  }
  return values
}

export async function saveShowroomSettings(formData: FormData): Promise<ActionResult> {
  const parsed = showroomSettingsSchema.safeParse(valuesFrom(formData))
  if (!parsed.success) return { ok: false, message: "Check the showroom details and try again." }

  const input = parsed.data
  const { supabase, workspace } = await merchantDb()

  const { error } = await supabase
    .from("merchant_branding")
    .update({
      display_name: input.displayName,
      tagline: blankToNull(input.tagline),
      primary_color: input.primaryColor,
      secondary_color: input.secondaryColor,
      accent_color: input.accentColor,
      address: blankToNull(input.address),
      city: blankToNull(input.city),
      state: blankToNull(input.state),
      pincode: blankToNull(input.pincode),
      phone: blankToNull(input.phone),
      email: blankToNull(input.email),
      website: blankToNull(input.website),
      gstin: blankToNull(input.gstin),
      footer_note: blankToNull(input.footerNote),
      terms: blankToNull(input.terms),
    })
    .eq("merchant_id", workspace.id)

  if (error) return { ok: false, message: dbErrorMessage(error) }

  const { data: current } = await supabase
    .from("merchant_branding")
    .select("logo_path")
    .eq("merchant_id", workspace.id)
    .maybeSingle()

  const image = await saveImage(
    supabase,
    formData.get("logo"),
    STORAGE_BUCKETS.merchantLogos,
    `${workspace.id}/logo`,
    current?.logo_path ?? null,
    2_097_152,
  )
  if (isImageError(image)) return { ok: false, message: image.error }
  if (image.path !== (current?.logo_path ?? null)) {
    await supabase
      .from("merchant_branding")
      .update({ logo_path: image.path })
      .eq("merchant_id", workspace.id)
  }

  revalidatePath("/merchant")
  revalidatePath("/merchant/settings")
  revalidatePath("/merchant/quotations")
  return { ok: true, message: "Showroom details saved." }
}

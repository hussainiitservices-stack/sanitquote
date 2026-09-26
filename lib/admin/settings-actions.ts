"use server"

import { revalidatePath } from "next/cache"

import { adminDb } from "@/lib/admin/db"
import { blankToNull, dbErrorMessage, type ActionResult } from "@/lib/admin/result"
import { settingsFormSchema, type SettingsFormValues } from "@/lib/validations/admin"

export async function saveSettings(input: SettingsFormValues): Promise<ActionResult> {
  const parsed = settingsFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Check the settings and try again." }

  const { supabase } = await adminDb()
  const { error } = await supabase.from("platform_settings").upsert({
    id: 1,
    platform_name: parsed.data.platformName,
    support_email: blankToNull(parsed.data.supportEmail),
    default_currency: parsed.data.defaultCurrency.toUpperCase(),
    default_tax_rate: Number(parsed.data.defaultTaxRate),
  })

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") {
      return {
        ok: false,
        message: "Apply the latest database migration before saving settings.",
      }
    }
    return { ok: false, message: dbErrorMessage(error, "Could not save settings.") }
  }

  revalidatePath("/admin/settings")
  revalidatePath("/admin")
  return { ok: true, message: "Settings saved." }
}

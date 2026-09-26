"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { adminAuth, adminDb } from "@/lib/admin/db"
import { isImageError, saveImage } from "@/lib/admin/images"
import { blankToNull, dbErrorMessage, type ActionResult } from "@/lib/admin/result"
import { merchantAuthEmail } from "@/lib/auth/identity"
import { STORAGE_BUCKETS } from "@/lib/storage/buckets"
import { merchantFormSchema } from "@/lib/validations/admin"

function valuesFrom(formData: FormData) {
  const values: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value
  }
  return values
}

function refreshMerchantPaths(id?: string) {
  revalidatePath("/admin")
  revalidatePath("/admin/merchants")
  revalidatePath("/admin/access")
  if (id) revalidatePath(`/admin/merchants/${id}`)
}

export async function saveMerchant(formData: FormData): Promise<ActionResult> {
  const parsed = merchantFormSchema.safeParse(valuesFrom(formData))
  if (!parsed.success) {
    return { ok: false, message: "Check the highlighted fields and try again." }
  }

  const input = parsed.data
  const { supabase } = await adminDb()
  const creating = !input.id
  let merchantId = input.id ?? ""
  let previousUsername = input.username

  if (!creating) {
    const { data: existing } = await supabase
      .from("merchants")
      .select("slug")
      .eq("id", merchantId)
      .maybeSingle()
    previousUsername = existing?.slug ?? input.username
  }

  if (creating) {
    const { data, error } = await supabase
      .from("merchants")
      .insert({
        name: input.name,
        slug: input.username,
        status: input.status,
        subscription_starts_on: input.subscriptionStartsOn,
        subscription_ends_on: input.subscriptionEndsOn,
        contact_email: blankToNull(input.contactEmail),
        contact_phone: blankToNull(input.contactPhone),
      })
      .select("id")
      .single()

    if (error || !data) {
      return { ok: false, message: dbErrorMessage(error ?? { message: "" }) }
    }
    merchantId = data.id
  } else {
    const { error } = await supabase
      .from("merchants")
      .update({
        name: input.name,
        slug: input.username,
        status: input.status,
        subscription_starts_on: input.subscriptionStartsOn,
        subscription_ends_on: input.subscriptionEndsOn,
        contact_email: blankToNull(input.contactEmail),
        contact_phone: blankToNull(input.contactPhone),
      })
      .eq("id", merchantId)

    if (error) return { ok: false, message: dbErrorMessage(error) }
  }

  const { error: brandingError } = await supabase
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
    .eq("merchant_id", merchantId)

  if (brandingError) {
    if (creating) await supabase.from("merchants").delete().eq("id", merchantId)
    return { ok: false, message: dbErrorMessage(brandingError) }
  }

  const { data: currentBranding } = await supabase
    .from("merchant_branding")
    .select("logo_path")
    .eq("merchant_id", merchantId)
    .maybeSingle()

  const image = await saveImage(
    supabase,
    formData.get("logo"),
    STORAGE_BUCKETS.merchantLogos,
    `${merchantId}/logo`,
    currentBranding?.logo_path ?? null,
    2_097_152,
  )
  if (isImageError(image)) {
    if (creating) await supabase.from("merchants").delete().eq("id", merchantId)
    return { ok: false, message: image.error }
  }
  if (image.path !== (currentBranding?.logo_path ?? null)) {
    await supabase
      .from("merchant_branding")
      .update({ logo_path: image.path })
      .eq("merchant_id", merchantId)
  }

  const auth = await adminAuth()
  const loginEmail = merchantAuthEmail(input.username)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .or(`merchant_id.eq.${merchantId},email.eq.${loginEmail}`)
    .limit(1)
  const profileId = profiles?.[0]?.id ?? null

  if (!profileId) {
    const { data: created, error: authError } = await auth.auth.admin.createUser({
      email: loginEmail,
      password: input.password,
      email_confirm: true,
      app_metadata: { role: "merchant", merchant_id: merchantId },
      user_metadata: { full_name: input.displayName },
    })
    if (authError || !created.user) {
      if (creating) await supabase.from("merchants").delete().eq("id", merchantId)
      return {
        ok: false,
        message: authError?.message ?? "Could not create the merchant login.",
      }
    }
    const { error: profileError } = await auth
      .from("profiles")
      .update({
        role: "merchant",
        merchant_id: merchantId,
        full_name: input.displayName,
      })
      .eq("id", created.user.id)
    if (profileError) {
      if (creating) {
        await auth.auth.admin.deleteUser(created.user.id)
        await supabase.from("merchants").delete().eq("id", merchantId)
      }
      return { ok: false, message: "Could not attach the merchant login." }
    }
  } else {
    if (input.password.trim()) {
      const { error } = await auth.auth.admin.updateUserById(profileId, {
        password: input.password,
      })
      if (error) return { ok: false, message: "Could not update the password." }
    }
    if (previousUsername !== input.username) {
      const { error: emailError } = await auth.auth.admin.updateUserById(profileId, {
        email: merchantAuthEmail(input.username),
        user_metadata: { full_name: input.displayName },
      })
      if (emailError) return { ok: false, message: "Could not update the username." }
    } else {
      await auth.auth.admin.updateUserById(profileId, {
        user_metadata: { full_name: input.displayName },
      })
    }
    await supabase
      .from("profiles")
      .update({
        role: "merchant",
        merchant_id: merchantId,
        full_name: input.displayName,
      })
      .eq("id", profileId)
  }

  refreshMerchantPaths(merchantId)
  return {
    ok: true,
    href: creating ? `/admin/merchants/${merchantId}` : undefined,
    message: creating ? "Merchant created." : "Merchant saved.",
  }
}

export async function deleteMerchant(id: string): Promise<ActionResult> {
  const { supabase } = await adminDb()
  const auth = await adminAuth()
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("merchant_id", id)

  if (error) return { ok: false, message: "Could not remove the merchant login." }

  for (const profile of profiles ?? []) {
    const { error: deleteError } = await auth.auth.admin.deleteUser(profile.id)
    if (deleteError) return { ok: false, message: "Could not remove the merchant login." }
  }

  const { error: merchantError } = await supabase.from("merchants").delete().eq("id", id)
  if (merchantError) return { ok: false, message: dbErrorMessage(merchantError) }

  refreshMerchantPaths()
  redirect("/admin/merchants")
}

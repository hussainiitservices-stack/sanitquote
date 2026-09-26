"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { adminDb } from "@/lib/admin/db"
import { isImageError, saveImage } from "@/lib/admin/images"
import { blankToNull, dbErrorMessage, type ActionResult } from "@/lib/admin/result"
import { STORAGE_BUCKETS } from "@/lib/storage/buckets"
import { companyFormSchema, productFormSchema } from "@/lib/validations/admin"

function valuesFrom(formData: FormData) {
  const values: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value
  }
  return values
}

function refreshCatalog() {
  revalidatePath("/admin")
  revalidatePath("/admin/companies")
  revalidatePath("/admin/products")
  revalidatePath("/admin/access")
}

export async function saveCompany(formData: FormData): Promise<ActionResult> {
  const parsed = companyFormSchema.safeParse(valuesFrom(formData))
  if (!parsed.success) return { ok: false, message: "Check the brand fields and try again." }

  const input = parsed.data
  const { supabase } = await adminDb()
  const creating = !input.id
  let companyId = input.id ?? ""

  if (creating) {
    const { data, error } = await supabase
      .from("companies")
      .insert({
        name: input.name,
        slug: input.slug,
        description: blankToNull(input.description),
        is_active: input.isActive === "true",
      })
      .select("id")
      .single()
    if (error || !data) return { ok: false, message: dbErrorMessage(error ?? { message: "" }) }
    companyId = data.id
  } else {
    const { error } = await supabase
      .from("companies")
      .update({
        name: input.name,
        slug: input.slug,
        description: blankToNull(input.description),
        is_active: input.isActive === "true",
      })
      .eq("id", companyId)
    if (error) return { ok: false, message: dbErrorMessage(error) }
  }

  const { data: current } = await supabase
    .from("companies")
    .select("logo_path")
    .eq("id", companyId)
    .maybeSingle()

  const image = await saveImage(
    supabase,
    formData.get("logo"),
    STORAGE_BUCKETS.brandAssets,
    `companies/${companyId}/logo`,
    current?.logo_path ?? null,
    2_097_152,
  )
  if (isImageError(image)) {
    if (creating) await supabase.from("companies").delete().eq("id", companyId)
    return { ok: false, message: image.error }
  }
  if (image.path !== (current?.logo_path ?? null)) {
    await supabase.from("companies").update({ logo_path: image.path }).eq("id", companyId)
  }

  refreshCatalog()
  revalidatePath(`/admin/companies/${companyId}`)
  return {
    ok: true,
    href: creating ? `/admin/companies/${companyId}` : undefined,
    message: creating ? "Brand created." : "Brand saved.",
  }
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  const { supabase } = await adminDb()
  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("company_id", id)

  if (countError) return { ok: false, message: "Could not delete the brand." }
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      message: "Delete or move this brand's products before deleting the brand.",
    }
  }

  const { error } = await supabase.from("companies").delete().eq("id", id)
  if (error) return { ok: false, message: dbErrorMessage(error) }

  refreshCatalog()
  redirect("/admin/companies")
}

export async function saveProduct(formData: FormData): Promise<ActionResult> {
  const parsed = productFormSchema.safeParse(valuesFrom(formData))
  if (!parsed.success) return { ok: false, message: "Check the product fields and try again." }

  const input = parsed.data
  const { supabase } = await adminDb()
  const creating = !input.id
  const payload = {
    company_id: input.companyId,
    sku: input.sku,
    name: input.name,
    description: blankToNull(input.description),
    category: blankToNull(input.category),
    finish: blankToNull(input.finish),
    unit: input.unit,
    hsn_code: blankToNull(input.hsnCode),
    list_price: Number(input.listPrice),
    currency: input.currency.toUpperCase(),
    specifications: input.details ? { details: input.details } : {},
    is_active: input.isActive === "true",
  }
  let productId = input.id ?? ""

  if (creating) {
    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single()
    if (error || !data) return { ok: false, message: dbErrorMessage(error ?? { message: "" }, "Could not save the product.") }
    productId = data.id
  } else {
    const { error } = await supabase.from("products").update(payload).eq("id", productId)
    if (error) return { ok: false, message: dbErrorMessage(error, "Could not save the product.") }
  }

  const { data: current } = await supabase
    .from("products")
    .select("image_path")
    .eq("id", productId)
    .maybeSingle()

  const image = await saveImage(
    supabase,
    formData.get("image"),
    STORAGE_BUCKETS.brandAssets,
    `products/${productId}/image`,
    current?.image_path ?? null,
    5_242_880,
  )
  if (isImageError(image)) {
    if (creating) await supabase.from("products").delete().eq("id", productId)
    return { ok: false, message: image.error }
  }
  if (image.path !== (current?.image_path ?? null)) {
    await supabase.from("products").update({ image_path: image.path }).eq("id", productId)
  }

  refreshCatalog()
  revalidatePath(`/admin/products/${productId}`)
  return {
    ok: true,
    href: creating ? `/admin/products/${productId}` : undefined,
    message: creating ? "Product created." : "Product saved.",
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const { supabase } = await adminDb()
  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) return { ok: false, message: dbErrorMessage(error, "Could not delete the product.") }
  refreshCatalog()
  redirect("/admin/products")
}

export async function setCompanyAccess(
  merchantId: string,
  companyId: string,
  enabled: boolean,
): Promise<ActionResult> {
  const { supabase, user } = await adminDb()

  if (enabled) {
    const { error } = await supabase.from("merchant_company_access").upsert(
      {
        merchant_id: merchantId,
        company_id: companyId,
        granted_by: user.id,
      },
      { onConflict: "merchant_id,company_id" },
    )
    if (error) return { ok: false, message: "Could not enable that brand." }
  } else {
    const { error } = await supabase
      .from("merchant_company_access")
      .delete()
      .eq("merchant_id", merchantId)
      .eq("company_id", companyId)
    if (error) return { ok: false, message: "Could not disable that brand." }
  }

  revalidatePath("/admin/access")
  revalidatePath(`/admin/merchants/${merchantId}`)
  return { ok: true }
}

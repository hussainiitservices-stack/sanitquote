"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { blankToNull, dbErrorMessage, isUuid, searchTerm, type ActionResult } from "@/lib/admin/result"
import {
  calculateLine,
  calculateQuoteTotals,
  nextQuotationNumber,
  quotationIsFrozen,
} from "@/lib/domain/quotations"
import { asNumber } from "@/lib/format/money"
import { formatAddress, merchantDb, writeBlocked } from "@/lib/merchant/db"
import {
  quotationFormSchema,
  quotationStatusSchema,
  type QuotationFormValues,
} from "@/lib/validations/merchant"

function refreshQuotes(id?: string) {
  revalidatePath("/merchant")
  revalidatePath("/merchant/quotations")
  if (id) revalidatePath(`/merchant/quotations/${id}`)
}

export type CatalogPick = {
  id: string
  name: string
  sku: string
  companyName: string
  listPrice: number
  currency: string
  unit: string
  imagePath: string | null
}

export async function searchCatalog(q?: string): Promise<CatalogPick[]> {
  const { supabase } = await merchantDb()
  const term = searchTerm(q)
  let query = supabase
    .from("products")
    .select("id, name, sku, company_id, list_price, currency, unit, image_path")
    .order("name")
    .limit(20)

  if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`)

  const { data, error } = await query
  if (error) {
    console.error("search catalog", error.code)
    return []
  }

  const companyIds = [...new Set((data ?? []).map((row) => row.company_id))]
  const names = new Map<string, string>()
  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", companyIds)
    for (const company of companies ?? []) names.set(company.id, company.name)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    companyName: names.get(row.company_id) ?? "Brand",
    listPrice: asNumber(row.list_price),
    currency: row.currency,
    unit: row.unit,
    imagePath: row.image_path,
  }))
}

async function nextNumber(
  supabase: Awaited<ReturnType<typeof merchantDb>>["supabase"],
  merchantId: string,
) {
  const year = new Date().getUTCFullYear()
  const { data } = await supabase
    .from("quotations")
    .select("quotation_number")
    .eq("merchant_id", merchantId)
    .like("quotation_number", `SQ-${year}-%`)

  return nextQuotationNumber((data ?? []).map((row) => row.quotation_number), year)
}

export async function saveQuotation(input: QuotationFormValues): Promise<ActionResult> {
  const parsed = quotationFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Check the quotation and add at least one product." }

  const values = parsed.data
  const { supabase, user, workspace } = await merchantDb()
  const blocked = writeBlocked(workspace.subscriptionActive)
  if (blocked) return blocked

  if (values.id) {
    const { data: current } = await supabase
      .from("quotations")
      .select("id, status")
      .eq("id", values.id)
      .maybeSingle()
    if (!current) return { ok: false, message: "That quotation could not be found." }
    if (quotationIsFrozen(current.status)) {
      return { ok: false, message: "This quotation is locked. Duplicate it to make changes." }
    }
  }

  const [{ data: client }, { data: branding }, { data: settings }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, phone, email, address, city, state, pincode, gstin")
      .eq("id", values.clientId)
      .maybeSingle(),
    supabase.from("merchant_branding").select("*").eq("merchant_id", workspace.id).maybeSingle(),
    supabase.from("platform_settings").select("default_currency").eq("id", 1).maybeSingle(),
  ])

  if (!client) return { ok: false, message: "Choose a client that belongs to this showroom." }

  const productIds = values.items.map((item) => item.productId)
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, company_id, sku, name, description, unit, list_price, currency, image_path")
    .in("id", productIds)

  if (productError) return { ok: false, message: "Could not load the selected products." }

  const productMap = new Map((products ?? []).map((product) => [product.id, product]))
  if (productMap.size !== new Set(productIds).size) {
    return { ok: false, message: "A selected product is no longer available." }
  }

  const companyIds = [...new Set([...productMap.values()].map((product) => product.company_id))]
  const { data: companies } = await supabase.from("companies").select("id, name").in("id", companyIds)
  const companyNames = new Map((companies ?? []).map((company) => [company.id, company.name]))

  const lines = values.items.map((item, index) => {
    const product = productMap.get(item.productId)!
    const quantity = Number(item.quantity)
    const unitPrice = Number(item.unitPrice)
    const discountAmount = Number(item.discountAmount)
    const taxRate = Number(item.taxRate)
    const computed = calculateLine({ quantity, unitPrice, discountAmount, taxRate })
    return {
      row: {
        merchant_id: workspace.id,
        product_id: product.id,
        company_id: product.company_id,
        sort_order: index,
        company_name: companyNames.get(product.company_id) ?? "Brand",
        product_name: product.name,
        sku: product.sku,
        description: product.description,
        image_path: product.image_path,
        unit: product.unit,
        unit_price: unitPrice,
        quantity,
        discount_amount: discountAmount,
        tax_rate: taxRate,
        line_subtotal: computed.lineSubtotal,
        line_tax: computed.lineTax,
        line_total: computed.lineTotal,
        specifications: {},
      },
      quantity,
      unitPrice,
      discountAmount,
      ...computed,
      currency: product.currency,
    }
  })

  const totals = calculateQuoteTotals(lines)
  const currency = settings?.default_currency ?? lines[0]?.currency ?? "INR"
  const brandingAddress = formatAddress([
    branding?.address,
    branding?.city,
    branding?.state,
    branding?.pincode,
  ])

  const header = {
    merchant_id: workspace.id,
    client_id: client.id,
    site_id: null,
    issue_date: values.issueDate,
    valid_until: blankToNull(values.validUntil),
    currency,
    notes: blankToNull(values.notes),
    terms: blankToNull(values.terms),
    client_name: client.name,
    client_phone: client.phone,
    client_email: client.email,
    client_address: formatAddress([client.address, client.city, client.state, client.pincode]),
    client_gstin: client.gstin,
    site_name: null,
    site_address: blankToNull(values.siteAddress),
    branding_display_name: branding?.display_name ?? workspace.name,
    branding_logo_path: branding?.logo_path ?? null,
    branding_primary_color: branding?.primary_color ?? "#123c3e",
    branding_secondary_color: branding?.secondary_color ?? "#f4f1ea",
    branding_accent_color: branding?.accent_color ?? "#8a6232",
    branding_phone: branding?.phone ?? null,
    branding_email: branding?.email ?? null,
    branding_address: brandingAddress,
    branding_gstin: branding?.gstin ?? null,
    branding_website: branding?.website ?? null,
    branding_footer_note: branding?.footer_note ?? null,
    subtotal: totals.subtotal,
    discount_total: totals.discount,
    tax_total: totals.tax,
    grand_total: totals.grandTotal,
    created_by: user.id,
  }

  let quotationId = values.id ?? ""

  if (values.id) {
    const { error } = await supabase.from("quotations").update(header).eq("id", values.id)
    if (error) return { ok: false, message: dbErrorMessage(error) }
    await supabase.from("quotation_items").delete().eq("quotation_id", values.id)
  } else {
    let created = false
    for (let attempt = 0; attempt < 2 && !created; attempt += 1) {
      const quotation_number = await nextNumber(supabase, workspace.id)
      const { data, error } = await supabase
        .from("quotations")
        .insert({ ...header, quotation_number, status: "draft" as const })
        .select("id")
        .single()
      if (!error && data) {
        quotationId = data.id
        created = true
        break
      }
      if (error?.code !== "23505" || attempt === 1) {
        return { ok: false, message: dbErrorMessage(error ?? { message: "" }) }
      }
    }
  }

  const { error: itemError } = await supabase.from("quotation_items").insert(
    lines.map((line) => ({
      ...line.row,
      quotation_id: quotationId,
    })),
  )

  if (itemError) {
    if (!values.id) await supabase.from("quotations").delete().eq("id", quotationId)
    return { ok: false, message: dbErrorMessage(itemError, "Could not save the line items.") }
  }

  refreshQuotes(quotationId)
  return {
    ok: true,
    href: values.id ? undefined : `/merchant/quotations/${quotationId}`,
    message: values.id ? "Quotation saved." : "Draft created.",
  }
}

export async function setQuotationStatus(input: {
  id: string
  status: string
}): Promise<ActionResult> {
  const parsed = quotationStatusSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Choose a valid status." }

  const { supabase, workspace } = await merchantDb()
  const blocked = writeBlocked(workspace.subscriptionActive)
  if (blocked) return blocked

  const { data: current } = await supabase
    .from("quotations")
    .select("id, status")
    .eq("id", parsed.data.id)
    .maybeSingle()
  if (!current) return { ok: false, message: "That quotation could not be found." }
  const { error } = await supabase
    .from("quotations")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
  if (error) return { ok: false, message: dbErrorMessage(error) }
  refreshQuotes(parsed.data.id)
  return { ok: true, message: "Status updated." }
}

export async function duplicateQuotation(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return { ok: false, message: "That quotation could not be found." }
  const { supabase, user, workspace } = await merchantDb()
  const blocked = writeBlocked(workspace.subscriptionActive)
  if (blocked) return blocked

  const { data: source, error } = await supabase.from("quotations").select("*").eq("id", id).maybeSingle()
  if (error || !source) return { ok: false, message: "That quotation could not be found." }

  const { data: items, error: itemError } = await supabase
    .from("quotation_items")
    .select("*")
    .eq("quotation_id", id)
    .order("sort_order")
  if (itemError) return { ok: false, message: "Could not copy the quotation." }

  const today = new Date().toISOString().slice(0, 10)
  let createdId = ""

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const quotation_number = await nextNumber(supabase, workspace.id)
    const { data, error: insertError } = await supabase
      .from("quotations")
      .insert({
        merchant_id: workspace.id,
        client_id: source.client_id,
        site_id: source.site_id,
        quotation_number,
        status: "draft",
        issue_date: today,
        valid_until: source.valid_until,
        currency: source.currency,
        notes: source.notes,
        terms: source.terms,
        client_name: source.client_name,
        client_phone: source.client_phone,
        client_email: source.client_email,
        client_address: source.client_address,
        client_gstin: source.client_gstin,
        site_name: source.site_name,
        site_address: source.site_address,
        branding_display_name: source.branding_display_name,
        branding_logo_path: source.branding_logo_path,
        branding_primary_color: source.branding_primary_color,
        branding_secondary_color: source.branding_secondary_color,
        branding_accent_color: source.branding_accent_color,
        branding_phone: source.branding_phone,
        branding_email: source.branding_email,
        branding_address: source.branding_address,
        branding_gstin: source.branding_gstin,
        branding_website: source.branding_website,
        branding_footer_note: source.branding_footer_note,
        subtotal: source.subtotal,
        discount_total: source.discount_total,
        tax_total: source.tax_total,
        grand_total: source.grand_total,
        created_by: user.id,
      })
      .select("id")
      .single()

    if (!insertError && data) {
      createdId = data.id
      break
    }
    if (insertError?.code !== "23505" || attempt === 1) {
      return { ok: false, message: dbErrorMessage(insertError ?? { message: "" }) }
    }
  }

  const { error: copyError } = await supabase.from("quotation_items").insert(
    (items ?? []).map((item) => ({
      quotation_id: createdId,
      merchant_id: workspace.id,
      product_id: item.product_id,
      company_id: item.company_id,
      sort_order: item.sort_order,
      company_name: item.company_name,
      product_name: item.product_name,
      sku: item.sku,
      description: item.description,
      image_path: item.image_path,
      unit: item.unit,
      unit_price: item.unit_price,
      quantity: item.quantity,
      discount_amount: item.discount_amount,
      tax_rate: item.tax_rate,
      line_subtotal: item.line_subtotal,
      line_tax: item.line_tax,
      line_total: item.line_total,
      specifications: item.specifications,
    })),
  )

  if (copyError) {
    await supabase.from("quotations").delete().eq("id", createdId)
    return { ok: false, message: dbErrorMessage(copyError, "Could not copy the line items.") }
  }

  refreshQuotes(createdId)
  return { ok: true, href: `/merchant/quotations/${createdId}`, message: "Draft copied." }
}

export async function deleteQuotation(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return { ok: false, message: "That quotation could not be found." }
  const { supabase, workspace } = await merchantDb()
  const blocked = writeBlocked(workspace.subscriptionActive)
  if (blocked) return blocked

  const { data: current } = await supabase
    .from("quotations")
    .select("status")
    .eq("id", id)
    .maybeSingle()
  if (!current) return { ok: false, message: "That quotation could not be found." }
  if (quotationIsFrozen(current.status)) {
    return { ok: false, message: "Only drafts can be deleted. Change the status to cancelled instead." }
  }

  const { error } = await supabase.from("quotations").delete().eq("id", id)
  if (error) return { ok: false, message: dbErrorMessage(error) }
  refreshQuotes()
  redirect("/merchant/quotations")
}

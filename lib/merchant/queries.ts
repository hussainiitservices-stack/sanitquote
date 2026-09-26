import "server-only"

import { merchantDb } from "@/lib/merchant/db"
import {
  isUuid,
  PAGE_SIZE,
  readPage,
  searchTerm,
  toPage,
  type Page,
} from "@/lib/admin/result"
import { isQuotationStatus } from "@/lib/domain/quotations"
import { asNumber } from "@/lib/format/money"
import { toQuotationDocument, type QuotationDocument } from "@/lib/pdf/quotation-document"
import type { QuotationStatus } from "@/types/database"

export type ClientListItem = {
  id: string
  name: string
  phone: string | null
  email: string | null
  city: string | null
}

export async function listClients(params: {
  page?: string
  q?: string
}): Promise<Page<ClientListItem>> {
  const { supabase } = await merchantDb()
  const page = readPage(params.page)
  const q = searchTerm(params.q)
  let query = supabase
    .from("clients")
    .select("id, name, phone, email, city", { count: "exact" })

  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)

  const { data, error, count } = await query
    .order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (error) {
    console.error("list clients", error.code)
    throw new Error("Could not load clients.")
  }

  return toPage(data ?? [], page, count ?? 0)
}

export async function getClient(id: string) {
  if (!isUuid(id)) return null
  const { supabase } = await merchantDb()
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, phone, email, address, city, state, pincode, gstin, notes")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("get client", error.code)
    throw new Error("Could not load the client.")
  }
  return data
}

export async function listClientOptions() {
  const { supabase } = await merchantDb()
  const { data, error } = await supabase.from("clients").select("id, name").order("name")
  if (error) {
    console.error("client options", error.code)
    throw new Error("Could not load clients.")
  }
  return data ?? []
}

export type CatalogProduct = {
  id: string
  name: string
  sku: string
  companyId: string
  companyName: string
  listPrice: number
  currency: string
  unit: string
  imagePath: string | null
  category: string | null
  finish: string | null
  description: string | null
}

async function companyNames(
  supabase: Awaited<ReturnType<typeof merchantDb>>["supabase"],
  ids: string[],
) {
  const names = new Map<string, string>()
  if (ids.length === 0) return names
  const { data, error } = await supabase.from("companies").select("id, name").in("id", ids)
  if (error) {
    console.error("catalog brands", error.code)
    throw new Error("Could not load the catalog.")
  }
  for (const company of data ?? []) names.set(company.id, company.name)
  return names
}

export async function listCatalog(params: {
  page?: string
  q?: string
  company?: string
}): Promise<Page<CatalogProduct>> {
  const { supabase } = await merchantDb()
  const page = readPage(params.page)
  const q = searchTerm(params.q)
  let query = supabase
    .from("products")
    .select(
      "id, name, sku, company_id, list_price, currency, unit, image_path, category, finish, description",
      { count: "exact" },
    )

  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
  if (isUuid(params.company)) query = query.eq("company_id", params.company)

  const { data, error, count } = await query
    .order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (error) {
    console.error("list catalog", error.code)
    throw new Error("Could not load the catalog.")
  }

  const names = await companyNames(
    supabase,
    [...new Set((data ?? []).map((row) => row.company_id))],
  )

  return toPage(
    (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      companyId: row.company_id,
      companyName: names.get(row.company_id) ?? "Brand",
      listPrice: asNumber(row.list_price),
      currency: row.currency,
      unit: row.unit,
      imagePath: row.image_path,
      category: row.category,
      finish: row.finish,
      description: row.description,
    })),
    page,
    count ?? 0,
  )
}

export async function getCatalogProduct(id: string): Promise<CatalogProduct | null> {
  if (!isUuid(id)) return null
  const { supabase } = await merchantDb()
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, sku, company_id, list_price, currency, unit, image_path, category, finish, description",
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("get catalog product", error.code)
    throw new Error("Could not load the product.")
  }
  if (!data) return null

  const names = await companyNames(supabase, [data.company_id])
  return {
    id: data.id,
    name: data.name,
    sku: data.sku,
    companyId: data.company_id,
    companyName: names.get(data.company_id) ?? "Brand",
    listPrice: asNumber(data.list_price),
    currency: data.currency,
    unit: data.unit,
    imagePath: data.image_path,
    category: data.category,
    finish: data.finish,
    description: data.description,
  }
}

export async function listGrantedCompanies() {
  const { supabase } = await merchantDb()
  const { data, error } = await supabase.from("companies").select("id, name").order("name")
  if (error) {
    console.error("granted companies", error.code)
    throw new Error("Could not load brands.")
  }
  return data ?? []
}

export type QuotationListItem = {
  id: string
  number: string
  clientName: string
  siteAddress: string | null
  status: QuotationStatus
  issueDate: string
  total: number
  currency: string
}

export async function listMerchantQuotations(params: {
  page?: string
  q?: string
  status?: string
}): Promise<Page<QuotationListItem>> {
  const { supabase } = await merchantDb()
  const page = readPage(params.page)
  const q = searchTerm(params.q)
  let query = supabase
    .from("quotations")
    .select(
      "id, quotation_number, client_name, site_address, site_name, status, issue_date, grand_total, currency",
      { count: "exact" },
    )

  if (q) query = query.or(`quotation_number.ilike.%${q}%,client_name.ilike.%${q}%`)
  if (params.status && isQuotationStatus(params.status)) {
    query = query.eq("status", params.status)
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (error) {
    console.error("list merchant quotations", error.code)
    throw new Error("Could not load quotations.")
  }

  return toPage(
    (data ?? []).map((row) => ({
      id: row.id,
      number: row.quotation_number,
      clientName: row.client_name,
      siteAddress: row.site_address || row.site_name,
      status: row.status,
      issueDate: row.issue_date,
      total: asNumber(row.grand_total),
      currency: row.currency,
    })),
    page,
    count ?? 0,
  )
}

export type QuotationRecord = {
  id: string
  number: string
  status: QuotationStatus
  clientId: string | null
  issueDate: string
  validUntil: string | null
  currency: string
  notes: string
  terms: string
  clientName: string
  siteAddress: string | null
  items: Array<{
    id: string
    productId: string | null
    productName: string
    companyName: string
    sku: string | null
    unit: string
    quantity: number
    unitPrice: number
    discountAmount: number
    taxRate: number
    lineTotal: number
  }>
  totals: {
    subtotal: number
    discount: number
    tax: number
    grandTotal: number
  }
}

export async function getMerchantQuotation(id: string): Promise<QuotationRecord | null> {
  if (!isUuid(id)) return null
  const { supabase } = await merchantDb()
  const { data, error } = await supabase.from("quotations").select("*").eq("id", id).maybeSingle()

  if (error) {
    console.error("get merchant quotation", error.code)
    throw new Error("Could not load the quotation.")
  }
  if (!data) return null

  const { data: items, error: itemError } = await supabase
    .from("quotation_items")
    .select(
      "id, product_id, product_name, company_name, sku, unit, quantity, unit_price, discount_amount, tax_rate, line_total",
    )
    .eq("quotation_id", id)
    .order("sort_order")

  if (itemError) {
    console.error("quotation items", itemError.code)
    throw new Error("Could not load the quotation.")
  }

  return {
    id: data.id,
    number: data.quotation_number,
    status: data.status,
    clientId: data.client_id,
    issueDate: data.issue_date,
    validUntil: data.valid_until,
    currency: data.currency,
    notes: data.notes ?? "",
    terms: data.terms ?? "",
    clientName: data.client_name,
    siteAddress: data.site_address || data.site_name,
    items: (items ?? []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      companyName: item.company_name,
      sku: item.sku,
      unit: item.unit,
      quantity: asNumber(item.quantity),
      unitPrice: asNumber(item.unit_price),
      discountAmount: asNumber(item.discount_amount),
      taxRate: asNumber(item.tax_rate),
      lineTotal: asNumber(item.line_total),
    })),
    totals: {
      subtotal: asNumber(data.subtotal),
      discount: asNumber(data.discount_total),
      tax: asNumber(data.tax_total),
      grandTotal: asNumber(data.grand_total),
    },
  }
}

export async function getQuotationDocument(id: string): Promise<QuotationDocument | null> {
  if (!isUuid(id)) return null
  const { supabase } = await merchantDb()
  const { data, error } = await supabase.from("quotations").select("*").eq("id", id).maybeSingle()
  if (error) {
    console.error("quotation document", error.code)
    throw new Error("Could not load the quotation.")
  }
  if (!data) return null

  const { data: items, error: itemError } = await supabase
    .from("quotation_items")
    .select(
      "product_id, sort_order, company_name, product_name, sku, description, image_path, unit, quantity, unit_price, discount_amount, tax_rate, line_subtotal, line_tax, line_total",
    )
    .eq("quotation_id", id)
    .order("sort_order")

  if (itemError) {
    console.error("quotation document items", itemError.code)
    throw new Error("Could not load the quotation.")
  }

  const missingImageIds = [
    ...new Set(
      (items ?? [])
        .filter((item) => !item.image_path && item.product_id)
        .map((item) => item.product_id as string),
    ),
  ]
  const liveImages = new Map<string, string>()
  if (missingImageIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, image_path")
      .in("id", missingImageIds)
    for (const product of products ?? []) {
      if (product.image_path) liveImages.set(product.id, product.image_path)
    }
  }

  return toQuotationDocument({
    number: data.quotation_number,
    status: data.status,
    issueDate: data.issue_date,
    validUntil: data.valid_until,
    currency: data.currency,
    notes: data.notes,
    terms: data.terms,
    merchant: {
      displayName: data.branding_display_name,
      logoPath: data.branding_logo_path,
      primaryColor: data.branding_primary_color,
      secondaryColor: data.branding_secondary_color,
      accentColor: data.branding_accent_color,
      phone: data.branding_phone,
      email: data.branding_email,
      address: data.branding_address,
      gstin: data.branding_gstin,
      website: data.branding_website,
      footerNote: data.branding_footer_note,
    },
    client: {
      name: data.client_name,
      phone: data.client_phone,
      email: data.client_email,
      address: data.client_address,
      gstin: data.client_gstin,
    },
    site:
      data.site_address || data.site_name
        ? {
            name: data.site_name || "Site",
            address: data.site_address || data.site_name,
          }
        : null,
    items: (items ?? []).map((item) => ({
      sortOrder: item.sort_order,
      companyName: item.company_name,
      productName: item.product_name,
      sku: item.sku,
      description: item.description,
      imagePath: item.image_path ?? (item.product_id ? liveImages.get(item.product_id) ?? null : null),
      unit: item.unit,
      quantity: asNumber(item.quantity),
      unitPrice: asNumber(item.unit_price),
      discountAmount: asNumber(item.discount_amount),
      taxRate: asNumber(item.tax_rate),
      lineSubtotal: asNumber(item.line_subtotal),
      lineTax: asNumber(item.line_tax),
      lineTotal: asNumber(item.line_total),
    })),
    totals: {
      subtotal: asNumber(data.subtotal),
      discount: asNumber(data.discount_total),
      tax: asNumber(data.tax_total),
      grandTotal: asNumber(data.grand_total),
    },
  })
}

export async function getShowroomSettings() {
  const { supabase, workspace } = await merchantDb()
  const { data, error } = await supabase
    .from("merchant_branding")
    .select(
      "display_name, tagline, logo_path, primary_color, secondary_color, accent_color, address, city, state, pincode, phone, email, website, gstin, footer_note, terms",
    )
    .eq("merchant_id", workspace.id)
    .maybeSingle()

  if (error) {
    console.error("showroom settings", error.code)
    throw new Error("Could not load showroom details.")
  }

  return {
    displayName: data?.display_name ?? workspace.name,
    tagline: data?.tagline ?? "",
    logoPath: data?.logo_path ?? null,
    primaryColor: data?.primary_color ?? "#123c3e",
    secondaryColor: data?.secondary_color ?? "#f4f1ea",
    accentColor: data?.accent_color ?? "#8a6232",
    address: data?.address ?? "",
    city: data?.city ?? "",
    state: data?.state ?? "",
    pincode: data?.pincode ?? "",
    phone: data?.phone ?? "",
    email: data?.email ?? "",
    website: data?.website ?? "",
    gstin: data?.gstin ?? "",
    footerNote: data?.footer_note ?? "",
    terms: data?.terms ?? "",
  }
}

export async function getPlatformDefaults() {
  const { supabase } = await merchantDb()
  const { data, error } = await supabase
    .from("platform_settings")
    .select("default_currency, default_tax_rate")
    .eq("id", 1)
    .maybeSingle()

  if (error && error.code !== "PGRST205" && error.code !== "42P01") {
    console.error("platform defaults", error.code)
  }

  return {
    currency: data?.default_currency ?? "INR",
    taxRate: data ? asNumber(data.default_tax_rate) : 18,
  }
}

export async function getMerchantDashboard() {
  const { supabase } = await merchantDb()
  const [quotations, drafts, clients, companies, recent] = await Promise.all([
    supabase.from("quotations").select("id", { count: "exact", head: true }),
    supabase.from("quotations").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase
      .from("quotations")
      .select("id, quotation_number, client_name, status, grand_total, currency, issue_date")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const failed = [quotations, drafts, clients, companies, recent].find((result) => result.error)
  if (failed?.error) {
    console.error("merchant dashboard", failed.error.code)
    throw new Error("Could not load the dashboard.")
  }

  return {
    quotations: quotations.count ?? 0,
    drafts: drafts.count ?? 0,
    clients: clients.count ?? 0,
    companies: companies.count ?? 0,
    recent: (recent.data ?? []).map((row) => ({
      id: row.id,
      number: row.quotation_number,
      clientName: row.client_name,
      status: row.status,
      total: asNumber(row.grand_total),
      currency: row.currency,
      issueDate: row.issue_date,
    })),
  }
}

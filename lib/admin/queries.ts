import "server-only"

import { adminDb } from "@/lib/admin/db"
import {
  isUuid,
  PAGE_SIZE,
  readPage,
  searchTerm,
  toPage,
  type Page,
} from "@/lib/admin/result"
import { isSubscriptionActive } from "@/lib/domain/subscription"
import { asNumber } from "@/lib/format/money"
import type { Json, MerchantStatus, QuotationStatus } from "@/types/database"

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function soonIso() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export type MerchantListItem = {
  id: string
  name: string
  username: string
  status: MerchantStatus
  subscriptionStartsOn: string
  subscriptionEndsOn: string
  subscriptionActive: boolean
  primaryColor: string | null
}

export async function listMerchants(params: {
  page?: string
  q?: string
  status?: string
}): Promise<Page<MerchantListItem>> {
  const { supabase } = await adminDb()
  const page = readPage(params.page)
  const q = searchTerm(params.q)
  let query = supabase
    .from("merchants")
    .select(
      "id, name, slug, status, subscription_starts_on, subscription_ends_on",
      { count: "exact" },
    )

  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
  if (params.status === "active" || params.status === "suspended") {
    query = query.eq("status", params.status)
  }

  const { data, error, count } = await query
    .order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (error) {
    console.error("list merchants", error.code)
    throw new Error("Could not load merchants.")
  }

  const ids = (data ?? []).map((row) => row.id)
  const colors = new Map<string, string>()
  if (ids.length > 0) {
    const { data: branding, error: brandingError } = await supabase
      .from("merchant_branding")
      .select("merchant_id, primary_color")
      .in("merchant_id", ids)
    if (brandingError) {
      console.error("merchant colors", brandingError.code)
      throw new Error("Could not load merchants.")
    }
    for (const row of branding ?? []) colors.set(row.merchant_id, row.primary_color)
  }

  const rows = (data ?? []).map((row) => {
    const item = {
      id: row.id,
      name: row.name,
      username: row.slug,
      status: row.status,
      subscriptionStartsOn: row.subscription_starts_on,
      subscriptionEndsOn: row.subscription_ends_on,
      subscriptionActive: false,
      primaryColor: colors.get(row.id) ?? null,
    }
    item.subscriptionActive = isSubscriptionActive({
      status: item.status,
      subscriptionStartsOn: item.subscriptionStartsOn,
      subscriptionEndsOn: item.subscriptionEndsOn,
    })
    return item
  })

  return toPage(rows, page, count ?? 0)
}

export type MerchantRecord = {
  id: string
  name: string
  username: string
  status: MerchantStatus
  subscriptionStartsOn: string
  subscriptionEndsOn: string
  contactEmail: string
  contactPhone: string
  profileId: string | null
  displayName: string
  tagline: string
  logoPath: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  website: string
  gstin: string
  footerNote: string
  terms: string
}

export async function getMerchant(id: string): Promise<MerchantRecord | null> {
  if (!isUuid(id)) return null
  const { supabase } = await adminDb()
  const { data, error } = await supabase
    .from("merchants")
    .select(
      "id, name, slug, status, subscription_starts_on, subscription_ends_on, contact_email, contact_phone",
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("get merchant", error.code)
    throw new Error("Could not load the merchant.")
  }
  if (!data) return null

  const [{ data: profiles, error: profileError }, { data: branding, error: brandingError }] =
    await Promise.all([
      supabase.from("profiles").select("id").eq("merchant_id", id).limit(1),
      supabase.from("merchant_branding").select("*").eq("merchant_id", id).maybeSingle(),
    ])

  if (profileError || brandingError) {
    console.error("merchant profile", profileError?.code, brandingError?.code)
    throw new Error("Could not load the merchant login.")
  }

  return {
    id: data.id,
    name: data.name,
    username: data.slug,
    status: data.status,
    subscriptionStartsOn: data.subscription_starts_on,
    subscriptionEndsOn: data.subscription_ends_on,
    contactEmail: data.contact_email ?? "",
    contactPhone: data.contact_phone ?? "",
    profileId: profiles?.[0]?.id ?? null,
    displayName: branding?.display_name ?? data.name,
    tagline: branding?.tagline ?? "",
    logoPath: branding?.logo_path ?? null,
    primaryColor: branding?.primary_color ?? "#123c3e",
    secondaryColor: branding?.secondary_color ?? "#f4f1ea",
    accentColor: branding?.accent_color ?? "#8a6232",
    address: branding?.address ?? "",
    city: branding?.city ?? "",
    state: branding?.state ?? "",
    pincode: branding?.pincode ?? "",
    phone: branding?.phone ?? "",
    email: branding?.email ?? "",
    website: branding?.website ?? "",
    gstin: branding?.gstin ?? "",
    footerNote: branding?.footer_note ?? "",
    terms: branding?.terms ?? "",
  }
}

export type CompanyListItem = {
  id: string
  name: string
  slug: string
  isActive: boolean
  logoPath: string | null
  productCount: number
}

export async function listCompanies(params: {
  page?: string
  q?: string
  status?: string
}): Promise<Page<CompanyListItem>> {
  const { supabase } = await adminDb()
  const page = readPage(params.page)
  const q = searchTerm(params.q)
  let query = supabase
    .from("companies")
    .select("id, name, slug, is_active, logo_path", { count: "exact" })

  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
  if (params.status === "active") query = query.eq("is_active", true)
  if (params.status === "hidden") query = query.eq("is_active", false)

  const { data, error, count } = await query
    .order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (error) {
    console.error("list companies", error.code)
    throw new Error("Could not load brands.")
  }

  const ids = (data ?? []).map((row) => row.id)
  const counts = new Map<string, number>()
  if (ids.length > 0) {
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("company_id")
      .in("company_id", ids)
    if (productError) {
      console.error("company product counts", productError.code)
      throw new Error("Could not load brands.")
    }
    for (const product of products ?? []) {
      counts.set(product.company_id, (counts.get(product.company_id) ?? 0) + 1)
    }
  }

  return toPage(
    (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      isActive: row.is_active,
      logoPath: row.logo_path,
      productCount: counts.get(row.id) ?? 0,
    })),
    page,
    count ?? 0,
  )
}

export async function getCompany(id: string) {
  if (!isUuid(id)) return null
  const { supabase } = await adminDb()
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug, description, is_active, logo_path")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("get company", error.code)
    throw new Error("Could not load the brand.")
  }
  return data
}

export async function listCompanyOptions() {
  const { supabase } = await adminDb()
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, is_active")
    .order("name")

  if (error) {
    console.error("company options", error.code)
    throw new Error("Could not load brands.")
  }
  return data ?? []
}

export type ProductListItem = {
  id: string
  name: string
  sku: string
  companyName: string
  listPrice: number
  currency: string
  unit: string
  isActive: boolean
  imagePath: string | null
}

export async function listProducts(params: {
  page?: string
  q?: string
  company?: string
  status?: string
}): Promise<Page<ProductListItem>> {
  const { supabase } = await adminDb()
  const page = readPage(params.page)
  const q = searchTerm(params.q)
  let query = supabase
    .from("products")
    .select(
      "id, name, sku, company_id, list_price, currency, unit, is_active, image_path",
      { count: "exact" },
    )

  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
  if (isUuid(params.company)) query = query.eq("company_id", params.company)
  if (params.status === "active") query = query.eq("is_active", true)
  if (params.status === "hidden") query = query.eq("is_active", false)

  const { data, error, count } = await query
    .order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (error) {
    console.error("list products", error.code)
    throw new Error("Could not load products.")
  }

  const companyIds = [...new Set((data ?? []).map((row) => row.company_id))]
  const names = new Map<string, string>()
  if (companyIds.length > 0) {
    const { data: companies, error: companyError } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", companyIds)
    if (companyError) {
      console.error("product brands", companyError.code)
      throw new Error("Could not load products.")
    }
    for (const company of companies ?? []) names.set(company.id, company.name)
  }

  return toPage(
    (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      companyName: names.get(row.company_id) ?? "Brand",
      listPrice: asNumber(row.list_price),
      currency: row.currency,
      unit: row.unit,
      isActive: row.is_active,
      imagePath: row.image_path,
      })),
    page,
    count ?? 0,
  )
}

export function specDetails(value: Json) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.details === "string"
  ) {
    return value.details
  }
  return ""
}

export async function getProduct(id: string) {
  if (!isUuid(id)) return null
  const { supabase } = await adminDb()
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, company_id, sku, name, description, category, finish, unit, hsn_code, list_price, currency, specifications, image_path, is_active",
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("get product", error.code)
    throw new Error("Could not load the product.")
  }
  return data
}

export type AccessCompany = {
  id: string
  name: string
  isActive: boolean
  enabled: boolean
}

export async function listAccess(merchantId: string): Promise<AccessCompany[]> {
  const { supabase } = await adminDb()
  const [{ data: companies, error: companyError }, { data: access, error: accessError }] =
    await Promise.all([
      supabase.from("companies").select("id, name, is_active").order("name"),
      supabase
        .from("merchant_company_access")
        .select("company_id")
        .eq("merchant_id", merchantId),
    ])

  if (companyError || accessError) {
    console.error("access list", companyError?.code, accessError?.code)
    throw new Error("Could not load company access.")
  }

  const enabled = new Set((access ?? []).map((row) => row.company_id))
  return (companies ?? []).map((company) => ({
    id: company.id,
    name: company.name,
    isActive: company.is_active,
    enabled: enabled.has(company.id),
  }))
}

export async function listMerchantOptions() {
  const { supabase } = await adminDb()
  const { data, error } = await supabase
    .from("merchants")
    .select("id, name, slug")
    .order("name")

  if (error) {
    console.error("merchant options", error.code)
    throw new Error("Could not load merchants.")
  }
  return data ?? []
}

const QUOTATION_STATUSES = new Set<QuotationStatus>([
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "cancelled",
])

function isQuotationStatus(value: string): value is QuotationStatus {
  return QUOTATION_STATUSES.has(value as QuotationStatus)
}

export type QuotationListItem = {
  id: string
  number: string
  clientName: string
  merchantName: string
  status: QuotationStatus
  issueDate: string
  total: number
  currency: string
}

export async function listQuotations(params: {
  page?: string
  q?: string
  status?: string
  merchant?: string
}): Promise<Page<QuotationListItem>> {
  const { supabase } = await adminDb()
  const page = readPage(params.page)
  const q = searchTerm(params.q)
  let query = supabase
    .from("quotations")
    .select(
      "id, quotation_number, client_name, merchant_id, status, issue_date, grand_total, currency",
      { count: "exact" },
    )

  if (q) query = query.or(`quotation_number.ilike.%${q}%,client_name.ilike.%${q}%`)
  if (params.status && isQuotationStatus(params.status)) {
    query = query.eq("status", params.status)
  }
  if (isUuid(params.merchant)) query = query.eq("merchant_id", params.merchant)

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (error) {
    console.error("list quotations", error.code)
    throw new Error("Could not load quotations.")
  }

  const merchantIds = [...new Set((data ?? []).map((row) => row.merchant_id))]
  const names = new Map<string, string>()
  if (merchantIds.length > 0) {
    const { data: merchants, error: merchantError } = await supabase
      .from("merchants")
      .select("id, name")
      .in("id", merchantIds)
    if (merchantError) {
      console.error("quotation merchants", merchantError.code)
      throw new Error("Could not load quotations.")
    }
    for (const merchant of merchants ?? []) names.set(merchant.id, merchant.name)
  }

  return toPage(
    (data ?? []).map((row) => ({
      id: row.id,
      number: row.quotation_number,
      clientName: row.client_name,
      merchantName: names.get(row.merchant_id) ?? "Merchant",
      status: row.status,
      issueDate: row.issue_date,
      total: asNumber(row.grand_total),
      currency: row.currency,
    })),
    page,
    count ?? 0,
  )
}

export async function getQuotation(id: string) {
  if (!isUuid(id)) return null
  const { supabase } = await adminDb()
  const { data, error } = await supabase
    .from("quotations")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("get quotation", error.code)
    throw new Error("Could not load the quotation.")
  }
  if (!data) return null

  const [{ data: items, error: itemError }, { data: merchant, error: merchantError }] =
    await Promise.all([
      supabase
        .from("quotation_items")
        .select(
          "id, sort_order, company_name, product_name, sku, description, unit, quantity, unit_price, discount_amount, tax_rate, line_total",
        )
        .eq("quotation_id", id)
        .order("sort_order"),
      supabase.from("merchants").select("name").eq("id", data.merchant_id).maybeSingle(),
    ])

  if (itemError || merchantError) {
    console.error("quotation detail", itemError?.code, merchantError?.code)
    throw new Error("Could not load the quotation.")
  }

  return {
    quotation: data,
    merchantName: merchant?.name ?? "Merchant",
    items: items ?? [],
  }
}

export async function getDashboard() {
  const { supabase } = await adminDb()
  const today = todayIso()
  const soon = soonIso()

  const [
    merchants,
    activeMerchants,
    companies,
    products,
    quotations,
    expiring,
    recent,
  ] = await Promise.all([
    supabase.from("merchants").select("id", { count: "exact", head: true }),
    supabase
      .from("merchants")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .lte("subscription_starts_on", today)
      .gte("subscription_ends_on", today),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("quotations").select("id", { count: "exact", head: true }),
    supabase
      .from("merchants")
      .select("id, name, subscription_ends_on")
      .eq("status", "active")
      .gte("subscription_ends_on", today)
      .lte("subscription_ends_on", soon)
      .order("subscription_ends_on")
      .limit(5),
    supabase
      .from("quotations")
      .select("id, quotation_number, client_name, status, grand_total, currency, merchant_id")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const failed = [merchants, activeMerchants, companies, products, quotations, expiring, recent].find(
    (result) => result.error,
  )
  if (failed?.error) {
    console.error("dashboard", failed.error.code)
    throw new Error("Could not load the dashboard.")
  }

  const merchantIds = [...new Set((recent.data ?? []).map((row) => row.merchant_id))]
  const names = new Map<string, string>()
  if (merchantIds.length > 0) {
    const { data } = await supabase.from("merchants").select("id, name").in("id", merchantIds)
    for (const merchant of data ?? []) names.set(merchant.id, merchant.name)
  }

  return {
    merchants: merchants.count ?? 0,
    activeMerchants: activeMerchants.count ?? 0,
    companies: companies.count ?? 0,
    products: products.count ?? 0,
    quotations: quotations.count ?? 0,
    expiring: expiring.data ?? [],
    recent: (recent.data ?? []).map((row) => ({
      ...row,
      merchantName: names.get(row.merchant_id) ?? "Merchant",
      total: asNumber(row.grand_total),
    })),
  }
}

export type PlatformSettings =
  | {
      missing: false
      platformName: string
      supportEmail: string
      defaultCurrency: string
      defaultTaxRate: number
    }
  | { missing: true }

export async function getSettings(): Promise<PlatformSettings> {
  const { supabase } = await adminDb()
  const { data, error } = await supabase
    .from("platform_settings")
    .select("platform_name, support_email, default_currency, default_tax_rate")
    .eq("id", 1)
    .maybeSingle()

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return { missing: true }
    console.error("settings", error.code)
    throw new Error("Could not load settings.")
  }

  if (!data) return { missing: true }

  return {
    missing: false,
    platformName: data.platform_name,
    supportEmail: data.support_email ?? "",
    defaultCurrency: data.default_currency,
    defaultTaxRate: asNumber(data.default_tax_rate),
  }
}

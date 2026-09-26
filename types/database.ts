export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = "admin" | "merchant" | "pending"
export type MerchantStatus = "active" | "suspended"
export type QuotationStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "cancelled"

type Table<Row extends Record<string, unknown>> = {
  Row: Row
  Insert: { [K in keyof Row]?: Row[K] | undefined }
  Update: { [K in keyof Row]?: Row[K] | undefined }
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      merchants: Table<{
        id: string
        name: string
        slug: string
        status: MerchantStatus
        subscription_starts_on: string
        subscription_ends_on: string
        contact_email: string | null
        contact_phone: string | null
        created_at: string
        updated_at: string
      }>
      merchant_branding: Table<{
        merchant_id: string
        display_name: string
        tagline: string | null
        logo_path: string | null
        primary_color: string
        secondary_color: string
        accent_color: string
        address: string | null
        city: string | null
        state: string | null
        pincode: string | null
        phone: string | null
        email: string | null
        website: string | null
        gstin: string | null
        footer_note: string | null
        terms: string | null
        created_at: string
        updated_at: string
      }>
      profiles: Table<{
        id: string
        role: UserRole
        merchant_id: string | null
        full_name: string
        phone: string | null
        email: string | null
        created_at: string
        updated_at: string
      }>
      companies: Table<{
        id: string
        name: string
        slug: string
        logo_path: string | null
        description: string | null
        is_active: boolean
        created_at: string
        updated_at: string
      }>
      products: Table<{
        id: string
        company_id: string
        sku: string
        name: string
        description: string | null
        category: string | null
        finish: string | null
        unit: string
        hsn_code: string | null
        list_price: number
        currency: string
        specifications: Json
        image_path: string | null
        is_active: boolean
        created_at: string
        updated_at: string
      }>
      merchant_company_access: Table<{
        merchant_id: string
        company_id: string
        granted_at: string
        granted_by: string | null
      }>
      clients: Table<{
        id: string
        merchant_id: string
        name: string
        phone: string | null
        email: string | null
        address: string | null
        city: string | null
        state: string | null
        pincode: string | null
        gstin: string | null
        notes: string | null
        created_at: string
        updated_at: string
      }>
      sites: Table<{
        id: string
        merchant_id: string
        client_id: string
        name: string
        address: string | null
        city: string | null
        state: string | null
        pincode: string | null
        notes: string | null
        created_at: string
        updated_at: string
      }>
      quotations: Table<{
        id: string
        merchant_id: string
        client_id: string | null
        site_id: string | null
        quotation_number: string
        status: QuotationStatus
        issue_date: string
        valid_until: string | null
        currency: string
        notes: string | null
        terms: string | null
        client_name: string
        client_phone: string | null
        client_email: string | null
        client_address: string | null
        client_gstin: string | null
        site_name: string | null
        site_address: string | null
        branding_display_name: string
        branding_logo_path: string | null
        branding_primary_color: string | null
        branding_secondary_color: string | null
        branding_accent_color: string | null
        branding_phone: string | null
        branding_email: string | null
        branding_address: string | null
        branding_gstin: string | null
        branding_website: string | null
        branding_footer_note: string | null
        subtotal: number
        discount_total: number
        tax_total: number
        grand_total: number
        created_by: string | null
        created_at: string
        updated_at: string
      }>
      platform_settings: Table<{
        id: number
        platform_name: string
        support_email: string | null
        default_currency: string
        default_tax_rate: number
        updated_at: string
      }>
      quotation_items: Table<{
        id: string
        quotation_id: string
        merchant_id: string
        product_id: string | null
        company_id: string | null
        sort_order: number
        company_name: string
        product_name: string
        sku: string | null
        description: string | null
        unit: string
        unit_price: number
        quantity: number
        discount_amount: number
        tax_rate: number
        line_subtotal: number
        line_tax: number
        line_total: number
        specifications: Json
        image_path: string | null
        created_at: string
      }>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

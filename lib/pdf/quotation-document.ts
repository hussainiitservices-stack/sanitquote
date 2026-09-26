import type { QuotationStatus } from "@/types/domain"

/**
 * Stable input for a future branded PDF. Every price and label here is a
 * snapshot stored on the quotation. Do not join live product rows when rendering.
 */
export type QuotationLineSnapshot = {
  sortOrder: number
  companyName: string
  productName: string
  sku: string | null
  description: string | null
  imagePath: string | null
  unit: string
  quantity: number
  unitPrice: number
  discountAmount: number
  taxRate: number
  lineSubtotal: number
  lineTax: number
  lineTotal: number
}

export type QuotationDocument = {
  number: string
  status: QuotationStatus
  issueDate: string
  validUntil: string | null
  currency: string
  notes: string | null
  terms: string | null
  merchant: {
    displayName: string
    logoPath: string | null
    primaryColor: string | null
    secondaryColor: string | null
    accentColor: string | null
    phone: string | null
    email: string | null
    address: string | null
    gstin: string | null
    website: string | null
    footerNote: string | null
  }
  client: {
    name: string
    phone: string | null
    email: string | null
    address: string | null
    gstin: string | null
  }
  site: {
    name: string
    address: string | null
  } | null
  items: QuotationLineSnapshot[]
  totals: {
    subtotal: number
    discount: number
    tax: number
    grandTotal: number
  }
}

export type QuotationSnapshotSource = Omit<QuotationDocument, "items"> & {
  items: QuotationLineSnapshot[]
}

export function toQuotationDocument(
  source: QuotationSnapshotSource,
): QuotationDocument {
  return {
    ...source,
    items: [...source.items].sort((left, right) => left.sortOrder - right.sortOrder),
  }
}

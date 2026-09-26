import type { QuotationStatus } from "@/types/domain"

/** Drafts can still change. Every other status is a historical document. */
export function quotationIsFrozen(status: QuotationStatus) {
  return status !== "draft"
}

export const QUOTATION_STATUSES: QuotationStatus[] = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "cancelled",
]

export function isQuotationStatus(value: string): value is QuotationStatus {
  return QUOTATION_STATUSES.includes(value as QuotationStatus)
}

export function moneyAmount(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export type LineInput = {
  quantity: number
  unitPrice: number
  discountAmount: number
  taxRate: number
}

export type LineTotals = {
  lineSubtotal: number
  lineTax: number
  lineTotal: number
}

export function calculateLine(input: LineInput): LineTotals {
  const quantity = Number.isFinite(input.quantity) ? input.quantity : 0
  const unitPrice = Number.isFinite(input.unitPrice) ? input.unitPrice : 0
  const discount = Number.isFinite(input.discountAmount) ? input.discountAmount : 0
  const taxRate = Number.isFinite(input.taxRate) ? input.taxRate : 0
  const lineSubtotal = moneyAmount(Math.max(0, quantity * unitPrice - discount))
  const lineTax = moneyAmount(lineSubtotal * (taxRate / 100))
  return {
    lineSubtotal,
    lineTax,
    lineTotal: moneyAmount(lineSubtotal + lineTax),
  }
}

export function calculateQuoteTotals(
  lines: Array<Pick<LineInput, "quantity" | "unitPrice" | "discountAmount"> & LineTotals>,
) {
  return {
    subtotal: moneyAmount(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)),
    discount: moneyAmount(lines.reduce((sum, line) => sum + line.discountAmount, 0)),
    tax: moneyAmount(lines.reduce((sum, line) => sum + line.lineTax, 0)),
    grandTotal: moneyAmount(lines.reduce((sum, line) => sum + line.lineTotal, 0)),
  }
}

export function nextQuotationNumber(existing: string[], year = new Date().getUTCFullYear()) {
  const prefix = `SQ-${year}-`
  let highest = 0
  for (const value of existing) {
    if (!value.startsWith(prefix)) continue
    const parsed = Number(value.slice(prefix.length))
    if (Number.isInteger(parsed) && parsed > highest) highest = parsed
  }
  return `${prefix}${String(highest + 1).padStart(4, "0")}`
}

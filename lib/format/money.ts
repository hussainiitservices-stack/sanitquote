export function asNumber(value: number | string | null | undefined) {
  if (value == null) return 0
  const amount = typeof value === "number" ? value : Number(value)
  return Number.isFinite(amount) ? amount : 0
}

export function formatMoney(value: number | string, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(asNumber(value))
}

/** Helvetica cannot draw ₹, so PDFs use an ASCII prefix. */
export function formatPdfMoney(value: number | string, currency = "INR") {
  const amount = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(asNumber(value))
  const code = currency.trim().toUpperCase() || "INR"
  return code === "INR" ? `Rs ${amount}` : `${code} ${amount}`
}

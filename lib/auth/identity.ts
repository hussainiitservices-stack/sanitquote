const MERCHANT_EMAIL_DOMAIN = "merchants.sanitquote.local"

export function merchantAuthEmail(username: string) {
  return `${username.trim().toLowerCase()}@${MERCHANT_EMAIL_DOMAIN}`
}

export function authEmailFromIdentifier(identifier: string) {
  const value = identifier.trim().toLowerCase()
  if (value.includes("@")) return value
  return merchantAuthEmail(value)
}

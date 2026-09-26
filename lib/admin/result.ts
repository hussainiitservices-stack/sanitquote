export type ActionResult =
  | { ok: true; href?: string; message?: string }
  | { ok: false; message: string }

export const PAGE_SIZE = 12

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string | undefined): value is string {
  return Boolean(value && UUID_PATTERN.test(value))
}

export function readPage(value: string | undefined) {
  const page = Number(value)
  if (!Number.isInteger(page) || page < 1) return 1
  return page
}

export function searchTerm(value: string | undefined) {
  return (value ?? "").trim().replace(/[%_,.()]/g, "")
}

export function blankToNull(value: string | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed ? trimmed : null
}

export function dbErrorMessage(
  error: { code?: string; message?: string },
  fallback = "Could not save that change.",
) {
  if (error.code === "23505") return "That name or username is already in use."
  if (error.code === "23503") {
    return "This record is still used elsewhere, so it cannot be removed."
  }
  if (error.code === "23514") return "A value does not match the required format."
  return fallback
}

export type Page<T> = {
  rows: T[]
  page: number
  pageSize: number
  total: number
  pageCount: number
}

export function toPage<T>(rows: T[], page: number, total: number): Page<T> {
  return {
    rows,
    page,
    pageSize: PAGE_SIZE,
    total,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}

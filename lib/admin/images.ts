import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/types/database"
import type { StorageBucket } from "@/lib/storage/buckets"

const TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
])

export async function saveImage(
  supabase: SupabaseClient<Database>,
  file: FormDataEntryValue | null,
  bucket: StorageBucket,
  pathPrefix: string,
  currentPath: string | null,
  maxBytes: number,
): Promise<{ path: string | null } | { error: string }> {
  if (!(file instanceof File) || file.size === 0) return { path: currentPath }

  const extension = TYPES.get(file.type)
  if (!extension) return { error: "Use a PNG, JPG, or WebP image." }
  if (file.size > maxBytes) {
    const limit = Math.round(maxBytes / (1024 * 1024))
    return { error: `Image must be ${limit} MB or smaller.` }
  }

  const path = `${pathPrefix}.${extension}`
  if (currentPath && currentPath !== path) {
    await supabase.storage.from(bucket).remove([currentPath])
  }

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: true,
  })

  if (error) {
    console.error("image upload", error.message)
    return { error: "The image could not be uploaded." }
  }

  return { path }
}

export function isImageError(
  result: { path: string | null } | { error: string },
): result is { error: string } {
  return "error" in result
}

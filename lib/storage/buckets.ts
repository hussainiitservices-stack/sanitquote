import { getPublicEnv } from "@/lib/env/public"

export const STORAGE_BUCKETS = {
  merchantLogos: "merchant-logos",
  brandAssets: "brand-assets",
} as const

export type StorageBucket =
  (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS]

export function merchantLogoObjectPath(merchantId: string, filename: string) {
  return `${merchantId}/${filename}`
}

export function companyAssetObjectPath(companyId: string, filename: string) {
  return `companies/${companyId}/${filename}`
}

export function productAssetObjectPath(productId: string, filename: string) {
  return `products/${productId}/${filename}`
}

export function publicObjectUrl(bucket: StorageBucket, path: string) {
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv()
  const encodedPath = path.split("/").map(encodeURIComponent).join("/")
  return `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodedPath}`
}

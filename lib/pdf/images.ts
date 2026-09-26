import "server-only"

import { publicObjectUrl, type StorageBucket } from "@/lib/storage/buckets"

export async function storageImageDataUrl(
  bucket: StorageBucket,
  path: string | null | undefined,
) {
  if (!path) return undefined
  try {
    const response = await fetch(publicObjectUrl(bucket, path))
    if (!response.ok) return undefined
    return toPdfDataUrl(Buffer.from(await response.arrayBuffer()))
  } catch {
    return undefined
  }
}

async function toPdfDataUrl(bytes: Buffer) {
  if (isPng(bytes)) return `data:image/png;base64,${bytes.toString("base64")}`
  if (isJpeg(bytes)) return `data:image/jpeg;base64,${bytes.toString("base64")}`

  try {
    const { default: sharp } = await import("sharp")
    const png = await sharp(bytes).rotate().png().toBuffer()
    return `data:image/png;base64,${png.toString("base64")}`
  } catch {
    return undefined
  }
}

function isPng(bytes: Buffer) {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
}

function isJpeg(bytes: Buffer) {
  return bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8
}

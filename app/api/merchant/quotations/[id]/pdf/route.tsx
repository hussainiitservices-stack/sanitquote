import { renderToBuffer } from "@react-pdf/renderer"

import { jsonError } from "@/lib/api/http"
import { withRole } from "@/lib/api/with-session"
import { getQuotationDocument } from "@/lib/merchant/queries"
import { storageImageDataUrl } from "@/lib/pdf/images"
import { QuotationPdf } from "@/lib/pdf/quotation-pdf"
import { STORAGE_BUCKETS } from "@/lib/storage/buckets"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  return withRole("merchant", async () => {
    const document = await getQuotationDocument(id)
    if (!document) return jsonError("Quotation not found.", 404, "not_found")

    const [logoSrc, itemImages] = await Promise.all([
      storageImageDataUrl(STORAGE_BUCKETS.merchantLogos, document.merchant.logoPath),
      Promise.all(
        document.items.map((item) =>
          storageImageDataUrl(STORAGE_BUCKETS.brandAssets, item.imagePath),
        ),
      ),
    ])
    const pdf = await renderToBuffer(
      <QuotationPdf document={document} logoSrc={logoSrc} itemImages={itemImages} />,
    )

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${document.number}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    })
  })
}

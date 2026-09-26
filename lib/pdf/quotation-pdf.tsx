import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

import { formatDate } from "@/lib/format/date"
import { formatMoney } from "@/lib/format/money"
import type { QuotationDocument } from "@/lib/pdf/quotation-document"

export function QuotationPdf({
  document: quote,
  logoSrc,
  itemImages = [],
}: {
  document: QuotationDocument
  logoSrc?: string
  itemImages?: Array<string | undefined>
}) {
  const primary = quote.merchant.primaryColor || "#123c3e"
  const styles = StyleSheet.create({
    page: {
      padding: 36,
      fontSize: 10,
      fontFamily: "Helvetica",
      color: "#1f1b16",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 18,
      paddingBottom: 12,
      borderBottomWidth: 3,
      borderBottomColor: primary,
    },
    brand: { maxWidth: 280 },
    logo: { width: 56, height: 56, objectFit: "contain", marginBottom: 8 },
    title: { fontSize: 18, fontFamily: "Helvetica-Bold", color: primary },
    muted: { color: "#6b645b", marginTop: 2 },
    meta: { textAlign: "right" },
    columns: { flexDirection: "row", gap: 16, marginBottom: 16 },
    column: { flex: 1 },
    label: {
      fontSize: 8,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: "#6b645b",
      marginBottom: 4,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: primary,
      color: "#ffffff",
      paddingVertical: 6,
      paddingHorizontal: 6,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: "#e4ddd2",
    },
    colName: { width: "42%", flexDirection: "row", alignItems: "center" },
    thumb: { width: 32, height: 32, objectFit: "contain", marginRight: 6 },
    thumbSlot: { width: 32, height: 32, marginRight: 6, backgroundColor: "#f4f1ea" },
    nameCopy: { flex: 1 },
    colQty: { width: "10%", textAlign: "right" },
    colPrice: { width: "16%", textAlign: "right" },
    colDisc: { width: "16%", textAlign: "right" },
    colTotal: { width: "16%", textAlign: "right" },
    totals: { marginTop: 12, alignSelf: "flex-end", width: 220 },
    totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    grand: { fontFamily: "Helvetica-Bold", fontSize: 12, color: primary, marginTop: 4 },
    notes: { marginTop: 20 },
    footer: { position: "absolute", bottom: 24, left: 36, right: 36, color: "#6b645b", fontSize: 8 },
  })

  return (
    <Document title={quote.number}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            {logoSrc ? (
              // react-pdf Image has no accessible alt text API.
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logoSrc} style={styles.logo} />
            ) : null}
            <Text style={styles.title}>{quote.merchant.displayName}</Text>
            {quote.merchant.address ? <Text style={styles.muted}>{quote.merchant.address}</Text> : null}
            {quote.merchant.phone ? <Text style={styles.muted}>{quote.merchant.phone}</Text> : null}
            {quote.merchant.email ? <Text style={styles.muted}>{quote.merchant.email}</Text> : null}
            {quote.merchant.gstin ? <Text style={styles.muted}>GSTIN {quote.merchant.gstin}</Text> : null}
          </View>
          <View style={styles.meta}>
            <Text style={styles.title}>Quotation</Text>
            <Text>{quote.number}</Text>
            <Text style={styles.muted}>Issued {formatDate(quote.issueDate)}</Text>
            {quote.validUntil ? <Text style={styles.muted}>Valid until {formatDate(quote.validUntil)}</Text> : null}
          </View>
        </View>

        <View style={styles.columns}>
          <View style={styles.column}>
            <Text style={styles.label}>Bill to</Text>
            <Text>{quote.client.name}</Text>
            {quote.client.phone ? <Text style={styles.muted}>{quote.client.phone}</Text> : null}
            {quote.client.email ? <Text style={styles.muted}>{quote.client.email}</Text> : null}
            {quote.client.address ? <Text style={styles.muted}>{quote.client.address}</Text> : null}
            {quote.client.gstin ? <Text style={styles.muted}>GSTIN {quote.client.gstin}</Text> : null}
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Site</Text>
            <Text>{quote.site?.address || "—"}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colName}>Item</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colPrice}>Price</Text>
          <Text style={styles.colDisc}>Discount</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {quote.items.map((item, index) => (
          <View key={`${item.productName}-${index}`} style={styles.row} wrap={false}>
            <View style={styles.colName}>
              {itemImages[index] ? (
                // react-pdf Image has no accessible alt text API.
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={itemImages[index]} style={styles.thumb} />
              ) : (
                <View style={styles.thumbSlot} />
              )}
              <View style={styles.nameCopy}>
                <Text>{item.productName}</Text>
                <Text style={styles.muted}>
                  {item.companyName}
                  {item.sku ? ` · ${item.sku}` : ""}
                </Text>
              </View>
            </View>
            <Text style={styles.colQty}>
              {item.quantity} {item.unit}
            </Text>
            <Text style={styles.colPrice}>{formatMoney(item.unitPrice, quote.currency)}</Text>
            <Text style={styles.colDisc}>{formatMoney(item.discountAmount, quote.currency)}</Text>
            <Text style={styles.colTotal}>{formatMoney(item.lineTotal, quote.currency)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatMoney(quote.totals.subtotal, quote.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Discount</Text>
            <Text>{formatMoney(quote.totals.discount, quote.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Tax</Text>
            <Text>{formatMoney(quote.totals.tax, quote.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.grand}>Total</Text>
            <Text style={styles.grand}>{formatMoney(quote.totals.grandTotal, quote.currency)}</Text>
          </View>
        </View>

        {quote.notes ? (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{quote.notes}</Text>
          </View>
        ) : null}
        {quote.terms ? (
          <View style={styles.notes}>
            <Text style={styles.label}>Terms</Text>
            <Text>{quote.terms}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          {quote.merchant.footerNote || quote.merchant.website || quote.merchant.displayName}
        </Text>
      </Page>
    </Document>
  )
}

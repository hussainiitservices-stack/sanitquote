import { Badge } from "@/components/ui/badge"
import type { MerchantStatus, QuotationStatus } from "@/types/database"

export function MerchantStatusBadge({
  status,
  subscriptionActive,
}: {
  status: MerchantStatus
  subscriptionActive: boolean
}) {
  if (status === "suspended") return <Badge variant="destructive">Suspended</Badge>
  if (!subscriptionActive) return <Badge variant="outline">Expired</Badge>
  return <Badge>Active</Badge>
}

const quotationVariants: Record<
  QuotationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  sent: "outline",
  accepted: "default",
  rejected: "destructive",
  expired: "destructive",
  cancelled: "destructive",
}

const quotationLabels: Record<QuotationStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  cancelled: "Cancelled",
}

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  return <Badge variant={quotationVariants[status]}>{quotationLabels[status]}</Badge>
}

export function ActiveBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? "default" : "secondary"}>{active ? "Active" : "Hidden"}</Badge>
}

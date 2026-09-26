"use client"

import {
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Users,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"

const items = [
  { href: "/merchant", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/merchant/quotations", label: "Quotes", icon: FileText },
  { href: "/merchant/clients", label: "Clients", icon: Users },
  { href: "/merchant/catalog", label: "Catalog", icon: Package },
]

const moreItems = [{ href: "/merchant/settings", label: "Branding", icon: Settings }]

export function MerchantShell({
  brand,
  user,
  banner,
  children,
}: {
  brand: string
  user: { name: string; email: string }
  banner?: string | null
  children: React.ReactNode
}) {
  return (
    <AppShell
      brand={brand}
      section="Showroom"
      user={user}
      items={items}
      moreItems={moreItems}
      banner={banner}
    >
      {children}
    </AppShell>
  )
}

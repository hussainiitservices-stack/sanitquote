"use client"

import {
  Boxes,
  Building2,
  FileText,
  KeyRound,
  LayoutDashboard,
  Settings,
  Store,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"

const items = [
  { href: "/admin", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/admin/merchants", label: "Merchants", icon: Store },
  { href: "/admin/companies", label: "Brands", icon: Building2 },
  { href: "/admin/products", label: "Products", icon: Boxes },
]

const moreItems = [
  { href: "/admin/access", label: "Access", icon: KeyRound },
  { href: "/admin/quotations", label: "Quotes", icon: FileText },
  { href: "/admin/settings", label: "Branding", icon: Settings },
]

export function AdminShell({
  user,
  children,
}: {
  user: { name: string; email: string }
  children: React.ReactNode
}) {
  return (
    <AppShell
      brand="SanitQuote"
      section="Admin"
      user={user}
      items={items}
      moreItems={moreItems}
    >
      {children}
    </AppShell>
  )
}

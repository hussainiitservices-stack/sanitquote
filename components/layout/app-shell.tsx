"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Ellipsis, LogOut, type LucideIcon } from "lucide-react"

import { signOut } from "@/lib/auth/actions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export type ShellNavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

function isActive(pathname: string, item: ShellNavItem) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

function initial(name: string, email: string) {
  const source = name.trim() || email
  return source.slice(0, 1).toUpperCase() || "?"
}

export function AppShell({
  brand,
  section,
  user,
  items,
  moreItems = [],
  banner,
  children,
}: {
  brand: string
  section: string
  user: { name: string; email: string }
  items: ShellNavItem[]
  moreItems?: ShellNavItem[]
  banner?: string | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const moreActive = moreItems.some((item) => isActive(pathname, item))

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-primary text-primary-foreground md:flex">
        <div className="grid gap-1 px-5 py-6">
          <p className="text-xs font-medium tracking-wide text-primary-foreground/70">
            {section}
          </p>
          <p className="truncate text-lg font-semibold">{brand}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {items.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} />
          ))}
          <MoreMenu
            items={moreItems}
            user={user}
            triggerClassName={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
              moreActive
                ? "bg-white/15 text-primary-foreground"
                : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
            )}
          />
        </nav>
        <div className="min-w-0 border-t border-white/15 p-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-primary-foreground/70">{user.email}</p>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col md:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-8">
          <div className="min-w-0 md:hidden">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
              {section}
            </p>
            <p className="truncate text-sm font-semibold">{brand}</p>
          </div>
          <div className="ml-auto">
            <Avatar>
              <AvatarFallback>{initial(user.name, user.email)}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        {banner ? (
          <p className="border-b bg-accent px-4 py-3 text-sm text-accent-foreground md:px-8">
            {banner}
          </p>
        ) : null}
        <main
          id="main"
          className="flex-1 px-4 py-5 pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:px-8 md:pb-8"
        >
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul
          className="grid"
          style={{ gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))` }}
        >
          {items.map((item) => {
            const active = isActive(pathname, item)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon />
                  {item.label}
                </Link>
              </li>
            )
          })}
          <li>
            <MoreMenu
              items={moreItems}
              user={user}
              triggerClassName={cn(
                "flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium",
                moreActive ? "text-primary" : "text-muted-foreground",
              )}
            />
          </li>
        </ul>
      </nav>
    </div>
  )
}

function SidebarLink({
  item,
  pathname,
}: {
  item: ShellNavItem
  pathname: string
}) {
  const active = isActive(pathname, item)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
        active
          ? "bg-white/15 text-primary-foreground"
          : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
      )}
    >
      <Icon />
      {item.label}
    </Link>
  )
}

function MoreMenu({
  items,
  user,
  triggerClassName,
}: {
  items: ShellNavItem[]
  user: { name: string; email: string }
  triggerClassName: string
}) {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button type="button" className={triggerClassName} aria-label="More">
          <Ellipsis />
          More
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        <SheetHeader>
          <SheetTitle>More</SheetTitle>
          <SheetDescription>
            {user.name}
            {user.email ? ` · ${user.email}` : ""}
          </SheetDescription>
        </SheetHeader>
        <nav className="grid gap-1 px-4 pb-4">
          {items.map((item) => {
            const active = isActive(pathname, item)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                  active ? "bg-muted text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon />
                {item.label}
              </Link>
            )
          })}
          <form action={signOut}>
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-destructive"
            >
              <LogOut />
              Sign out
            </button>
          </form>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

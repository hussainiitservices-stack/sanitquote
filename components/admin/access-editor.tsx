"use client"

import { useMemo, useState, useTransition } from "react"

import { setCompanyAccess } from "@/lib/admin/catalog-actions"
import { cn } from "@/lib/utils"

type AccessCompany = {
  id: string
  name: string
  isActive: boolean
  enabled: boolean
}

export function AccessEditor({
  merchantId,
  companies,
}: {
  merchantId: string
  companies: AccessCompany[]
}) {
  const [query, setQuery] = useState("")
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return companies
    return companies.filter((company) => company.name.toLowerCase().includes(term))
  }, [companies, query])

  function enabled(company: AccessCompany) {
    return overrides[company.id] ?? company.enabled
  }

  function toggle(company: AccessCompany) {
    const next = !enabled(company)
    setOverrides((current) => ({ ...current, [company.id]: next }))
    setPendingId(company.id)
    setMessage(null)
    startTransition(async () => {
      const result = await setCompanyAccess(merchantId, company.id, next)
      setPendingId(null)
      if (!result.ok) {
        setOverrides((current) => ({ ...current, [company.id]: !next }))
        setMessage(result.message)
      }
    })
  }

  return (
    <div className="grid gap-3">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter brands"
        className="h-11 rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {message ? (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}
      <ul className="grid gap-2">
        {visible.map((company) => {
          const on = enabled(company)
          return (
            <li key={company.id}>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                disabled={pendingId === company.id}
                onClick={() => toggle(company)}
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl bg-card px-4 text-left ring-1 ring-foreground/10"
              >
                <span>
                  <span className="block text-sm font-medium">{company.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {company.isActive ? "In catalog" : "Hidden brand"}
                  </span>
                </span>
                <span
                  className={cn(
                    "inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors",
                    on ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "size-5 rounded-full bg-white transition-transform",
                      on && "translate-x-5",
                    )}
                  />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">No brands match that filter.</p>
      ) : null}
    </div>
  )
}

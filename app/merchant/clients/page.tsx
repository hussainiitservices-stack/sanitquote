import type { Metadata } from "next"
import Link from "next/link"

import { EmptyState } from "@/components/admin/empty-state"
import { Pager } from "@/components/admin/pager"
import { TextField } from "@/components/forms/text-field"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { getMerchantWorkspace } from "@/lib/data/merchants"
import { requireMerchant } from "@/lib/auth/guards"
import { listClients } from "@/lib/merchant/queries"

export const metadata: Metadata = { title: "Clients" }

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const user = await requireMerchant()
  const params = await searchParams
  const [result, workspace] = await Promise.all([
    listClients(params),
    getMerchantWorkspace(user.merchantId),
  ])
  const canWrite = Boolean(workspace?.subscriptionActive)
  const filtered = Boolean(params.q)

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Clients"
        description="People and firms this showroom quotes for."
        action={
          canWrite ? (
            <Button asChild className="h-11">
              <Link href="/merchant/clients/new">Add client</Link>
            </Button>
          ) : undefined
        }
      />
      <form action="/merchant/clients" className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <TextField label="Search" name="q" defaultValue={params.q ?? ""} placeholder="Name, phone, or email" />
        <Button type="submit" variant="secondary" className="h-11">
          Search
        </Button>
      </form>
      {result.rows.length === 0 ? (
        <EmptyState
          title={filtered ? "No clients match" : "No clients yet"}
          description={filtered ? "Try another name or phone number." : "Add the first client, then start a quotation."}
          href={filtered || !canWrite ? undefined : "/merchant/clients/new"}
          action={filtered || !canWrite ? undefined : "Add client"}
        />
      ) : (
        <ul className="grid gap-2">
          {result.rows.map((client) => (
            <li key={client.id}>
              <Link
                href={`/merchant/clients/${client.id}`}
                className="grid min-h-16 min-w-0 gap-1 overflow-hidden rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
              >
                <span className="truncate text-sm font-medium">{client.name}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {[client.phone, client.city].filter(Boolean).join(" · ") || "No contact details"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pager page={result.page} pageCount={result.pageCount} path="/merchant/clients" params={{ q: params.q }} />
    </div>
  )
}

import Link from "next/link"

import { Button } from "@/components/ui/button"

export function Pager({
  page,
  pageCount,
  path,
  params,
}: {
  page: number
  pageCount: number
  path: string
  params: Record<string, string | undefined>
}) {
  if (pageCount <= 1) return null

  function href(nextPage: number) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value)
    }
    if (nextPage > 1) search.set("page", String(nextPage))
    const query = search.toString()
    return query ? `${path}?${query}` : path
  }

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
      {page > 1 ? (
        <Button asChild variant="outline" className="h-11">
          <Link href={href(page - 1)}>Previous</Link>
        </Button>
      ) : (
        <Button variant="outline" className="h-11" disabled>
          Previous
        </Button>
      )}
      <p className="text-sm text-muted-foreground">
        {page} of {pageCount}
      </p>
      {page < pageCount ? (
        <Button asChild variant="outline" className="h-11">
          <Link href={href(page + 1)}>Next</Link>
        </Button>
      ) : (
        <Button variant="outline" className="h-11" disabled>
          Next
        </Button>
      )}
    </nav>
  )
}

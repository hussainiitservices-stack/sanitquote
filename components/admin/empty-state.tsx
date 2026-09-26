import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string
  description: string
  href?: string
  action?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {href && action ? (
          <Button asChild className="mt-3 h-11 w-fit">
            <Link href={href}>{action}</Link>
          </Button>
        ) : null}
      </CardHeader>
    </Card>
  )
}

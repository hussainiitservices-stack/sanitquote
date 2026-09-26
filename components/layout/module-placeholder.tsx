import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/layout/page-header"

export function ModulePlaceholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="grid gap-5">
      <PageHeader title={title} description={description} />
      <Card>
        <CardHeader>
          <CardTitle>Ready for this module</CardTitle>
          <CardDescription>
            The route and database tables are in place. The workflow itself comes next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">Foundation</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

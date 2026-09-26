export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="grid min-w-0 gap-1">
        <h1 className="text-2xl font-semibold tracking-tight break-words">{title}</h1>
        {description ? (
          <p className="max-w-xl text-sm break-words text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  )
}

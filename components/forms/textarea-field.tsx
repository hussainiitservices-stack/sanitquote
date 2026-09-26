import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type TextAreaFieldProps = React.ComponentProps<"textarea"> & {
  label: string
  error?: string
}

export function TextAreaField({
  label,
  error,
  id,
  className,
  ...props
}: TextAreaFieldProps) {
  const fieldId = id ?? props.name

  return (
    <div className="grid gap-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <textarea
        id={fieldId}
        className={cn(
          "min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className,
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

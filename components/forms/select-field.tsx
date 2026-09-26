"use client"

import { ChevronDown, Search } from "lucide-react"
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type SelectOption = {
  value: string
  label: string
}

type SelectFieldBaseProps = {
  label: string
  error?: string
  id?: string
  disabled?: boolean
  children: ReactNode
  className?: string
}

type SelectFieldProps<TFieldValues extends FieldValues = FieldValues> = SelectFieldBaseProps & {
  name?: FieldPath<TFieldValues> | string
  control?: Control<TFieldValues>
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export function SelectField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  error,
  ...props
}: SelectFieldProps<TFieldValues>) {
  if (control && name) {
    return (
      <Controller
        control={control}
        name={name as FieldPath<TFieldValues>}
        render={({ field, fieldState }) => (
          <SearchSelect
            {...props}
            name={field.name}
            value={String(field.value ?? "")}
            error={error ?? fieldState.error?.message}
            onValueChange={field.onChange}
          />
        )}
      />
    )
  }

  return <SearchSelect {...props} name={name} error={error} />
}

function SearchSelect({
  label,
  error,
  id,
  name,
  value,
  defaultValue,
  disabled,
  children,
  className,
  onValueChange,
}: Omit<SelectFieldProps, "control">) {
  const reactId = useId()
  const fieldId = id ?? name ?? reactId
  const listId = `${fieldId}-list`
  const searchId = `${fieldId}-search`
  const options = useMemo(() => optionsFromChildren(children), [children])
  const isControlled = value !== undefined
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "")
  const selectedValue = isControlled ? value : uncontrolled
  const selected = options.find((option) => option.value === selectedValue)
  const triggerLabel = selected?.label ?? (selectedValue || "Choose…")

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [keyboardIndex, setKeyboardIndex] = useState<number | null>(null)
  const [panel, setPanel] = useState<PanelPosition | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter((option) => option.label.toLowerCase().includes(term))
  }, [options, query])
  const selectedMatch = matches.findIndex((option) => option.value === selectedValue)
  const activeIndex = Math.min(
    keyboardIndex ?? (selectedMatch >= 0 ? selectedMatch : 0),
    Math.max(matches.length - 1, 0),
  )
  const errorId = `${fieldId}-error`

  useEffect(() => {
    if (!open) return

    function place() {
      if (!triggerRef.current) return
      setPanel(positionPanel(triggerRef.current))
    }

    const frame = window.setTimeout(() => searchRef.current?.focus(), 0)
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      close()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        close()
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      window.clearTimeout(frame)
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  function close() {
    setOpen(false)
    setQuery("")
    setKeyboardIndex(null)
    setPanel(null)
    triggerRef.current?.focus()
  }

  function openMenu() {
    if (!triggerRef.current) return
    setPanel(positionPanel(triggerRef.current))
    setQuery("")
    setKeyboardIndex(null)
    setOpen(true)
  }

  function choose(next: string) {
    if (!isControlled) setUncontrolled(next)
    onValueChange?.(next)
    close()
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setKeyboardIndex(Math.min(activeIndex + 1, Math.max(matches.length - 1, 0)))
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setKeyboardIndex(Math.max(activeIndex - 1, 0))
      return
    }
    if (event.key === "Enter") {
      event.preventDefault()
      const option = matches[activeIndex]
      if (option) choose(option.value)
    }
  }

  return (
    <div ref={rootRef} className="grid gap-2">
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
      <Label htmlFor={fieldId}>{label}</Label>
      <button
        ref={triggerRef}
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-describedby={error ? errorId : undefined}
        onClick={() => {
          if (disabled) return
          if (open) close()
          else openMenu()
        }}
        className={cn(
          "relative flex h-11 w-full items-center rounded-lg border border-input bg-transparent pr-10 pl-3 text-left text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
          !selectedValue && "text-muted-foreground",
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate">{triggerLabel}</span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground">
          <ChevronDown aria-hidden className="size-4" />
        </span>
      </button>
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {open && panel
        ? createPortal(
            <div
              ref={panelRef}
              style={{
                top: panel.top,
                left: panel.left,
                width: panel.width,
                maxHeight: panel.maxHeight,
              }}
              className="fixed z-50 flex flex-col overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10"
            >
              <div className="shrink-0 border-b p-2">
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-muted-foreground">
                    <Search aria-hidden className="size-4" />
                  </span>
                  <input
                    ref={searchRef}
                    id={searchId}
                    type="search"
                    value={query}
                    autoComplete="off"
                    placeholder="Search"
                    aria-label={`Search ${label}`}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setKeyboardIndex(null)
                    }}
                    onKeyDown={onSearchKeyDown}
                    className="h-10 w-full rounded-md border border-input bg-transparent pr-3 pl-9 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
              </div>
              <ul
                id={listId}
                role="listbox"
                aria-label={label}
                className="min-h-0 flex-1 overflow-y-auto p-1"
              >
                {matches.length === 0 ? (
                  <li className="px-3 py-3 text-sm text-muted-foreground">No matches</li>
                ) : (
                  matches.map((option, index) => {
                    const active = option.value === selectedValue
                    return (
                      <li key={`${option.value}-${option.label}`}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          onMouseEnter={() => setKeyboardIndex(index)}
                          onClick={() => choose(option.value)}
                          className={cn(
                            "flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm",
                            index === activeIndex || active
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground",
                          )}
                        >
                          {option.label}
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

type PanelPosition = {
  top: number
  left: number
  width: number
  maxHeight: number
}

function positionPanel(trigger: HTMLButtonElement): PanelPosition {
  const rect = trigger.getBoundingClientRect()
  const gutter = 8
  const spaceBelow = window.innerHeight - rect.bottom - gutter
  const spaceAbove = rect.top - gutter
  const openUp = spaceBelow < 220 && spaceAbove > spaceBelow
  const maxHeight = Math.min(320, Math.max(openUp ? spaceAbove : spaceBelow, 160))
  const top = openUp ? Math.max(gutter, rect.top - maxHeight) : rect.bottom + 4

  return {
    top,
    left: rect.left,
    width: rect.width,
    maxHeight,
  }
}

function optionsFromChildren(children: ReactNode): SelectOption[] {
  return flattenOptions(children)
}

function flattenOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = []
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child == null || typeof child === "boolean") continue
    if (Array.isArray(child)) {
      options.push(...flattenOptions(child))
      continue
    }
    if (!isOptionElement(child)) continue
    options.push({
      value: String(child.props.value ?? ""),
      label: labelFromNode(child.props.children),
    })
  }
  return options
}

function isOptionElement(
  node: ReactNode,
): node is ReactElement<{ value?: string | number; children?: ReactNode }> {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    node.type === "option"
  )
}

function labelFromNode(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(labelFromNode).join("")
  return ""
}

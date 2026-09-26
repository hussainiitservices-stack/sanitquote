import Link from "next/link"

export function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-clip px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <Link href="/" className="text-sm font-semibold tracking-wide text-primary">
        SanitQuote
      </Link>
      <div className="flex flex-1 flex-col justify-center py-10">{children}</div>
    </div>
  )
}

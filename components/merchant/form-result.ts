import { toast } from "sonner"

import type { ActionResult } from "@/lib/admin/result"

export function applyFormResult(
  form: { setError: (name: "root", error: { message: string }) => void },
  router: { push: (href: string) => void; refresh: () => void },
  result: ActionResult,
) {
  if (!result.ok) {
    form.setError("root", { message: result.message })
    return
  }
  toast.success(result.message ?? "Saved")
  if (result.href) router.push(result.href)
  else router.refresh()
}

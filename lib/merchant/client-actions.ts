"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { blankToNull, dbErrorMessage, type ActionResult } from "@/lib/admin/result"
import { merchantDb, writeBlocked } from "@/lib/merchant/db"
import { clientFormSchema } from "@/lib/validations/merchant"

function valuesFrom(formData: FormData) {
  const values: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value
  }
  return values
}

function refreshDirectory(clientId?: string) {
  revalidatePath("/merchant")
  revalidatePath("/merchant/clients")
  revalidatePath("/merchant/quotations")
  if (clientId) revalidatePath(`/merchant/clients/${clientId}`)
}

export async function saveClient(formData: FormData): Promise<ActionResult> {
  const parsed = clientFormSchema.safeParse(valuesFrom(formData))
  if (!parsed.success) return { ok: false, message: "Check the client fields and try again." }

  const input = parsed.data
  const { supabase, workspace } = await merchantDb()
  const blocked = writeBlocked(workspace.subscriptionActive)
  if (blocked) return blocked

  const payload = {
    merchant_id: workspace.id,
    name: input.name,
    phone: blankToNull(input.phone),
    email: blankToNull(input.email),
    address: blankToNull(input.address),
    city: blankToNull(input.city),
    state: blankToNull(input.state),
    pincode: blankToNull(input.pincode),
    gstin: blankToNull(input.gstin),
    notes: blankToNull(input.notes),
  }

  if (input.id) {
    const { error } = await supabase.from("clients").update(payload).eq("id", input.id)
    if (error) return { ok: false, message: dbErrorMessage(error) }
    refreshDirectory(input.id)
    return { ok: true, message: "Client saved." }
  }

  const { data, error } = await supabase.from("clients").insert(payload).select("id").single()
  if (error || !data) return { ok: false, message: dbErrorMessage(error ?? { message: "" }) }
  refreshDirectory(data.id)
  return { ok: true, href: `/merchant/clients/${data.id}`, message: "Client created." }
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const { supabase, workspace } = await merchantDb()
  const blocked = writeBlocked(workspace.subscriptionActive)
  if (blocked) return blocked

  const { error } = await supabase.from("clients").delete().eq("id", id)
  if (error) return { ok: false, message: dbErrorMessage(error) }
  refreshDirectory()
  redirect("/merchant/clients")
}

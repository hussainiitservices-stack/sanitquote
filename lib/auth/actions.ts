"use server"

import { redirect, unstable_rethrow } from "next/navigation"

import { authEmailFromIdentifier } from "@/lib/auth/identity"
import { safeNextPath } from "@/lib/auth/paths"
import { getSessionUser } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import { loginSchema } from "@/lib/validations/auth"

export type ActionFailure = {
  ok: false
  message: string
}

export async function signIn(input: {
  identifier: string
  password: string
  next?: string
}): Promise<ActionFailure> {
  const parsed = loginSchema.safeParse({
    identifier: input.identifier,
    password: input.password,
  })

  if (!parsed.success) {
    return { ok: false, message: "Check the username and password." }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmailFromIdentifier(parsed.data.identifier),
      password: parsed.data.password,
    })
    if (error) {
      return { ok: false, message: "Those credentials were not recognized." }
    }
  } catch (error) {
    unstable_rethrow(error)
    return {
      ok: false,
      message: "Sign-in is unavailable. Check the Supabase environment variables.",
    }
  }

  const user = await getSessionUser()
  if (!user) {
    return {
      ok: false,
      message: "Signed in, but this account has no workspace profile yet.",
    }
  }

  if (user.role === "pending") redirect("/account-pending")
  redirect(safeNextPath(input.next, user.role))
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function redirectIfSignedIn(next?: string) {
  const user = await getSessionUser()
  if (!user) return
  if (user.role === "pending") redirect("/account-pending")
  redirect(safeNextPath(next, user.role))
}

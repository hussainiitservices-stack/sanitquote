import "server-only"

import { requireAdmin } from "@/lib/auth/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function adminDb() {
  const user = await requireAdmin()
  const supabase = await createClient()
  return { supabase, user }
}

export async function adminAuth() {
  await requireAdmin()
  return createAdminClient()
}

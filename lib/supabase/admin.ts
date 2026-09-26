import "server-only"

import { createClient } from "@supabase/supabase-js"

import { getServerEnv } from "@/lib/env/server"
import type { Database } from "@/types/database"

/** Bypasses RLS. Use only for provisioning and other trusted server jobs. */
export function createAdminClient() {
  const env = getServerEnv()
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

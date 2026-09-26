"use client"

import { useState } from "react"

import { createClient } from "@/lib/supabase/client"

export function useSupabase() {
  const [client] = useState(() => createClient())
  return client
}

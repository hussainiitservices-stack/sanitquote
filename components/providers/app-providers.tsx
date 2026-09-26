"use client"

import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"

import { PwaRegister } from "@/components/pwa/register"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "@/components/ui/sonner"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryProvider>
        {children}
        <Toaster position="top-center" />
        <PwaRegister />
      </QueryProvider>
    </ThemeProvider>
  )
}

"use client"

import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AppShell>{children}</AppShell>
}

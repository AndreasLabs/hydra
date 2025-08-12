"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import { appNavigation } from "@/config/navigation"
import { Menu, X } from "lucide-react"

export interface AppShellProps {
  children: React.ReactNode
}

function SidebarNav() {
  const router = useRouter()

  return (
    <nav className="p-4 space-y-2">
      {appNavigation.map((item) => {
        const isActive = router.pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const currentTitle =
    appNavigation.find((item) => item.href === router.pathname)?.name || "Dashboard"

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "block" : "hidden")}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Hydra Hub</h2>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <SidebarNav />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-64 lg:block">
        <div className="h-full bg-card border-r">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Hydra Hub</h2>
          </div>
          <SidebarNav />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </Button>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{currentTitle}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ModeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

export default AppShell



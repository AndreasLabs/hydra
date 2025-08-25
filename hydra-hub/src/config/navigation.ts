import { Home, Database, Workflow, BarChart3, Settings, Box, FolderOpen, File } from "lucide-react"

export const appNavigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: Database },
  { name: "Files", href: "/files", icon: File },
  { name: "Datasets", href: "/datasets", icon: FolderOpen },
  { name: "Workflow Jobs", href: "/workflow-jobs", icon: Workflow },
  { name: "Point Cloud", href: "/point-cloud", icon: Box },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
] as const

export type AppNavItem = (typeof appNavigation)[number]



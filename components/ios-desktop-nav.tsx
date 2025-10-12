"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  TrendingUp,
  Home,
  Settings,
  Users,
  ArrowLeftRight,
  ThumbsUp,
  Database,
} from "lucide-react"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Rankings", href: "/rankings", icon: TrendingUp },
  { name: "Rookie Draft", href: "/rookie-draft", icon: Users },
  { name: "Trade Analysis", href: "/trades", icon: ArrowLeftRight },
  { name: "Recommendations", href: "/recommendations", icon: ThumbsUp },
  { name: "NFL Data", href: "/nfl-data", icon: Database },
  { name: "Settings", href: "/more", icon: Settings },
]

export function IOSDesktopNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col z-40">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-ios-title-3 font-bold text-primary">
          Fantasy Analytics
        </h1>
        <p className="text-ios-caption text-text-secondary mt-1">
          Dynasty Management
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-ios-body touch-target",
                "hover:bg-muted active:scale-95",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-primary-foreground" : "text-text-secondary"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-ios-caption text-text-tertiary text-center">
          v1.0.0 • iOS Dark Theme
        </p>
      </div>
    </aside>
  )
}

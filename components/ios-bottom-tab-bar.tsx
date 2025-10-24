"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  TrendingUp,
  Home,
  MoreHorizontal,
  Users,
} from "lucide-react"

const tabs = [
  { name: "Home", href: "/", icon: Home, ariaLabel: "Navigate to Home page" },
  { name: "Dashboard", href: "/dashboard", icon: BarChart3, ariaLabel: "Navigate to Dashboard page" },
  { name: "Rankings", href: "/rankings", icon: TrendingUp, ariaLabel: "Navigate to Rankings page" },
  { name: "Rookie", href: "/rookie-draft", icon: Users, ariaLabel: "Navigate to Rookie Draft page" },
  { name: "More", href: "/more", icon: MoreHorizontal, ariaLabel: "Navigate to More options page" },
]

export function IOSBottomTabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-ios border-t border-border pb-safe"
    >
      <div className="flex justify-around items-center px-2 pt-2 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href

          return (
            <Link
              key={tab.name}
              href={tab.href}
              aria-label={tab.ariaLabel}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 touch-target",
                "active:brightness-90",
                isActive ? "text-primary" : "text-text-secondary"
              )}
            >
              {/* Active indicator background pill */}
              {isActive && (
                <div className="absolute inset-0 bg-primary/15 rounded-xl" />
              )}

              {/* Icon */}
              <Icon
                className={cn(
                  "relative w-6 h-6 transition-transform duration-200",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />

              {/* Label */}
              <span className={cn(
                "relative text-ios-caption font-medium transition-all duration-200",
                isActive && "font-semibold"
              )}>
                {tab.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

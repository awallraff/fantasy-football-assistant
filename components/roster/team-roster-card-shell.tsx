"use client"

import { CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { SleeperUser } from "@/lib/sleeper-api"

/** Loading / minimal roster header (single-line avatar + name). */
export function TeamRosterSimpleHeader({ user }: { user: SleeperUser }) {
  return (
    <CardTitle className="flex items-center gap-2 text-ios-title-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{user.display_name?.charAt(0) || user.username?.charAt(0) || "?"}</AvatarFallback>
      </Avatar>
      {user.display_name || user.username}
    </CardTitle>
  )
}

export function TeamRosterEmptyHeader({ user, isCurrentUser }: { user: SleeperUser; isCurrentUser: boolean }) {
  return (
    <CardTitle className="flex items-center gap-2 text-ios-title-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{user.display_name?.charAt(0) || user.username?.charAt(0) || "?"}</AvatarFallback>
      </Avatar>
      {user.display_name || user.username}
      {isCurrentUser && (
        <Badge variant="secondary" className="text-ios-caption">
          Your Team
        </Badge>
      )}
    </CardTitle>
  )
}

interface TeamRosterMainHeaderProps {
  user: SleeperUser
  isCurrentUser: boolean
  wins: number
  losses: number
  ties: number
  isCollapsed: boolean
  onToggleCollapsed: () => void
}

export function TeamRosterMainHeader({
  user,
  isCurrentUser,
  wins,
  losses,
  ties,
  isCollapsed,
  onToggleCollapsed,
}: TeamRosterMainHeaderProps) {
  return (
    <CardTitle className="flex items-center justify-between text-ios-title-3">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8 bg-background-elevated">
          <AvatarFallback className="bg-primary/10 font-bold text-primary">
            {user.display_name?.charAt(0) || user.username?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <span className="text-foreground">{user.display_name || user.username}</span>
        {isCurrentUser && (
          <Badge variant="default" className="bg-primary text-ios-caption">
            Your Team
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-ios-subheadline font-medium text-text-secondary">
          {wins}-{losses}
          {ties > 0 && `-${ties}`}
        </div>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={onToggleCollapsed}
          className="min-h-[44px] min-w-[44px] p-2 hover:bg-background-elevated"
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? (
            <ChevronDown className="h-5 w-5 text-text-secondary" />
          ) : (
            <ChevronUp className="h-5 w-5 text-text-secondary" />
          )}
        </Button>
      </div>
    </CardTitle>
  )
}

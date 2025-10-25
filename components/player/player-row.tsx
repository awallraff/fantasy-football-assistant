"use client"

/**
 * PlayerRow Component
 *
 * Standardized player row for roster/rankings display.
 * Mobile-first design with 44px minimum touch target.
 */

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  PlayerRowProps,
  DEFAULT_DISPLAY_OPTIONS,
  PlayerPosition,
} from '@/lib/types/player-row-types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

// Position color mapping from tailwind config
const POSITION_COLORS: Record<PlayerPosition, string> = {
  QB: 'bg-qb text-qb-foreground',
  RB: 'bg-rb text-rb-foreground',
  WR: 'bg-wr text-wr-foreground',
  TE: 'bg-te text-te-foreground',
  K: 'bg-k text-k-foreground',
  DEF: 'bg-def text-def-foreground',
  FLEX: 'bg-muted text-muted-foreground',
  SUPER_FLEX: 'bg-muted text-muted-foreground',
  BN: 'bg-muted text-muted-foreground',
  TAXI: 'bg-muted text-muted-foreground',
  IR: 'bg-muted text-muted-foreground',
}

// Get initials from player name
function getInitials(name: string): string {
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Get team logo URL (placeholder - can be replaced with real team logo service)
function getTeamLogoUrl(teamAbbr: string): string {
  // Using ESPN's team logo API as placeholder
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${teamAbbr.toLowerCase()}.png&h=40&w=40`
}

export function PlayerRow({
  player,
  displayOptions = DEFAULT_DISPLAY_OPTIONS,
  onClick,
  className,
  showHover = true,
  selected = false,
}: PlayerRowProps) {
  const options = { ...DEFAULT_DISPLAY_OPTIONS, ...displayOptions }
  const isClickable = !!onClick

  const handleClick = () => {
    if (onClick) {
      onClick(player)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick(player)
    }
  }

  return (
    <div
      className={cn(
        // Base styles - 44px minimum height for touch target
        'flex items-center gap-3 min-h-[44px] w-full',
        // Padding
        options.compact ? 'px-2 py-1' : 'px-3 py-2',
        // Interactive states
        isClickable && 'cursor-pointer',
        isClickable && showHover && 'hover:bg-accent/50 transition-colors',
        selected && 'bg-accent/70',
        isClickable && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // Rounded corners
        'rounded-md',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `View details for ${player.name}` : undefined}
    >
      {/* Player Headshot */}
      {options.showHeadshot && (
        <Avatar className={cn(options.compact ? 'h-8 w-8' : 'h-10 w-10', 'flex-shrink-0')}>
          <AvatarImage src={player.headshotUrl} alt={`${player.name} headshot`} />
          <AvatarFallback className="text-xs font-medium">
            {getInitials(player.name)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {/* Player Info (Name + Team) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Player Name */}
            <span
              className={cn(
                'font-medium truncate',
                options.compact ? 'text-sm' : 'text-base'
              )}
            >
              {player.name}
            </span>

            {/* Position Badge */}
            {options.showPosition && (
              <Badge
                variant="secondary"
                className={cn(
                  'flex-shrink-0 font-semibold',
                  options.compact ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5',
                  POSITION_COLORS[player.position]
                )}
              >
                {player.position}
              </Badge>
            )}
          </div>

          {/* Team Logo + Abbreviation */}
          {options.showTeamLogo && player.team && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Image
                src={getTeamLogoUrl(player.team)}
                alt={`${player.team} logo`}
                width={options.compact ? 16 : 20}
                height={options.compact ? 16 : 20}
                className={cn('flex-shrink-0', options.compact ? 'h-4 w-4' : 'h-5 w-5')}
                loading="lazy"
                onError={(e) => {
                  // Fallback to text if image fails
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className="text-xs text-muted-foreground font-medium">{player.team}</span>
            </div>
          )}
        </div>

        {/* Key Stat */}
        {options.showStat && player.keyStat && (
          <div className="flex-shrink-0 text-right">
            <div
              className={cn(
                'font-semibold tabular-nums',
                options.compact ? 'text-sm' : 'text-base'
              )}
            >
              {player.keyStat}
            </div>
            {options.showSecondaryStat && player.secondaryStat && (
              <div className="text-xs text-muted-foreground tabular-nums">
                {player.secondaryStat}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

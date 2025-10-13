/**
 * Player Row Component Types
 *
 * Type definitions for the standardized player row component used across
 * roster displays, rankings tables, and search results.
 */

export type PlayerPosition = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF'

export interface PlayerRowData {
  /** Player ID (from Sleeper API) */
  playerId: string
  /** Player full name */
  name: string
  /** Player position */
  position: PlayerPosition
  /** Team abbreviation (e.g., "KC", "SF") */
  team?: string
  /** Player headshot URL */
  headshotUrl?: string
  /** Key stat to display (e.g., "234.5 pts", "15 TD", "1,247 yds") */
  keyStat?: string
  /** Optional secondary stat */
  secondaryStat?: string
}

export interface PlayerRowDisplayOptions {
  /** Show player headshot image */
  showHeadshot?: boolean
  /** Show team logo */
  showTeamLogo?: boolean
  /** Show position badge */
  showPosition?: boolean
  /** Show key stat */
  showStat?: boolean
  /** Show secondary stat */
  showSecondaryStat?: boolean
  /** Compact mode (reduces padding and font sizes) */
  compact?: boolean
}

export interface PlayerRowProps {
  /** Player data to display */
  player: PlayerRowData
  /** Display options for showing/hiding elements */
  displayOptions?: PlayerRowDisplayOptions
  /** Click handler when row is tapped */
  onClick?: (player: PlayerRowData) => void
  /** Additional CSS classes */
  className?: string
  /** Show hover state */
  showHover?: boolean
  /** Show selected state */
  selected?: boolean
}

export const DEFAULT_DISPLAY_OPTIONS: PlayerRowDisplayOptions = {
  showHeadshot: true,
  showTeamLogo: true,
  showPosition: true,
  showStat: true,
  showSecondaryStat: false,
  compact: false,
}

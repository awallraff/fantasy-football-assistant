"use client"

/**
 * Player Row Component Demo Page
 *
 * Showcases all player row variants, display options, and interactive states
 * for testing and documentation purposes.
 */

import { PlayerRow } from '@/components/player/player-row'
import { PlayerRowData } from '@/lib/types/player-row-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

export default function PlayerRowDemoPage() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [clickedPlayer, setClickedPlayer] = useState<string>('')

  // Sample player data
  const samplePlayers: PlayerRowData[] = [
    {
      playerId: '1',
      name: 'Patrick Mahomes',
      position: 'QB',
      team: 'KC',
      headshotUrl: 'https://sleepercdn.com/content/nfl/players/4046.jpg',
      keyStat: '4,183 yds',
      secondaryStat: '27 TD',
    },
    {
      playerId: '2',
      name: 'Christian McCaffrey',
      position: 'RB',
      team: 'SF',
      headshotUrl: 'https://sleepercdn.com/content/nfl/players/4034.jpg',
      keyStat: '1,459 yds',
      secondaryStat: '14 TD',
    },
    {
      playerId: '3',
      name: 'Justin Jefferson',
      position: 'WR',
      team: 'MIN',
      headshotUrl: 'https://sleepercdn.com/content/nfl/players/6786.jpg',
      keyStat: '1,809 yds',
      secondaryStat: '5 TD',
    },
    {
      playerId: '4',
      name: 'Travis Kelce',
      position: 'TE',
      team: 'KC',
      headshotUrl: 'https://sleepercdn.com/content/nfl/players/2133.jpg',
      keyStat: '984 yds',
      secondaryStat: '5 TD',
    },
    {
      playerId: '5',
      name: 'Harrison Butker',
      position: 'K',
      team: 'KC',
      headshotUrl: 'https://sleepercdn.com/content/nfl/players/4199.jpg',
      keyStat: '146 pts',
      secondaryStat: '33/35 FG',
    },
  ]

  const handlePlayerClick = (player: PlayerRowData) => {
    setSelectedPlayerId(player.playerId)
    setClickedPlayer(`${player.name} (${player.position})`)
    setTimeout(() => setClickedPlayer(''), 2000)
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 md:space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Player Row Component</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Standardized player row for roster/rankings display. Mobile-first design with 44px
          minimum touch target.
        </p>
        {clickedPlayer && (
          <p className="mt-2 text-sm font-medium text-success">
            Clicked: {clickedPlayer}
          </p>
        )}
      </div>

      {/* Default Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Default Configuration</CardTitle>
          <CardDescription>All options enabled, clickable rows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {samplePlayers.map((player) => (
            <PlayerRow
              key={player.playerId}
              player={player}
              onClick={handlePlayerClick}
              selected={player.playerId === selectedPlayerId}
            />
          ))}
        </CardContent>
      </Card>

      {/* Compact Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Compact Mode</CardTitle>
          <CardDescription>Reduced padding and font sizes for dense layouts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {samplePlayers.map((player) => (
            <PlayerRow
              key={player.playerId}
              player={player}
              displayOptions={{ compact: true }}
              onClick={handlePlayerClick}
            />
          ))}
        </CardContent>
      </Card>

      {/* Without Headshots */}
      <Card>
        <CardHeader>
          <CardTitle>Without Headshots</CardTitle>
          <CardDescription>Useful for list views where space is limited</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {samplePlayers.slice(0, 3).map((player) => (
            <PlayerRow
              key={player.playerId}
              player={player}
              displayOptions={{ showHeadshot: false }}
              onClick={handlePlayerClick}
            />
          ))}
        </CardContent>
      </Card>

      {/* Without Team Logos */}
      <Card>
        <CardHeader>
          <CardTitle>Without Team Logos</CardTitle>
          <CardDescription>Minimal display focusing on player and stats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {samplePlayers.slice(0, 3).map((player) => (
            <PlayerRow
              key={player.playerId}
              player={player}
              displayOptions={{ showTeamLogo: false }}
              onClick={handlePlayerClick}
            />
          ))}
        </CardContent>
      </Card>

      {/* With Secondary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>With Secondary Stats</CardTitle>
          <CardDescription>Shows both primary and secondary statistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {samplePlayers.map((player) => (
            <PlayerRow
              key={player.playerId}
              player={player}
              displayOptions={{ showSecondaryStat: true }}
              onClick={handlePlayerClick}
            />
          ))}
        </CardContent>
      </Card>

      {/* Minimal Display */}
      <Card>
        <CardHeader>
          <CardTitle>Minimal Display</CardTitle>
          <CardDescription>Name and position only, no stats or logos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {samplePlayers.slice(0, 3).map((player) => (
            <PlayerRow
              key={player.playerId}
              player={player}
              displayOptions={{
                showHeadshot: false,
                showTeamLogo: false,
                showStat: false,
              }}
              onClick={handlePlayerClick}
            />
          ))}
        </CardContent>
      </Card>

      {/* Non-Interactive Rows */}
      <Card>
        <CardHeader>
          <CardTitle>Non-Interactive Rows</CardTitle>
          <CardDescription>Display-only rows without click handlers or hover states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {samplePlayers.slice(0, 3).map((player) => (
            <PlayerRow
              key={player.playerId}
              player={player}
              showHover={false}
            />
          ))}
        </CardContent>
      </Card>

      {/* Mobile Viewport Test */}
      <Card>
        <CardHeader>
          <CardTitle>Mobile Viewport Test (375px)</CardTitle>
          <CardDescription>
            Resize browser to 375px to test mobile responsiveness. All rows maintain 44px
            minimum height.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted rounded-lg p-2 max-w-[375px] mx-auto space-y-2">
            {samplePlayers.slice(0, 3).map((player) => (
              <PlayerRow
                key={player.playerId}
                player={player}
                onClick={handlePlayerClick}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Features */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Touch Targets:</strong> Minimum 44px height meets WCAG 2.1 AA guidelines
            </li>
            <li>
              <strong>Keyboard Navigation:</strong> All clickable rows are keyboard accessible
              (Tab to focus, Enter/Space to activate)
            </li>
            <li>
              <strong>ARIA Labels:</strong> Descriptive labels for screen readers on clickable rows
            </li>
            <li>
              <strong>Focus Indicators:</strong> Visible focus ring for keyboard navigation
            </li>
            <li>
              <strong>Hover States:</strong> Clear visual feedback on hover
            </li>
            <li>
              <strong>Position Colors:</strong> Semantic colors for each position type
            </li>
            <li>
              <strong>Truncation:</strong> Long names truncate gracefully with ellipsis
            </li>
            <li>
              <strong>Fallbacks:</strong> Initials shown when headshot unavailable
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

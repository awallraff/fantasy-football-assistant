"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayerCard, type DisplayPlayer } from "@/components/roster/player-card"

export interface TeamRosterStartersBenchTabsProps {
  starters: DisplayPlayer[]
  bench: DisplayPlayer[]
  projectionsLoading: boolean
  onSelectPlayer: (player: DisplayPlayer) => void
}

export function TeamRosterStartersBenchTabs({
  starters,
  bench,
  projectionsLoading,
  onSelectPlayer,
}: TeamRosterStartersBenchTabsProps) {
  return (
    <Tabs defaultValue="starters" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="starters">Starters ({starters.length})</TabsTrigger>
        <TabsTrigger value="bench">Bench ({bench.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="starters" className="space-y-compact-sm">
        {starters.length === 0 ? (
          <div className="py-8 text-center text-ios-body text-text-secondary">No starters found</div>
        ) : (
          starters.map((player) => (
            <PlayerCard
              key={player.player_id}
              player={player}
              isStarter={true}
              onClick={() => onSelectPlayer(player)}
              projectionsLoading={projectionsLoading}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="bench" className="space-y-compact-sm">
        {bench.length === 0 ? (
          <div className="py-8 text-center text-ios-body text-text-secondary">No bench players found</div>
        ) : (
          bench.map((player) => (
            <PlayerCard
              key={player.player_id}
              player={player}
              isStarter={false}
              onClick={() => onSelectPlayer(player)}
              projectionsLoading={projectionsLoading}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  )
}

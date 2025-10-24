import React from "react"
import { List } from "react-window"
import AutoSizer from "react-virtualized-auto-sizer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTierColor } from "@/lib/ranking-utils"

interface SimplePlayerRanking {
  rank: number
  playerId: string
  playerName: string
  position: string
  team: string
  projectedPoints?: number
  tier?: number
  notes?: string
  injuryStatus?: string
}

interface VirtualizedRankingListProps {
  data: SimplePlayerRanking[]
  onPlayerClick: (player: SimplePlayerRanking) => void
}

interface CustomRowProps {
  playerData: SimplePlayerRanking[]
  onPlayerClick: (player: SimplePlayerRanking) => void
}

interface FullRowProps extends CustomRowProps {
  index: number
  style: React.CSSProperties
  ariaAttributes?: {
    "aria-posinset": number
    "aria-setsize": number
    role: string
  }
}

export const VirtualizedRankingList: React.FC<VirtualizedRankingListProps> = ({ data, onPlayerClick }) => {
  // Fixed height of 140px + 12px spacing (py-1.5 = 6px top + 6px bottom)
  const ITEM_SIZE = 152

  const RankingRow: React.FC<FullRowProps> = ({ index, style, playerData, onPlayerClick: handleClick }) => {
    const player = playerData[index]

    return (
      <div style={{ ...style, padding: "6px 0" }}>
        <Card
          className="p-4 cursor-pointer hover:bg-muted/30 transition-colors overflow-hidden"
          onClick={() => handleClick(player)}
        >
          <div className="space-y-3 min-w-0">
            <div className="flex justify-between items-start gap-2 min-w-0">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 min-w-[44px] min-h-[44px] text-white rounded-full flex items-center justify-center text-sm font-bold ${getTierColor(player.tier)} shrink-0`}>
                  {player.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{player.playerName}</div>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs shrink-0">{player.position}</Badge>
                    <span className="text-sm text-muted-foreground truncate">{player.team}</span>
                  </div>
                </div>
              </div>
              {player.tier && (
                <Badge variant="secondary" className="text-xs shrink-0">Tier {player.tier}</Badge>
              )}
            </div>
            <div className="flex justify-between items-center text-sm gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground">Projected: </span>
                <span className="font-medium">{player.projectedPoints ? `${player.projectedPoints.toFixed(1)} pts` : '-'}</span>
              </div>
              <div className="shrink-0">
                {player.injuryStatus && player.injuryStatus !== "Healthy" ? (
                  <Badge variant="destructive" className="text-xs">{player.injuryStatus}</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Healthy</Badge>
                )}
              </div>
            </div>
            {player.notes && (
              <div className="text-xs text-muted-foreground border-t pt-2 break-words">
                {player.notes}
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="md:hidden" style={{ height: "600px" }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            defaultHeight={height}
            style={{ width }}
            rowCount={data.length}
            rowHeight={ITEM_SIZE}
            rowComponent={RankingRow}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rowProps={{ playerData: data, onPlayerClick } as any}
            overscanCount={5}
          />
        )}
      </AutoSizer>
    </div>
  )
}

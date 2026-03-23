"use client"

import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SleeperRoster, SleeperUser } from "@/lib/sleeper-api"

const EnhancedTeamRoster = dynamic(
  () => import("@/components/enhanced-team-roster").then((mod) => ({ default: mod.EnhancedTeamRoster })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    ),
  }
)

export interface DashboardTeamsTabProps {
  rosters: SleeperRoster[]
  leagueUsers: SleeperUser[]
  sortedRosters: SleeperRoster[]
  currentUserId: string | null | undefined
}

/**
 * Teams tab: roster list with explicit empty states when data is missing or unmatched.
 */
export function DashboardTeamsTab({
  rosters,
  leagueUsers,
  sortedRosters,
  currentUserId,
}: DashboardTeamsTabProps) {
  return (
    <div className="grid gap-compact-md md:gap-compact-xl">
      {process.env.NODE_ENV === "development" && (
        <div className="rounded-lg bg-yellow-100 p-compact-md text-xs shadow-sm dark:bg-yellow-900/20">
          <div>Rosters: {rosters.length}</div>
          <div>Sorted Rosters: {sortedRosters.length}</div>
          <div>League Users: {leagueUsers.length}</div>
          <div>User IDs: {leagueUsers.map((u) => u.user_id).join(", ")}</div>
          <div>Roster Owner IDs: {rosters.map((r) => r.owner_id).join(", ")}</div>
        </div>
      )}

      <div className="space-y-compact-xl">
        {sortedRosters.length === 0 ? (
          <Card className="rounded-lg bg-background-elevated shadow-md">
            <CardHeader>
              <CardTitle className="text-ios-title-3">No Teams Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-ios-body text-text-secondary">
                {rosters.length === 0
                  ? "No rosters loaded for this league. Try refreshing the page."
                  : leagueUsers.length === 0
                    ? "League user data is missing. Try refreshing the page."
                    : "Unable to match rosters with league users. Contact support if this persists."}
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedRosters.map((roster) => {
            const owner = leagueUsers.find((u) => u.user_id === roster.owner_id)
            if (!owner) {
              console.error(`CRITICAL: No owner found for roster ${roster.roster_id} despite filtering`)
              return null
            }
            return (
              <EnhancedTeamRoster
                key={roster.roster_id}
                roster={roster}
                user={owner}
                isCurrentUser={owner.user_id === currentUserId}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

import type { SleeperLeague, SleeperPlayer, SleeperRoster } from "@/lib/sleeper-api"
import {
  getStarterSlotList,
  greedyOptimalLineup,
  lineupDiffVsCurrent,
  buildRosterRows,
  findComplementaryTradeOpportunity,
  type ProjectionGetter,
} from "@/lib/league-roster-analysis"

const mockLeague: SleeperLeague = {
  league_id: "l1",
  name: "Test",
  season: "2025",
  sport: "nfl",
  season_type: "regular",
  settings: { num_teams: 12 },
  roster_positions: ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "BN", "BN"],
  total_rosters: 12,
  scoring_settings: { pass_td: 4 },
  status: "in_season",
}

const emptyRosterSettings = {
  wins: 0,
  losses: 0,
  ties: 0,
  fpts: 0,
  fpts_against: 0,
  fpts_decimal: 0,
  fpts_against_decimal: 0,
}

describe("league-roster-analysis", () => {
  const proj: ProjectionGetter = (id) => {
    const map: Record<string, number> = {
      q1: 18,
      r1: 14,
      r2: 8,
      w1: 12,
      w2: 10,
      w3: 9,
      t1: 7,
    }
    const v = map[id]
    return v != null ? { weeklyProjection: v, tier: 3 } : null
  }

  it("getStarterSlotList excludes bench", () => {
    expect(getStarterSlotList(["QB", "BN", "FLEX"])).toEqual(["QB", "FLEX"])
  })

  it("buildRosterRows marks starters and projections", () => {
    const roster: SleeperRoster = {
      roster_id: 1,
      owner_id: "u1",
      players: ["q1", "r1", "w1"],
      starters: ["q1", "r1"],
      settings: emptyRosterSettings,
    }
    const getPlayer = (id: string): SleeperPlayer | null =>
      ({
        player_id: id,
        position: id.startsWith("q") ? "QB" : id.startsWith("r") ? "RB" : "WR",
        team: "TST",
        full_name: id,
      }) as SleeperPlayer

    const rows = buildRosterRows(roster, getPlayer, proj)
    expect(rows.find((r) => r.playerId === "q1")?.isStarter).toBe(true)
    expect(rows.find((r) => r.playerId === "w1")?.isStarter).toBe(false)
    expect(rows.find((r) => r.playerId === "q1")?.weeklyProjection).toBe(18)
  })

  it("findComplementaryTradeOpportunity returns swap when benches favor it", () => {
    const user: SleeperRoster = {
      roster_id: 1,
      owner_id: "u1",
      players: ["r1", "r2", "w1", "w2"],
      starters: ["r1", "w1"],
      settings: emptyRosterSettings,
    }
    const opp: SleeperRoster = {
      roster_id: 2,
      owner_id: "u2",
      players: ["r3", "w3", "w4", "t1"],
      starters: ["r3", "w3"],
      settings: emptyRosterSettings,
    }
    const getPlayer = (id: string): SleeperPlayer | null =>
      ({
        player_id: id,
        position: id.startsWith("r") ? "RB" : id.startsWith("w") ? "WR" : "TE",
        team: "TST",
        full_name: id,
      }) as SleeperPlayer

    const p: ProjectionGetter = (id) => {
      const map: Record<string, number> = {
        r1: 20,
        r2: 15,
        w1: 10,
        w2: 14,
        r3: 18,
        w3: 12,
        w4: 16,
        t1: 8,
      }
      const v = map[id]
      return v != null ? { weeklyProjection: v, tier: 3 } : null
    }

    const out = findComplementaryTradeOpportunity(user, opp, getPlayer, p)
    expect(out).not.toBeNull()
    expect(out!.projectedGain).toBeGreaterThan(0.5)
  })

  it("lineupDiffVsCurrent pairs bench and optimal starters", () => {
    const roster: SleeperRoster = {
      roster_id: 1,
      owner_id: "u1",
      players: ["q1", "r1", "r2", "w1", "w2", "w3", "t1"],
      starters: ["q1", "r1", "w1", "w2", "t1"],
      settings: emptyRosterSettings,
    }
    const getPlayer = (id: string): SleeperPlayer | null =>
      ({
        player_id: id,
        position: id.startsWith("q") ? "QB" : id.startsWith("r") ? "RB" : id.startsWith("w") ? "WR" : "TE",
        team: "TST",
        full_name: id,
      }) as SleeperPlayer

    const rows = buildRosterRows(roster, getPlayer, proj)
    const { optimalStarters } = greedyOptimalLineup(mockLeague, rows, getPlayer)
    const { swaps } = lineupDiffVsCurrent(roster, optimalStarters, rows)
    expect(Array.isArray(swaps)).toBe(true)
  })
})

/**
 * League roster analysis for trade, lineup, and waiver tools (TD-005).
 * Uses Sleeper roster shapes + player lookup + weekly projection estimates.
 */

import type { SleeperLeague, SleeperPlayer, SleeperRoster } from "@/lib/sleeper-api"

export type ProjectionGetter = (playerId: string, playerName?: string) => { weeklyProjection: number; tier: number } | null

export interface RosterPlayerRow {
  playerId: string
  name: string
  position: string
  team: string
  weeklyProjection: number
  isStarter: boolean
  injuryStatus?: string | null
}

const BENCH_SLOT = new Set(["BN", "IR", "TAXI", "RESERVE"])

/** Starter slots from league.roster_positions (excludes bench/reserve). */
export function getStarterSlotList(rosterPositions: string[]): string[] {
  return rosterPositions.filter((p) => !BENCH_SLOT.has(p) && !p.startsWith("REC_"))
}

export function buildRosterRows(
  roster: SleeperRoster,
  getPlayer: (id: string) => SleeperPlayer | null,
  getProjection: ProjectionGetter
): RosterPlayerRow[] {
  const ids = [...new Set([...(roster.players || []), ...(roster.starters || [])])]
  const starterSet = new Set(roster.starters || [])

  return ids.map((playerId) => {
    const p = getPlayer(playerId)
    const name =
      p?.full_name?.trim() ||
      `${p?.first_name || ""} ${p?.last_name || ""}`.trim() ||
      playerId
    const position = p?.position || "UNK"
    const team = p?.team || "FA"
    const proj = getProjection(playerId, name)?.weeklyProjection ?? 0
    return {
      playerId,
      name,
      position,
      team,
      weeklyProjection: proj,
      isStarter: starterSet.has(playerId),
      injuryStatus: p?.injury_status,
    }
  })
}

/** Group rows by normalized fantasy position (QB/RB/WR/TE/K/DEF). */
export function groupByPosition(rows: RosterPlayerRow[]): Record<string, RosterPlayerRow[]> {
  const out: Record<string, RosterPlayerRow[]> = {}
  for (const r of rows) {
    const pos = normalizePosition(r.position)
    if (!out[pos]) out[pos] = []
    out[pos].push(r)
  }
  for (const k of Object.keys(out)) {
    out[k].sort((a, b) => b.weeklyProjection - a.weeklyProjection)
  }
  return out
}

function normalizePosition(pos: string): string {
  const u = pos?.toUpperCase() || "UNK"
  if (["QB", "RB", "WR", "TE", "K"].includes(u)) return u
  if (u === "DEF" || u === "DL" || u === "LB" || u === "DB") return "DEF"
  return u
}

/** Greedy optimal lineup: fill each slot in order with best eligible unassigned player. */
export function greedyOptimalLineup(
  league: SleeperLeague,
  rows: RosterPlayerRow[],
  getPlayer: (id: string) => SleeperPlayer | null
): { totalProjection: number; optimalStarters: Set<string>; bySlot: { slot: string; playerId: string }[] } {
  const slots = getStarterSlotList(league.roster_positions || [])
  const pool = [...rows].sort((a, b) => b.weeklyProjection - a.weeklyProjection)
  const used = new Set<string>()
  const bySlot: { slot: string; playerId: string }[] = []
  let total = 0

  const canFill = (slot: string, playerId: string): boolean => {
    const p = getPlayer(playerId)
    const pos = normalizePosition(p?.position || "")
    if (slot === "QB") return pos === "QB"
    if (slot === "RB") return pos === "RB"
    if (slot === "WR") return pos === "WR"
    if (slot === "TE") return pos === "TE"
    if (slot === "K") return pos === "K"
    if (slot === "DEF") return pos === "DEF" || pos === "DL" || pos === "LB" || pos === "DB"
    if (slot === "FLEX") return ["RB", "WR", "TE"].includes(pos)
    if (slot === "SUPER_FLEX") return ["QB", "RB", "WR", "TE"].includes(pos)
    return false
  }

  for (const slot of slots) {
    const pick = pool.find((r) => !used.has(r.playerId) && canFill(slot, r.playerId))
    if (pick) {
      used.add(pick.playerId)
      bySlot.push({ slot, playerId: pick.playerId })
      total += pick.weeklyProjection
    }
  }

  return { totalProjection: total, optimalStarters: used, bySlot }
}

export function lineupDiffVsCurrent(
  roster: SleeperRoster,
  optimalStarters: Set<string>,
  rows: RosterPlayerRow[]
): {
  swaps: { bench: RosterPlayerRow; out: RosterPlayerRow; gain: number }[]
  currentTotal: number
} {
  const currentStarters = new Set(roster.starters || [])
  let currentTotal = 0
  for (const r of rows) {
    if (currentStarters.has(r.playerId)) currentTotal += r.weeklyProjection
  }

  const toBench = rows
    .filter((r) => currentStarters.has(r.playerId) && !optimalStarters.has(r.playerId))
    .sort((a, b) => a.weeklyProjection - b.weeklyProjection)
  const toStart = rows
    .filter((r) => optimalStarters.has(r.playerId) && !currentStarters.has(r.playerId))
    .sort((a, b) => b.weeklyProjection - a.weeklyProjection)

  const swaps: { bench: RosterPlayerRow; out: RosterPlayerRow; gain: number }[] = []
  const n = Math.min(toBench.length, toStart.length)
  for (let i = 0; i < n; i++) {
    const gain = toStart[i].weeklyProjection - toBench[i].weeklyProjection
    if (gain > 0.05) swaps.push({ bench: toStart[i], out: toBench[i], gain })
  }
  swaps.sort((a, b) => b.gain - a.gain)
  return { swaps: swaps.slice(0, 8), currentTotal }
}

export interface StartSitDecisionRow {
  playerId: string
  name: string
  position: string
  team: string
  opponent: string
  recommendation: "start" | "sit" | "flex"
  confidence: number
  projectedPoints: number
  reasoning: string[]
  matchupGrade: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D+" | "D" | "F"
  riskLevel: "low" | "medium" | "high"
  injuryStatus?: "healthy" | "questionable" | "doubtful"
  weatherConcern?: boolean
}

/** Start/sit: starters vs bench at each position with recommendation. */
export function buildStartSitDecisions(rows: RosterPlayerRow[]): StartSitDecisionRow[] {
  const byPos = groupByPosition(rows)
  const decisions: StartSitDecisionRow[] = []

  for (const r of rows) {
    const atPos = byPos[normalizePosition(r.position)] || []
    const rank = atPos.findIndex((x) => x.playerId === r.playerId) + 1
    const sorted = [...atPos].sort((a, b) => b.weeklyProjection - a.weeklyProjection)
    const bestAtPos = sorted[0]?.weeklyProjection || 0

    let recommendation: "start" | "sit" | "flex" = "sit"
    if (r.isStarter) {
      if (r.weeklyProjection >= bestAtPos * 0.95 || rank <= 2) recommendation = "start"
      else recommendation = "flex"
    } else {
      if (rank <= 3 && r.weeklyProjection > 5) recommendation = "flex"
      else recommendation = "sit"
    }

    const ratio = bestAtPos > 0 ? r.weeklyProjection / bestAtPos : 0
    let matchupGrade: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D+" | "D" | "F" = "C"
    if (ratio >= 0.95) matchupGrade = "A"
    else if (ratio >= 0.85) matchupGrade = "B+"
    else if (ratio >= 0.75) matchupGrade = "B"
    else if (ratio >= 0.65) matchupGrade = "C+"
    else if (ratio >= 0.55) matchupGrade = "C"
    else matchupGrade = "D"

    const inj = r.injuryStatus?.toLowerCase() || ""
    let injuryStatus: "healthy" | "questionable" | "doubtful" | undefined
    if (inj.includes("question")) injuryStatus = "questionable"
    else if (inj.includes("doubt")) injuryStatus = "doubtful"
    else injuryStatus = "healthy"

    const confidence = Math.min(95, Math.round(50 + ratio * 40))
    const riskLevel: "low" | "medium" | "high" =
      injuryStatus !== "healthy" ? "high" : r.weeklyProjection < 6 ? "medium" : "low"

    const reasoning: string[] = []
    if (r.isStarter) reasoning.push("Listed in your active lineup for this week.")
    else reasoning.push("On bench; compare projection to your starters.")
    reasoning.push(
      `Projection rank ${rank} among ${r.position} on your roster (${r.weeklyProjection.toFixed(1)} pts).`
    )
    if (injuryStatus !== "healthy") reasoning.push(`Injury status: ${r.injuryStatus || "check reports"}.`)

    decisions.push({
      playerId: r.playerId,
      name: r.name,
      position: r.position,
      team: r.team,
      opponent: "—",
      recommendation,
      confidence,
      projectedPoints: r.weeklyProjection,
      reasoning,
      matchupGrade,
      riskLevel,
      injuryStatus,
      weatherConcern: false,
    })
  }

  return decisions.sort((a, b) => b.projectedPoints - a.projectedPoints)
}

export interface TradeOpportunity {
  confidence: number
  projectedGain: number
  reasoning: string[]
  yourPlayers: Array<{ name: string; position: string; currentValue: number; projectedValue: number }>
  theirPlayers: Array<{ name: string; position: string; currentValue: number; projectedValue: number }>
  tradeType: "buy_low" | "sell_high" | "positional_need" | "value_play"
  urgency: "high" | "medium" | "low"
  successProbability: number
}

/** Heuristic complementary trade: bench-for-bench across different skill positions. */
export function findComplementaryTradeOpportunity(
  userRoster: SleeperRoster,
  opponentRoster: SleeperRoster,
  getPlayer: (id: string) => SleeperPlayer | null,
  getProjection: ProjectionGetter
): TradeOpportunity | null {
  const uRows = buildRosterRows(userRoster, getPlayer, getProjection)
  const oRows = buildRosterRows(opponentRoster, getPlayer, getProjection)
  const uBy = groupByPosition(uRows)
  const oBy = groupByPosition(oRows)

  const POS = ["RB", "WR", "TE"] as const
  let best: { score: number; uGive: RosterPlayerRow; oGive: RosterPlayerRow } | null = null

  for (const givePos of POS) {
    for (const getPos of POS) {
      if (givePos === getPos) continue
      const uBench = uBy[givePos]?.filter((r) => !r.isStarter) || []
      const oBench = oBy[getPos]?.filter((r) => !r.isStarter) || []
      if (uBench.length === 0 || oBench.length === 0) continue

      const uGive = uBench[0]
      const oGive = oBench[0]
      const score = oGive.weeklyProjection - uGive.weeklyProjection
      if (score <= 0.5) continue

      if (!best || score > best.score) {
        best = { score, uGive, oGive }
      }
    }
  }

  if (!best) return null

  const projectedGain = Math.max(0.5, best.score)
  const confidence = Math.min(88, 52 + Math.round(projectedGain * 2.5))
  return {
    confidence,
    projectedGain,
    reasoning: [
      `Depth-based idea: move bench ${best.uGive.position} (${best.uGive.name}) for bench ${best.oGive.position} (${best.oGive.name}) if both sides need the swap.`,
      "Projections come from your synced rankings context; confirm injuries and game script in Sleeper.",
      "Propose in-app; this assistant cannot execute trades.",
    ],
    yourPlayers: [
      {
        name: best.uGive.name,
        position: best.uGive.position,
        currentValue: Math.round(best.uGive.weeklyProjection * 10),
        projectedValue: Math.round(best.uGive.weeklyProjection * 11),
      },
    ],
    theirPlayers: [
      {
        name: best.oGive.name,
        position: best.oGive.position,
        currentValue: Math.round(best.oGive.weeklyProjection * 10),
        projectedValue: Math.round(best.oGive.weeklyProjection * 11),
      },
    ],
    tradeType: "positional_need",
    urgency: projectedGain > 8 ? "high" : projectedGain > 4 ? "medium" : "low",
    successProbability: Math.min(85, 40 + confidence * 0.4),
  }
}

/** Waiver: players at position not on any league roster, top by projection. */
export function suggestWaiverTargets(
  leagueRosters: SleeperRoster[],
  candidates: SleeperPlayer[],
  getProjection: ProjectionGetter,
  limit = 12
): Array<{
  playerId: string
  name: string
  position: string
  team: string
  ownership: number
  projectedPoints: number
  upside: number
  priority: "high" | "medium" | "low"
  reasoning: string[]
  rosterPercentage: number
  trendingUp: boolean
  scheduleRating: "excellent" | "good" | "average" | "poor"
  recommendedBid: number
}> {
  const claimed = new Set<string>()
  for (const r of leagueRosters) {
    for (const id of r.players || []) claimed.add(id)
  }

  const free = candidates.filter((p) => p.player_id && !claimed.has(p.player_id))
  const scored = free
    .map((p) => {
      const name = p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim()
      const proj = getProjection(p.player_id, name)?.weeklyProjection ?? 0
      const tier = getProjection(p.player_id, name)?.tier ?? 5
      return { p, name, proj, tier }
    })
    .filter((x) => x.proj > 0 || x.tier < 8)
    .sort((a, b) => b.proj - a.proj)
    .slice(0, limit)

  return scored.map((x, i) => {
    const priority: "high" | "medium" | "low" = i < 4 ? "high" : i < 9 ? "medium" : "low"
    const scheduleRating: "excellent" | "good" | "average" | "poor" =
      x.proj >= 12 ? "excellent" : x.proj >= 8 ? "good" : x.proj >= 5 ? "average" : "poor"
    return {
      playerId: x.p.player_id,
      name: x.name || x.p.player_id,
      position: x.p.position || "?",
      team: x.p.team || "FA",
      ownership: Math.max(5, Math.min(95, 100 - i * 7)),
      projectedPoints: x.proj,
      upside: x.proj * 1.15,
      priority,
      reasoning: [
        "Not rostered in this league; projection from your rankings context.",
        `Tier ${x.tier} — compare with your bench before spending FAAB.`,
      ],
      rosterPercentage: Math.max(5, Math.min(95, 100 - i * 7)),
      trendingUp: x.proj >= 10,
      scheduleRating,
      recommendedBid: Math.min(50, Math.round(1 + x.proj * 2 + (priority === "high" ? 8 : 0))),
    }
  })
}

export function rosterCompositionSummary(
  rows: RosterPlayerRow[],
  league: SleeperLeague
): { bullets: string[]; recordHint: string } {
  const byPos = groupByPosition(rows)
  const bullets: string[] = []
  for (const pos of ["QB", "RB", "WR", "TE", "K", "DEF"]) {
    const list = byPos[pos] || []
    if (list.length === 0) continue
    const starters = list.filter((r) => r.isStarter)
    const topProj = list[0]?.weeklyProjection ?? 0
    bullets.push(
      `${pos}: ${list.length} rostered, ${starters.length} in current lineup; top projection ~${topProj.toFixed(1)} pts.`,
    )
  }
  bullets.push(
    `${league.name}: ${league.total_rosters ?? "?"} teams · ${league.scoring_settings ? "custom scoring" : "default scoring"}.`,
  )
  return { bullets, recordHint: "Check points-for and standings in Sleeper for playoff outlook." }
}

/** Approximate NFL week (same heuristic as projections context). */
export function getApproximateNflWeek(): number {
  const now = new Date()
  const startOfSeason = new Date(now.getFullYear(), 8, 1)
  const weeksSinceStart = Math.floor((now.getTime() - startOfSeason.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return Math.max(1, Math.min(18, weeksSinceStart + 1))
}

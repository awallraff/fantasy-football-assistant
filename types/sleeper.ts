/**
 * Sleeper types for app code and tests.
 * Core shapes come from the API client; optional fields reflect real payloads / test fixtures.
 */

import type {
  SleeperPlayer as SleeperPlayerApi,
  SleeperTransaction as SleeperTransactionApi,
} from "@/lib/sleeper-api"

export type {
  SleeperUser,
  SleeperLeague,
  SleeperRoster,
  SleeperMatchup,
} from "@/lib/sleeper-api"

export type SleeperPlayer = SleeperPlayerApi & {
  active?: boolean
  status?: string
  number?: number
  depth_chart_order?: number
}

export type SleeperTransaction = SleeperTransactionApi & {
  leg?: number
  settings?: unknown | null
  consenter_ids?: number[]
}

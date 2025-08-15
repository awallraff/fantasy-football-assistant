export interface TradeRecommendation {
  id: string
  targetTeam: string
  targetOwner: string
  confidence: number
  projectedGain: number
  reasoning: string[]
  yourPlayers: Array<{
    name: string
    position: string
    currentValue: number
    projectedValue: number
  }>
  theirPlayers: Array<{
    name: string
    position: string
    currentValue: number
    projectedValue: number
  }>
  tradeType: "buy_low" | "sell_high" | "positional_need" | "value_play"
  urgency: "high" | "medium" | "low"
  successProbability: number
}

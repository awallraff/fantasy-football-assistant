"use client"

import dynamic from 'next/dynamic'

// Dynamic imports for components that may cause hydration issues
export const DynamicPlayerDetailModal = dynamic(
  () => import('./player-detail-modal').then(mod => ({ default: mod.PlayerDetailModal })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-96 w-full" />
  }
)

export const DynamicTradeEvaluator = dynamic(
  () => import('./trade-evaluator').then(mod => ({ default: mod.TradeEvaluator })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-96 w-full" />
  }
)

export const DynamicTradeRecommendations = dynamic(
  () => import('./trade-recommendations').then(mod => ({ default: mod.TradeRecommendations })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full" />
  }
)

export const DynamicRecentActivity = dynamic(
  () => import('./recent-activity').then(mod => ({ default: mod.RecentActivity })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full" />
  }
)

export const DynamicTradeHistory = dynamic(
  () => import('./trade-history').then(mod => ({ default: mod.TradeHistory })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-96 w-full" />
  }
)

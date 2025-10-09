import { useState, useEffect, useCallback } from 'react'
import { useSafeLocalStorage } from '@/hooks/use-local-storage'
import { debugLog, debugError } from '@/lib/debug-utils'

/**
 * Return type for the useAPIKeysSync hook
 */
export interface UseAPIKeysSyncReturn {
  // API keys state
  apiKeys: Record<string, string>
  setApiKeys: (keys: Record<string, string>) => void

  // Actions
  refreshApiKeys: () => void
  hasApiKeys: boolean
}

/**
 * Custom hook for synchronizing API keys from localStorage with cross-tab sync.
 *
 * This hook encapsulates:
 * - Loading API keys from localStorage on mount
 * - Cross-tab synchronization via storage events
 * - Refresh mechanism for manual reload
 * - SSR-safe implementation
 *
 * The hook listens for changes to API keys in other tabs/windows and
 * automatically syncs the state when changes are detected.
 *
 * @example
 * ```tsx
 * const { apiKeys, refreshApiKeys, hasApiKeys } = useAPIKeysSync()
 *
 * // Access API keys
 * const fantasyProsKey = apiKeys.fantasypros
 *
 * // Manually refresh from localStorage
 * refreshApiKeys()
 *
 * // Check if any keys exist
 * if (hasApiKeys) {
 *   // Load data from APIs
 * }
 * ```
 */
export function useAPIKeysSync(): UseAPIKeysSyncReturn {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const { getItem, isClient } = useSafeLocalStorage()

  /**
   * Load API keys from localStorage
   */
  const loadApiKeys = useCallback(() => {
    if (!isClient) return

    const savedKeys = getItem("fantasy_api_keys")
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys)
        setApiKeys(keys)
        debugLog('Loaded API keys from localStorage:', Object.keys(keys))
      } catch (e) {
        debugError("Failed to load API keys:", e)
        setApiKeys({})
      }
    }
  }, [isClient, getItem])

  /**
   * Initial load of API keys on mount
   */
  useEffect(() => {
    loadApiKeys()
  }, [loadApiKeys])

  /**
   * Listen for API key changes from other tabs/windows
   * This enables cross-tab synchronization
   */
  useEffect(() => {
    if (!isClient) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fantasy_api_keys' && e.newValue) {
        try {
          const keys = JSON.parse(e.newValue)
          setApiKeys(keys)
          debugLog('API keys updated from storage event:', Object.keys(keys))
        } catch (e) {
          debugError("Failed to parse updated API keys:", e)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [isClient])

  /**
   * Manually refresh API keys from localStorage
   * Useful when keys are updated within the same tab
   */
  const refreshApiKeys = useCallback(() => {
    loadApiKeys()
  }, [loadApiKeys])

  /**
   * Check if any API keys exist
   */
  const hasApiKeys = Object.keys(apiKeys).length > 0

  return {
    apiKeys,
    setApiKeys,
    refreshApiKeys,
    hasApiKeys,
  }
}

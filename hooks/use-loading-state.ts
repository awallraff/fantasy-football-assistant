import { useState, useCallback } from "react"

/**
 * Loading operation types for NFL Data operations
 */
export type LoadingOperation =
  | "idle"
  | "testing-connection"
  | "extracting-data"
  | "exporting-data"

/**
 * Loading state with operation-specific tracking
 */
export interface LoadingState {
  /** Current operation being performed */
  operation: LoadingOperation
  /** Whether any operation is in progress */
  isLoading: boolean
  /** Optional progress percentage (0-100) */
  progress?: number
  /** Optional operation message */
  message?: string
}

/**
 * Result interface for the useLoadingState hook
 */
export interface UseLoadingStateResult {
  /** Current loading state */
  state: LoadingState
  /** Check if a specific operation is running */
  isOperationLoading: (operation: LoadingOperation) => boolean
  /** Start a loading operation */
  startLoading: (operation: LoadingOperation, message?: string) => void
  /** Update progress for current operation */
  updateProgress: (progress: number, message?: string) => void
  /** Stop the current loading operation */
  stopLoading: () => void
  /** Reset to idle state */
  reset: () => void
}

/**
 * Custom hook for managing operation-specific loading states
 *
 * Provides granular control over loading states for different operations,
 * allowing UI to show specific feedback based on what's happening.
 *
 * @example
 * ```tsx
 * const loading = useLoadingState()
 *
 * async function testConnection() {
 *   loading.startLoading('testing-connection', 'Connecting to NFL data service...')
 *   try {
 *     await fetch('/api/nfl-data?action=test')
 *     loading.stopLoading()
 *   } catch (error) {
 *     loading.stopLoading()
 *   }
 * }
 *
 * // In JSX:
 * {loading.isOperationLoading('testing-connection') && (
 *   <span>Testing connection...</span>
 * )}
 * ```
 */
export function useLoadingState(): UseLoadingStateResult {
  const [state, setState] = useState<LoadingState>({
    operation: "idle",
    isLoading: false,
    progress: undefined,
    message: undefined,
  })

  const isOperationLoading = useCallback(
    (operation: LoadingOperation): boolean => {
      return state.isLoading && state.operation === operation
    },
    [state.isLoading, state.operation]
  )

  const startLoading = useCallback(
    (operation: LoadingOperation, message?: string) => {
      setState({
        operation,
        isLoading: true,
        progress: undefined,
        message,
      })
    },
    []
  )

  const updateProgress = useCallback((progress: number, message?: string) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(Math.max(progress, 0), 100), // Clamp to 0-100
      message: message || prev.message,
    }))
  }, [])

  const stopLoading = useCallback(() => {
    setState({
      operation: "idle",
      isLoading: false,
      progress: undefined,
      message: undefined,
    })
  }, [])

  const reset = useCallback(() => {
    setState({
      operation: "idle",
      isLoading: false,
      progress: undefined,
      message: undefined,
    })
  }, [])

  return {
    state,
    isOperationLoading,
    startLoading,
    updateProgress,
    stopLoading,
    reset,
  }
}

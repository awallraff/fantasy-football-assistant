import { useState, useCallback } from 'react'

interface UseLoadingStatesReturn {
  // State
  loading: boolean
  loadingYears: boolean
  retrying: boolean
  
  // Actions
  setLoading: (loading: boolean) => void
  setLoadingYears: (loading: boolean) => void
  setRetrying: (retrying: boolean) => void
  
  // Async wrappers
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>
  withLoadingYears: <T>(asyncFn: () => Promise<T>) => Promise<T>
  withRetrying: <T>(asyncFn: () => Promise<T>) => Promise<T>
}

export function useLoadingStates(): UseLoadingStatesReturn {
  const [loading, setLoading] = useState(false)
  const [loadingYears, setLoadingYears] = useState(false)
  const [retrying, setRetrying] = useState(false)

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    setLoading(true)
    try {
      return await asyncFn()
    } finally {
      setLoading(false)
    }
  }, [])

  const withLoadingYears = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    setLoadingYears(true)
    try {
      return await asyncFn()
    } finally {
      setLoadingYears(false)
    }
  }, [])

  const withRetrying = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    setRetrying(true)
    try {
      return await asyncFn()
    } finally {
      setRetrying(false)
    }
  }, [])

  return {
    // State
    loading,
    loadingYears,
    retrying,
    
    // Actions
    setLoading,
    setLoadingYears,
    setRetrying,
    
    // Async wrappers
    withLoading,
    withLoadingYears,
    withRetrying,
  }
}
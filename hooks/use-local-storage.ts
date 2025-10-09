import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      // Only access localStorage on the client
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key)
        if (item) {
          setStoredValue(JSON.parse(item))
        }
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
    } finally {
      setIsLoading(false)
    }
  }, [key])

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      // Only save to localStorage on the client
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      // Handle quota exceeded error specifically
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error(`localStorage quota exceeded for key "${key}". Consider clearing old data or reducing storage usage.`)
        // Optionally notify user or trigger cleanup
      } else {
        console.error(`Error setting localStorage key "${key}":`, error)
      }
    }
  }

  return [storedValue, setValue, isLoading]
}

export function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

export function useSafeLocalStorage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const getItem = useCallback((key: string): string | null => {
    if (!isClient) return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }, [isClient])

  const setItem = useCallback((key: string, value: string): boolean => {
    if (!isClient) return false
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      // Handle quota exceeded error specifically
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error(`localStorage quota exceeded for key "${key}". Consider clearing old data or reducing storage usage.`)
        // Optionally notify user or trigger cleanup
        return false
      } else {
        console.error('Failed to set localStorage item:', error)
        return false
      }
    }
  }, [isClient])

  const removeItem = useCallback((key: string): void => {
    if (!isClient) return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove localStorage item:', error)
    }
  }, [isClient])

  return { getItem, setItem, removeItem, isClient }
}

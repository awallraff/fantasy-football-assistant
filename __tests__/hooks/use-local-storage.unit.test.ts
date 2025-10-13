/**
 * @jest-environment jsdom
 */

/**
 * useLocalStorage Hook Unit Tests
 *
 * Tests for the useLocalStorage custom React hook, including:
 * - SSR safety (window undefined)
 * - Get operations (retrieve values from localStorage)
 * - Set operations (store values in localStorage)
 * - Remove operations (handled through setValue)
 * - Error handling (localStorage errors, quota exceeded)
 * - JSON parsing (correctly parse stored JSON values)
 * - Function updater pattern (setValue with function)
 * - Loading state management
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useLocalStorage, useIsClient, useSafeLocalStorage } from '@/hooks/use-local-storage'
import { mockLocalStorage } from '../utils/test-mocks'

// Suppress console errors/warnings/logs in tests
const originalConsoleError = console.error
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = jest.fn()
  console.log = jest.fn()
  console.warn = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
  console.log = originalConsoleLog
  console.warn = originalConsoleWarn
})

describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    // Set up localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    })
    mockLocalStorage.clear()
    jest.clearAllMocks()
  })

  describe('SSR Safety', () => {
    it('should return default value when window is undefined (SSR)', () => {
      const originalWindow = global.window
      // @ts-ignore - Simulating SSR environment
      delete (global as any).window

      const { result } = renderHook(() => useLocalStorage('test-key', 'default-value'))

      expect(result.current[0]).toBe('default-value')
      expect(result.current[2]).toBe(false) // isLoading should be false after mount

      // Restore window
      global.window = originalWindow
    })

    it('should not crash when setting value in SSR environment', () => {
      const originalWindow = global.window
      // @ts-ignore - Simulating SSR environment
      delete (global as any).window

      const { result } = renderHook(() => useLocalStorage('test-key', 'default'))

      act(() => {
        result.current[1]('new-value')
      })

      expect(result.current[0]).toBe('new-value')

      // Restore window
      global.window = originalWindow
    })

    it('should handle typeof window !== undefined check correctly', async () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'default'))

      await waitFor(() => {
        expect(result.current[2]).toBe(false) // isLoading should become false
      })

      expect(result.current[0]).toBe('default')
    })
  })

  describe('Get Operations', () => {
    it('should return default value when key does not exist', async () => {
      const { result } = renderHook(() => useLocalStorage('nonexistent-key', 'default-value'))

      await waitFor(() => {
        expect(result.current[2]).toBe(false) // Wait for loading to complete
      })

      expect(result.current[0]).toBe('default-value')
    })

    it('should retrieve existing value from localStorage', async () => {
      mockLocalStorage.setItem('existing-key', JSON.stringify('stored-value'))

      const { result } = renderHook(() => useLocalStorage('existing-key', 'default'))

      await waitFor(() => {
        expect(result.current[2]).toBe(false) // Wait for loading to complete
      })

      expect(result.current[0]).toBe('stored-value')
    })

    it('should correctly parse JSON objects from localStorage', async () => {
      const testObject = { name: 'John Doe', age: 30, active: true }
      mockLocalStorage.setItem('object-key', JSON.stringify(testObject))

      const { result } = renderHook(() => useLocalStorage('object-key', {}))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[0]).toEqual(testObject)
    })

    it('should correctly parse JSON arrays from localStorage', async () => {
      const testArray = ['item1', 'item2', 'item3']
      mockLocalStorage.setItem('array-key', JSON.stringify(testArray))

      const { result } = renderHook(() => useLocalStorage<string[]>('array-key', []))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[0]).toEqual(testArray)
    })

    it('should handle JSON.parse errors gracefully', async () => {
      // Store invalid JSON
      mockLocalStorage.setItem('invalid-json-key', '{invalid json}')

      const { result } = renderHook(() => useLocalStorage('invalid-json-key', 'default'))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      // Should fall back to default value on parse error
      expect(result.current[0]).toBe('default')
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error reading localStorage key "invalid-json-key"'),
        expect.any(Error)
      )
    })
  })

  describe('Set Operations', () => {
    it('should store value in localStorage', async () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      act(() => {
        result.current[1]('new-value')
      })

      expect(result.current[0]).toBe('new-value')
      expect(mockLocalStorage.getItem('test-key')).toBe(JSON.stringify('new-value'))
    })

    it('should store complex objects in localStorage', async () => {
      const testObject = { user: 'testuser', leagues: ['league1', 'league2'] }
      const { result } = renderHook(() => useLocalStorage('complex-key', {}))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      act(() => {
        result.current[1](testObject)
      })

      expect(result.current[0]).toEqual(testObject)
      expect(mockLocalStorage.getItem('complex-key')).toBe(JSON.stringify(testObject))
    })

    it('should support function updater pattern', async () => {
      const { result } = renderHook(() => useLocalStorage('counter', 0))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      act(() => {
        result.current[1]((prev) => prev + 1)
      })

      expect(result.current[0]).toBe(1)

      act(() => {
        result.current[1]((prev) => prev + 5)
      })

      expect(result.current[0]).toBe(6)
      expect(mockLocalStorage.getItem('counter')).toBe(JSON.stringify(6))
    })

    it('should handle quota exceeded error gracefully', async () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      // Mock localStorage.setItem to throw quota exceeded error
      const originalSetItem = mockLocalStorage.setItem
      mockLocalStorage.setItem = jest.fn(() => {
        // Create a proper DOMException
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        // Add DOMException properties
        Object.setPrototypeOf(error, DOMException.prototype)
        throw error
      })

      act(() => {
        result.current[1]('new-value')
      })

      // State should still update even if localStorage fails
      expect(result.current[0]).toBe('new-value')
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('localStorage quota exceeded for key "test-key"')
      )

      // Restore original setItem
      mockLocalStorage.setItem = originalSetItem
    })

    it('should handle generic localStorage errors', async () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      // Mock localStorage.setItem to throw generic error
      const originalSetItem = mockLocalStorage.setItem
      mockLocalStorage.setItem = jest.fn(() => {
        throw new Error('Generic localStorage error')
      })

      act(() => {
        result.current[1]('new-value')
      })

      expect(result.current[0]).toBe('new-value')
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error setting localStorage key "test-key"'),
        expect.any(Error)
      )

      // Restore original setItem
      mockLocalStorage.setItem = originalSetItem
    })
  })

  describe('Loading State', () => {
    it('should set isLoading to false after mount', async () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'default'))

      // After mount, loading should be false (useEffect runs synchronously in tests)
      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })
    })

    it('should set isLoading to false even when localStorage read fails', async () => {
      // Mock getItem to throw error
      const originalGetItem = mockLocalStorage.getItem
      mockLocalStorage.getItem = jest.fn(() => {
        throw new Error('localStorage access denied')
      })

      const { result } = renderHook(() => useLocalStorage('test-key', 'default'))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[0]).toBe('default')

      // Restore original getItem
      mockLocalStorage.getItem = originalGetItem
    })
  })

  describe('Key Changes', () => {
    it('should reload value when key changes', async () => {
      mockLocalStorage.setItem('key1', JSON.stringify('value1'))
      mockLocalStorage.setItem('key2', JSON.stringify('value2'))

      const { result, rerender } = renderHook(
        ({ key }) => useLocalStorage(key, 'default'),
        { initialProps: { key: 'key1' } }
      )

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[0]).toBe('value1')

      // Change the key
      rerender({ key: 'key2' })

      await waitFor(() => {
        expect(result.current[0]).toBe('value2')
      })
    })
  })
})

describe('useIsClient Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should set isClient to true after mount', async () => {
    const { result } = renderHook(() => useIsClient())

    // In test environment, useEffect runs synchronously, so isClient is immediately true
    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('should work in SSR environment', async () => {
    // Note: In jsdom test environment, window always exists, so we can't truly test SSR
    // This test verifies the hook works without errors in a normal environment
    const { result } = renderHook(() => useIsClient())

    // Even in test environment, the hook should work correctly
    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })
})

describe('useSafeLocalStorage Hook', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    })
    mockLocalStorage.clear()
    jest.clearAllMocks()
  })

  describe('getItem', () => {
    it('should retrieve items after client is ready', async () => {
      mockLocalStorage.setItem('test-key', 'test-value')

      const { result } = renderHook(() => useSafeLocalStorage())

      // In test environment, isClient becomes true immediately after mount
      await waitFor(() => {
        expect(result.current.isClient).toBe(true)
      })

      const value = result.current.getItem('test-key')
      expect(value).toBe('test-value')
    })

    it('should handle localStorage errors gracefully', async () => {
      const { result } = renderHook(() => useSafeLocalStorage())

      await waitFor(() => {
        expect(result.current.isClient).toBe(true)
      })

      // Mock getItem to throw error
      const originalGetItem = mockLocalStorage.getItem
      mockLocalStorage.getItem = jest.fn(() => {
        throw new Error('Access denied')
      })

      const value = result.current.getItem('test-key')
      expect(value).toBeNull()

      // Restore original getItem
      mockLocalStorage.getItem = originalGetItem
    })
  })

  describe('setItem', () => {
    it('should set items after client is ready', async () => {
      const { result } = renderHook(() => useSafeLocalStorage())

      await waitFor(() => {
        expect(result.current.isClient).toBe(true)
      })

      const success = result.current.setItem('test-key', 'test-value')
      expect(success).toBe(true)
      expect(mockLocalStorage.getItem('test-key')).toBe('test-value')
    })

    it('should handle quota exceeded error', async () => {
      const { result } = renderHook(() => useSafeLocalStorage())

      await waitFor(() => {
        expect(result.current.isClient).toBe(true)
      })

      // Mock setItem to throw quota exceeded error
      const originalSetItem = mockLocalStorage.setItem
      mockLocalStorage.setItem = jest.fn(() => {
        // Create a proper DOMException-like error
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        Object.setPrototypeOf(error, DOMException.prototype)
        throw error
      })

      const success = result.current.setItem('test-key', 'test-value')
      expect(success).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('localStorage quota exceeded for key "test-key"')
      )

      // Restore original setItem
      mockLocalStorage.setItem = originalSetItem
    })

    it('should handle generic errors', async () => {
      const { result } = renderHook(() => useSafeLocalStorage())

      await waitFor(() => {
        expect(result.current.isClient).toBe(true)
      })

      // Mock setItem to throw generic error
      const originalSetItem = mockLocalStorage.setItem
      mockLocalStorage.setItem = jest.fn(() => {
        throw new Error('Generic error')
      })

      const success = result.current.setItem('test-key', 'test-value')
      expect(success).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to set localStorage item'),
        expect.any(Error)
      )

      // Restore original setItem
      mockLocalStorage.setItem = originalSetItem
    })
  })

  describe('removeItem', () => {
    it('should remove items after client is ready', async () => {
      mockLocalStorage.setItem('test-key', 'test-value')

      const { result } = renderHook(() => useSafeLocalStorage())

      await waitFor(() => {
        expect(result.current.isClient).toBe(true)
      })

      result.current.removeItem('test-key')
      expect(mockLocalStorage.getItem('test-key')).toBeNull()
    })

    it('should handle removeItem errors gracefully', async () => {
      const { result } = renderHook(() => useSafeLocalStorage())

      await waitFor(() => {
        expect(result.current.isClient).toBe(true)
      })

      // Mock removeItem to throw error
      const originalRemoveItem = mockLocalStorage.removeItem
      mockLocalStorage.removeItem = jest.fn(() => {
        throw new Error('Remove failed')
      })

      // Should not throw
      result.current.removeItem('test-key')
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to remove localStorage item'),
        expect.any(Error)
      )

      // Restore original removeItem
      mockLocalStorage.removeItem = originalRemoveItem
    })
  })

  describe('isClient state', () => {
    it('should become true after mount', async () => {
      const { result } = renderHook(() => useSafeLocalStorage())

      // In test environment, isClient becomes true after mount
      await waitFor(() => {
        expect(result.current.isClient).toBe(true)
      })
    })
  })
})

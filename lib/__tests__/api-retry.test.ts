import {
  retryWithBackoff,
  fetchWithRetry,
  defaultShouldRetry,
  RetryOptions,
} from '@/lib/api-retry'

describe('API Retry Logic', () => {
  // Mock timers before each test
  beforeEach(() => {
    jest.useFakeTimers()
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('Exponential Backoff Calculation', () => {
    it('should follow exponential pattern with default multiplier (2)', async () => {
      const delays: number[] = []
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockResolvedValueOnce('success')

      const onRetry = jest.fn((error, attemptNumber, delayMs) => {
        delays.push(delayMs)
      })

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 1000,
        useJitter: false, // Disable jitter for predictable delays
        onRetry,
      })

      // Advance through each retry
      await jest.advanceTimersByTimeAsync(1000) // First retry: 1s
      await jest.advanceTimersByTimeAsync(2000) // Second retry: 2s
      await jest.advanceTimersByTimeAsync(4000) // Third retry: 4s

      await promise

      expect(delays).toEqual([1000, 2000, 4000])
      expect(mockFn).toHaveBeenCalledTimes(4)
    })

    it('should enforce max delay ceiling', async () => {
      const delays: number[] = []
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockResolvedValueOnce('success')

      const onRetry = jest.fn((error, attemptNumber, delayMs) => {
        delays.push(delayMs)
      })

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 3000, // Cap at 3 seconds
        useJitter: false,
        onRetry,
      })

      await jest.advanceTimersByTimeAsync(1000) // First retry: 1s
      await jest.advanceTimersByTimeAsync(2000) // Second retry: 2s
      await jest.advanceTimersByTimeAsync(3000) // Third retry: 3s (capped, would be 4s)

      await promise

      expect(delays).toEqual([1000, 2000, 3000])
      expect(delays[2]).toBe(3000) // Verify ceiling was applied
    })

    it('should support different backoff multipliers', async () => {
      const delays: number[] = []
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockResolvedValueOnce('success')

      const onRetry = jest.fn((error, attemptNumber, delayMs) => {
        delays.push(delayMs)
      })

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 100,
        backoffMultiplier: 3, // Multiply by 3 each time
        useJitter: false,
        onRetry,
      })

      await jest.advanceTimersByTimeAsync(100)  // First retry: 100ms
      await jest.advanceTimersByTimeAsync(300)  // Second retry: 300ms
      await jest.advanceTimersByTimeAsync(900)  // Third retry: 900ms

      await promise

      expect(delays).toEqual([100, 300, 900])
    })

    it('should use custom initial delay', async () => {
      const delays: number[] = []
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockResolvedValueOnce('success')

      const onRetry = jest.fn((error, attemptNumber, delayMs) => {
        delays.push(delayMs)
      })

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 1,
        initialDelayMs: 500,
        useJitter: false,
        onRetry,
      })

      await jest.advanceTimersByTimeAsync(500)

      await promise

      expect(delays).toEqual([500])
    })
  })

  describe('Jitter Implementation', () => {
    it('should add jitter when enabled (default)', async () => {
      const delays: number[] = []
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockResolvedValueOnce('success')

      const onRetry = jest.fn((error, attemptNumber, delayMs) => {
        delays.push(delayMs)
      })

      // Mock Math.random to return predictable values
      const originalRandom = Math.random
      let callCount = 0
      Math.random = jest.fn(() => {
        const values = [0.5, 0.75, 0.25] // Different jitter for each retry
        return values[callCount++] || 0.5
      })

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 1000,
        useJitter: true, // Jitter enabled
        onRetry,
      })

      // With Full Jitter (AWS algorithm): delay = random() * exponentialDelay
      // First retry: 0.5 * 1000 = 500ms
      // Second retry: 0.75 * 2000 = 1500ms
      // Third retry: 0.25 * 4000 = 1000ms
      await jest.advanceTimersByTimeAsync(500)
      await jest.advanceTimersByTimeAsync(1500)
      await jest.advanceTimersByTimeAsync(1000)

      await promise

      expect(delays).toEqual([500, 1500, 1000])

      // Restore Math.random
      Math.random = originalRandom
    })

    it('should not add jitter when disabled', async () => {
      const delays: number[] = []
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockResolvedValueOnce('success')

      const onRetry = jest.fn((error, attemptNumber, delayMs) => {
        delays.push(delayMs)
      })

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 2,
        initialDelayMs: 1000,
        useJitter: false,
        onRetry,
      })

      await jest.advanceTimersByTimeAsync(1000)
      await jest.advanceTimersByTimeAsync(2000)

      await promise

      // Without jitter, delays should be exact exponential values
      expect(delays).toEqual([1000, 2000])
    })

    it('should keep delays within expected range with jitter', async () => {
      const delays: number[] = []
      const mockFn = jest.fn()
        .mockRejectedValue(new Error('HTTP 500'))

      const onRetry = jest.fn((error, attemptNumber, delayMs) => {
        delays.push(delayMs)
      })

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 1000,
        useJitter: true,
        onRetry,
      }).catch(() => {}) // Suppress final error

      // Run all timers
      await jest.runAllTimersAsync()

      // With Full Jitter, delays should be between 0 and exponentialDelay
      // First retry: 0 <= delay <= 1000
      expect(delays[0]).toBeGreaterThanOrEqual(0)
      expect(delays[0]).toBeLessThanOrEqual(1000)

      // Second retry: 0 <= delay <= 2000
      expect(delays[1]).toBeGreaterThanOrEqual(0)
      expect(delays[1]).toBeLessThanOrEqual(2000)

      // Third retry: 0 <= delay <= 4000
      expect(delays[2]).toBeGreaterThanOrEqual(0)
      expect(delays[2]).toBeLessThanOrEqual(4000)
    })
  })

  describe('Retry Conditions', () => {
    describe('defaultShouldRetry', () => {
      it('should retry on HTTP 5xx errors', () => {
        const error500 = new Error('HTTP 500: Internal Server Error')
        const error502 = new Error('HTTP 502: Bad Gateway')
        const error503 = new Error('HTTP 503: Service Unavailable')

        expect(defaultShouldRetry(error500, 1)).toBe(true)
        expect(defaultShouldRetry(error502, 1)).toBe(true)
        expect(defaultShouldRetry(error503, 1)).toBe(true)
      })

      it('should retry on HTTP 429 (rate limiting)', () => {
        const error429 = new Error('HTTP 429: Too Many Requests')
        const errorRateLimit = new Error('Rate limit exceeded')

        expect(defaultShouldRetry(error429, 1)).toBe(true)
        expect(defaultShouldRetry(errorRateLimit, 1)).toBe(true)
      })

      it('should NOT retry on HTTP 4xx errors (except 429)', () => {
        const error400 = new Error('HTTP 400: Bad Request')
        const error401 = new Error('HTTP 401: Unauthorized')
        const error403 = new Error('HTTP 403: Forbidden')
        const error404 = new Error('HTTP 404: Not Found')

        expect(defaultShouldRetry(error400, 1)).toBe(false)
        expect(defaultShouldRetry(error401, 1)).toBe(false)
        expect(defaultShouldRetry(error403, 1)).toBe(false)
        expect(defaultShouldRetry(error404, 1)).toBe(false)
      })

      it('should retry on network errors', () => {
        const networkError = new Error('Network request failed')
        const timeoutError = new Error('Request timeout')
        const fetchError = new Error('Failed to fetch')

        expect(defaultShouldRetry(networkError, 1)).toBe(true)
        expect(defaultShouldRetry(timeoutError, 1)).toBe(true)
        expect(defaultShouldRetry(fetchError, 1)).toBe(true)
      })

      it('should retry on unknown errors', () => {
        const unknownError = new Error('Something went wrong')
        const genericError = new Error('Unexpected error')

        expect(defaultShouldRetry(unknownError, 1)).toBe(true)
        expect(defaultShouldRetry(genericError, 1)).toBe(true)
      })

      it('should handle non-Error objects', () => {
        const stringError = 'Error string'
        const objectError = { message: 'Error object' }

        expect(defaultShouldRetry(stringError, 1)).toBe(true)
        expect(defaultShouldRetry(objectError, 1)).toBe(true)
      })

      it('should respect attempt number limit', () => {
        const error500 = new Error('HTTP 500: Internal Server Error')

        expect(defaultShouldRetry(error500, 1)).toBe(true)
        expect(defaultShouldRetry(error500, 3)).toBe(true)
        expect(defaultShouldRetry(error500, 4)).toBe(false) // Over limit
        expect(defaultShouldRetry(error500, 5)).toBe(false)
      })
    })

    it('should use custom shouldRetry function', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('HTTP 404'))
        .mockResolvedValueOnce('success')

      // Custom retry: retry even on 404
      const customShouldRetry = jest.fn(() => true)

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 1,
        initialDelayMs: 100,
        useJitter: false,
        shouldRetry: customShouldRetry,
      })

      await jest.advanceTimersByTimeAsync(100)

      const result = await promise

      expect(result).toBe('success')
      expect(customShouldRetry).toHaveBeenCalledWith(expect.any(Error), 1)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should stop retrying when shouldRetry returns false', async () => {
      const mockFn = jest.fn()
        .mockRejectedValue(new Error('HTTP 404'))

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 100,
        useJitter: false,
        shouldRetry: () => false, // Never retry
      })

      await expect(promise).rejects.toThrow('HTTP 404')
      expect(mockFn).toHaveBeenCalledTimes(1) // Only initial attempt
    })
  })

  describe('Retry Exhaustion', () => {
    it('should throw error after maxRetries is exhausted', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Persistent error'))
        .mockRejectedValueOnce(new Error('Persistent error'))
        .mockRejectedValueOnce(new Error('Persistent error'))
        .mockRejectedValueOnce(new Error('Persistent error'))

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 100,
        useJitter: false,
      })

      // Run all timers asynchronously to complete all retries
      jest.runAllTimersAsync()

      await expect(promise).rejects.toThrow('Persistent error')
      expect(mockFn).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
    })

    it('should not retry when maxRetries is 0', async () => {
      const mockFn = jest.fn().mockRejectedValueOnce(new Error('Immediate failure'))

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 0,
        initialDelayMs: 100,
      })

      await expect(promise).rejects.toThrow('Immediate failure')
      expect(mockFn).toHaveBeenCalledTimes(1) // Only initial attempt
    })

    it('should retry exactly once when maxRetries is 1', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockRejectedValueOnce(new Error('Still failing'))

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 1,
        initialDelayMs: 100,
        useJitter: false,
      })

      jest.advanceTimersByTimeAsync(100)

      await expect(promise).rejects.toThrow('Still failing')
      expect(mockFn).toHaveBeenCalledTimes(2) // 1 initial + 1 retry
    })

    it('should handle negative maxRetries gracefully', async () => {
      const mockFn = jest.fn().mockRejectedValueOnce(new Error('Error'))

      const promise = retryWithBackoff(mockFn, {
        maxRetries: -1,
        initialDelayMs: 100,
      })

      // With negative maxRetries, the loop condition (attemptNumber <= maxRetries + 1)
      // becomes (1 <= 0) which is false, so the loop never runs and throws undefined
      await expect(promise).rejects.toBeUndefined()
      expect(mockFn).toHaveBeenCalledTimes(0) // Function never called
    })
  })

  describe('Success Cases', () => {
    it('should succeed on first try without retries', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')

      const result = await retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 1000,
      })

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should succeed on second try (1 retry)', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockResolvedValueOnce('success')

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 100,
        useJitter: false,
      })

      await jest.advanceTimersByTimeAsync(100)

      const result = await promise

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should succeed on final retry', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockResolvedValueOnce('success on last try')

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 100,
        useJitter: false,
      })

      await jest.advanceTimersByTimeAsync(100)
      await jest.advanceTimersByTimeAsync(200)
      await jest.advanceTimersByTimeAsync(400)

      const result = await promise

      expect(result).toBe('success on last try')
      expect(mockFn).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
    })

    it('should return different data types correctly', async () => {
      const objectResult = { data: 'test' }
      const arrayResult = [1, 2, 3]
      const numberResult = 42
      const booleanResult = true

      const objectFn = jest.fn().mockResolvedValue(objectResult)
      const arrayFn = jest.fn().mockResolvedValue(arrayResult)
      const numberFn = jest.fn().mockResolvedValue(numberResult)
      const booleanFn = jest.fn().mockResolvedValue(booleanResult)

      expect(await retryWithBackoff(objectFn)).toEqual(objectResult)
      expect(await retryWithBackoff(arrayFn)).toEqual(arrayResult)
      expect(await retryWithBackoff(numberFn)).toBe(numberResult)
      expect(await retryWithBackoff(booleanFn)).toBe(booleanResult)
    })
  })

  describe('Callbacks', () => {
    it('should call onRetry callback with correct arguments', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockRejectedValueOnce(new Error('Second error'))
        .mockResolvedValueOnce('success')

      const onRetry = jest.fn()

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 1000,
        useJitter: false,
        onRetry,
      })

      await jest.advanceTimersByTimeAsync(1000)
      await jest.advanceTimersByTimeAsync(2000)

      await promise

      expect(onRetry).toHaveBeenCalledTimes(2)

      // First retry
      expect(onRetry).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ message: 'First error' }),
        1,
        1000
      )

      // Second retry
      expect(onRetry).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ message: 'Second error' }),
        2,
        2000
      )
    })

    it('should not call onRetry when function succeeds immediately', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')
      const onRetry = jest.fn()

      await retryWithBackoff(mockFn, {
        maxRetries: 3,
        onRetry,
      })

      expect(onRetry).not.toHaveBeenCalled()
    })

    it('should call onRetry for each retry attempt', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Persistent error'))
        .mockRejectedValueOnce(new Error('Persistent error'))
        .mockRejectedValueOnce(new Error('Persistent error'))
        .mockRejectedValueOnce(new Error('Persistent error'))
      const onRetry = jest.fn()

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 100,
        useJitter: false,
        onRetry,
      })

      jest.runAllTimersAsync()
      await promise.catch(() => {}) // Suppress error

      expect(onRetry).toHaveBeenCalledTimes(3)
      expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, expect.any(Number))
      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, expect.any(Number))
      expect(onRetry).toHaveBeenNthCalledWith(3, expect.any(Error), 3, expect.any(Number))
    })

    it('should propagate onRetry callback errors', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockResolvedValueOnce('success')

      const onRetry = jest.fn(() => {
        throw new Error('Callback error')
      })

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 1,
        initialDelayMs: 100,
        useJitter: false,
        onRetry,
      })

      // Callback error will be thrown during retry
      jest.advanceTimersByTimeAsync(100)

      // The callback error will be propagated
      await expect(promise).rejects.toThrow('Callback error')
    })
  })

  describe('Edge Cases', () => {
    it('should handle function that throws synchronously', async () => {
      let callCount = 0
      const mockFn = jest.fn(() => {
        callCount++
        if (callCount < 3) {
          throw new Error('Sync error')
        }
        return Promise.resolve('success after sync errors')
      })

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 2,
        initialDelayMs: 100,
        useJitter: false,
      })

      await jest.advanceTimersByTimeAsync(100)
      await jest.advanceTimersByTimeAsync(200)

      await expect(promise).resolves.toBe('success after sync errors')
      expect(mockFn).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    })

    it('should handle mixed sync and async errors', async () => {
      const mockFn = jest.fn()
        .mockImplementationOnce(() => { throw new Error('Sync error') })
        .mockRejectedValueOnce(new Error('Async error'))
        .mockResolvedValueOnce('success')

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 100,
        useJitter: false,
      })

      await jest.advanceTimersByTimeAsync(100)
      await jest.advanceTimersByTimeAsync(200)

      await expect(promise).resolves.toBe('success')
    })

    it('should preserve error stack trace', async () => {
      const originalError = new Error('Original error with stack')
      const mockFn = jest.fn()
        .mockRejectedValueOnce(originalError)
        .mockRejectedValueOnce(originalError)

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 1,
        initialDelayMs: 100,
        useJitter: false,
      })

      jest.runAllTimersAsync()

      try {
        await promise
        fail('Should have thrown error')
      } catch (error) {
        expect(error).toBe(originalError)
        expect((error as Error).stack).toBeDefined()
      }
    })

    it('should handle undefined and null returns', async () => {
      const undefinedFn = jest.fn().mockResolvedValue(undefined)
      const nullFn = jest.fn().mockResolvedValue(null)

      expect(await retryWithBackoff(undefinedFn)).toBeUndefined()
      expect(await retryWithBackoff(nullFn)).toBeNull()
    })
  })

  describe('fetchWithRetry', () => {
    // Mock global fetch
    const mockFetch = jest.fn()

    beforeEach(() => {
      global.fetch = mockFetch
    })

    afterEach(() => {
      mockFetch.mockReset()
    })

    it('should retry on HTTP 5xx errors', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK', json: async () => ({ data: 'success' }) } as Response)

      const promise = fetchWithRetry('https://api.example.com/data', {}, {
        maxRetries: 1,
        initialDelayMs: 100,
        useJitter: false,
      })

      await jest.advanceTimersByTimeAsync(100)

      const response = await promise

      expect(response.ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should NOT retry on HTTP 4xx errors (except 429)', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' } as Response)

      const promise = fetchWithRetry('https://api.example.com/data', {}, {
        maxRetries: 3,
        initialDelayMs: 100,
      })

      await expect(promise).rejects.toThrow('HTTP 404: Not Found')
      expect(mockFetch).toHaveBeenCalledTimes(1) // Should not retry
    })

    it('should retry on HTTP 429 (rate limiting)', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 429, statusText: 'Too Many Requests' } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK' } as Response)

      const promise = fetchWithRetry('https://api.example.com/data', {}, {
        maxRetries: 1,
        initialDelayMs: 100,
        useJitter: false,
      })

      await jest.advanceTimersByTimeAsync(100)

      const response = await promise

      expect(response.ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should pass fetch options correctly', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 } as Response)

      const options: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      }

      await fetchWithRetry('https://api.example.com/data', options)

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', options)
    })

    it('should use custom shouldRetry function', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK' } as Response)

      const customShouldRetry = jest.fn(() => true) // Retry even on 404

      const promise = fetchWithRetry('https://api.example.com/data', {}, {
        maxRetries: 1,
        initialDelayMs: 100,
        useJitter: false,
        shouldRetry: customShouldRetry,
      })

      await jest.advanceTimersByTimeAsync(100)

      await promise

      expect(customShouldRetry).toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should handle network errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce({ ok: true, status: 200 } as Response)

      const promise = fetchWithRetry('https://api.example.com/data', {}, {
        maxRetries: 1,
        initialDelayMs: 100,
        useJitter: false,
      })

      await jest.advanceTimersByTimeAsync(100)

      const response = await promise

      expect(response.ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should retry on non-Error objects thrown', async () => {
      mockFetch
        .mockRejectedValueOnce('String error')
        .mockResolvedValueOnce({ ok: true, status: 200 } as Response)

      const promise = fetchWithRetry('https://api.example.com/data', {}, {
        maxRetries: 1,
        initialDelayMs: 100,
        useJitter: false,
      })

      await jest.advanceTimersByTimeAsync(100)

      const response = await promise

      expect(response.ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Console Logging', () => {
    it('should log retry attempts', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log')
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce('success')

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 1,
        initialDelayMs: 100,
        useJitter: false,
      })

      await jest.advanceTimersByTimeAsync(100)
      await promise

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 1/1'),
        'First error'
      )
    })

    it('should log total delay', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log')
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce('success')

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 2,
        initialDelayMs: 100,
        useJitter: false,
      })

      await jest.advanceTimersByTimeAsync(100)
      await jest.advanceTimersByTimeAsync(200)
      await promise

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Total delay: 100ms'),
        'Error'
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Total delay: 300ms'), // 100 + 200
        'Error'
      )
    })
  })

  describe('Type Safety', () => {
    it('should maintain return type through retries', async () => {
      interface User {
        id: number
        name: string
      }

      const mockFn = jest.fn().mockResolvedValue({ id: 1, name: 'Test User' })

      const result: User = await retryWithBackoff(mockFn, {
        maxRetries: 1,
      })

      expect(result.id).toBe(1)
      expect(result.name).toBe('Test User')
    })

    it('should work with async arrow functions', async () => {
      const result = await retryWithBackoff(
        async () => 'arrow function result',
        { maxRetries: 1 }
      )

      expect(result).toBe('arrow function result')
    })

    it('should work with promise-returning functions', async () => {
      const result = await retryWithBackoff(
        () => Promise.resolve('promise result'),
        { maxRetries: 1 }
      )

      expect(result).toBe('promise result')
    })
  })
})

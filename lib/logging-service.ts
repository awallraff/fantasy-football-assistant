/**
 * Structured Logging Service
 *
 * Provides production-safe logging with structured context, performance tracking,
 * and integration points for monitoring services.
 */

/** Log levels in order of severity */
export type LogLevel = "debug" | "info" | "warn" | "error"

/** Structured log entry */
export interface LogEntry {
  /** Log level */
  level: LogLevel
  /** Log message */
  message: string
  /** Timestamp (ISO 8601) */
  timestamp: string
  /** Optional context data */
  context?: Record<string, unknown>
  /** Optional error object */
  error?: Error
  /** Optional request/operation ID for correlation */
  requestId?: string
  /** Optional performance duration in ms */
  duration?: number
}

/** Logger configuration */
export interface LoggerConfig {
  /** Minimum log level to output (default: 'info' in production, 'debug' in development) */
  minLevel?: LogLevel
  /** Whether to enable console output (default: true) */
  enableConsole?: boolean
  /** Custom log handler for sending to monitoring service */
  customHandler?: (entry: LogEntry) => void
}

/** Performance timing tracker */
export interface PerformanceTimer {
  /** Request/operation ID */
  requestId: string
  /** Start time in milliseconds */
  startTime: number
  /** End the timer and log duration */
  end: (message: string, context?: Record<string, unknown>) => void
}

// Log level numeric values for comparison
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

class Logger {
  private config: Required<LoggerConfig>

  constructor(config: LoggerConfig = {}) {
    this.config = {
      minLevel: config.minLevel ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      enableConsole: config.enableConsole ?? true,
      customHandler: config.customHandler ?? (() => {}),
    }
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel]
  }

  /**
   * Format and output a log entry
   */
  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    // Call custom handler for monitoring integration
    this.config.customHandler(entry)

    // Console output
    if (this.config.enableConsole) {
      const prefix = `[${entry.timestamp}]${entry.requestId ? ` [${entry.requestId}]` : ''}`
      const suffix = entry.duration ? ` (${entry.duration}ms)` : ''

      switch (entry.level) {
        case 'debug':
          console.debug(prefix, entry.message + suffix, entry.context || '')
          break
        case 'info':
          console.log(prefix, entry.message + suffix, entry.context || '')
          break
        case 'warn':
          console.warn(prefix, entry.message + suffix, entry.context || '')
          break
        case 'error':
          console.error(prefix, entry.message + suffix, entry.context || '', entry.error || '')
          break
      }
    }
  }

  /**
   * Log debug message (development only by default)
   */
  debug(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.log({
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      context,
      requestId,
    })
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.log({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      context,
      requestId,
    })
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.log({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      context,
      requestId,
    })
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>, requestId?: string): void {
    this.log({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      error,
      context,
      requestId,
    })
  }

  /**
   * Start a performance timer
   *
   * @param requestId - Unique identifier for the operation
   * @returns Performance timer object
   *
   * @example
   * ```ts
   * const timer = logger.startTimer('nfl-data-fetch-123')
   * // ... do work ...
   * timer.end('NFL data fetch completed', { records: 100 })
   * ```
   */
  startTimer(requestId: string): PerformanceTimer {
    const startTime = Date.now()

    return {
      requestId,
      startTime,
      end: (message: string, context?: Record<string, unknown>) => {
        const duration = Date.now() - startTime
        this.info(message, { ...context, duration_ms: duration }, requestId)
      },
    }
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    }
  }
}

// Singleton logger instance
const logger = new Logger()

/**
 * Export the logger instance
 *
 * @example
 * ```ts
 * import { logger } from '@/lib/logging-service'
 *
 * // Simple logging
 * logger.info('User logged in', { userId: 123 })
 * logger.error('Failed to fetch data', error, { endpoint: '/api/data' })
 *
 * // With request ID for correlation
 * const requestId = 'req-123'
 * logger.info('Request started', { method: 'GET' }, requestId)
 * logger.info('Request completed', { status: 200 }, requestId)
 *
 * // Performance tracking
 * const timer = logger.startTimer('data-fetch-456')
 * await fetchData()
 * timer.end('Data fetch completed', { records: 100 })
 * ```
 */
export { logger }

/**
 * Export Logger class for custom instances
 */
export { Logger }

/**
 * Generate a unique request ID
 */
export function generateRequestId(prefix: string = 'req'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

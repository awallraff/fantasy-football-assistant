"use client"

import * as React from "react"
import { AlertCircle, RefreshCw, WifiOff, Clock, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ErrorType =
  | "network"
  | "timeout"
  | "not-found"
  | "server"
  | "validation"
  | "python"
  | "unknown"

export interface ErrorDisplayProps {
  /**
   * The type of error that occurred
   */
  type?: ErrorType

  /**
   * Error title/heading
   */
  title?: string

  /**
   * Detailed error message
   */
  message?: string

  /**
   * Optional technical details (for debugging)
   */
  technicalDetails?: string

  /**
   * Show retry button
   */
  showRetry?: boolean

  /**
   * Callback for retry action
   */
  onRetry?: () => void

  /**
   * Show loading state on retry button
   */
  isRetrying?: boolean

  /**
   * Additional actions to display
   */
  actions?: React.ReactNode

  /**
   * Custom className
   */
  className?: string
}

interface ErrorConfig {
  icon: React.ComponentType<{ className?: string }>
  variant: "default" | "destructive"
  defaultTitle: string
  defaultMessage: string
  suggestedActions?: string[]
}

const errorConfigs: Record<ErrorType, ErrorConfig> = {
  network: {
    icon: WifiOff,
    variant: "destructive",
    defaultTitle: "Network Connection Error",
    defaultMessage: "Unable to connect to the server. Please check your internet connection and try again.",
    suggestedActions: [
      "Check your internet connection",
      "Try refreshing the page",
      "Wait a moment and retry"
    ]
  },
  timeout: {
    icon: Clock,
    variant: "destructive",
    defaultTitle: "Request Timeout",
    defaultMessage: "The request took too long to complete. The server might be busy or your connection might be slow.",
    suggestedActions: [
      "Try again in a few moments",
      "Check your internet speed",
      "Contact support if this persists"
    ]
  },
  "not-found": {
    icon: AlertCircle,
    variant: "default",
    defaultTitle: "Data Not Found",
    defaultMessage: "The requested data could not be found. It may not be available yet or the season might not have started.",
    suggestedActions: [
      "Try a different season year",
      "Check if the data is available",
      "Verify your search criteria"
    ]
  },
  server: {
    icon: AlertTriangle,
    variant: "destructive",
    defaultTitle: "Server Error",
    defaultMessage: "An error occurred on the server. Our team has been notified and is working on a fix.",
    suggestedActions: [
      "Try again in a few minutes",
      "Check our status page",
      "Contact support if urgent"
    ]
  },
  validation: {
    icon: AlertCircle,
    variant: "default",
    defaultTitle: "Validation Error",
    defaultMessage: "The data received doesn't match the expected format. This might be a temporary issue.",
    suggestedActions: [
      "Refresh the page",
      "Try again later",
      "Report this issue if it persists"
    ]
  },
  python: {
    icon: AlertTriangle,
    variant: "destructive",
    defaultTitle: "Data Processing Error",
    defaultMessage: "An error occurred while processing NFL data. The Python service may be unavailable.",
    suggestedActions: [
      "Try refreshing the page",
      "Check if you have Python installed (for local dev)",
      "Contact support if running in production"
    ]
  },
  unknown: {
    icon: AlertCircle,
    variant: "destructive",
    defaultTitle: "Unexpected Error",
    defaultMessage: "An unexpected error occurred. Please try again or contact support if the problem persists.",
    suggestedActions: [
      "Refresh the page",
      "Clear your browser cache",
      "Try again later"
    ]
  }
}

/**
 * ErrorDisplay Component
 *
 * A comprehensive error display component that handles various error types
 * with user-friendly messages and recovery actions.
 *
 * @example
 * ```tsx
 * <ErrorDisplay
 *   type="network"
 *   showRetry
 *   onRetry={handleRetry}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <ErrorDisplay
 *   type="not-found"
 *   title="Season Data Not Available"
 *   message="2025 season data is not yet available. Try 2024 instead."
 * />
 * ```
 */
export function ErrorDisplay({
  type = "unknown",
  title,
  message,
  technicalDetails,
  showRetry = true,
  onRetry,
  isRetrying = false,
  actions,
  className
}: ErrorDisplayProps) {
  const config = errorConfigs[type]
  const Icon = config.icon

  const displayTitle = title || config.defaultTitle
  const displayMessage = message || config.defaultMessage

  return (
    <Alert
      variant={config.variant}
      className={cn("my-4", className)}
    >
      <Icon className="h-4 w-4" />
      <AlertTitle>{displayTitle}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{displayMessage}</p>

        {config.suggestedActions && config.suggestedActions.length > 0 && (
          <div className="space-y-1">
            <p className="font-medium text-sm">What you can try:</p>
            <ul className="list-disc list-inside space-y-0.5 text-sm">
              {config.suggestedActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        )}

        {technicalDetails && (
          <details className="text-xs text-muted-foreground mt-2">
            <summary className="cursor-pointer font-medium">Technical Details</summary>
            <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
              {technicalDetails}
            </pre>
          </details>
        )}

        {(showRetry || actions) && (
          <div className="flex gap-2 mt-3">
            {showRetry && onRetry && (
              <Button
                onClick={onRetry}
                disabled={isRetrying}
                size="sm"
                variant="outline"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </>
                )}
              </Button>
            )}
            {actions}
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Hook for managing error display with retry logic and exponential backoff
 */
export function useErrorWithRetry() {
  const [error, setError] = React.useState<{
    type: ErrorType
    title?: string
    message?: string
    technicalDetails?: string
  } | null>(null)
  const [isRetrying, setIsRetrying] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)

  const maxRetries = 3
  const baseDelay = 1000 // 1 second

  const handleError = React.useCallback((
    type: ErrorType,
    title?: string,
    message?: string,
    technicalDetails?: string
  ) => {
    setError({ type, title, message, technicalDetails })
    setRetryCount(0)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
    setRetryCount(0)
  }, [])

  const retry = React.useCallback(async (fn: () => Promise<void>) => {
    if (retryCount >= maxRetries) {
      handleError(
        "unknown",
        "Maximum Retries Reached",
        "Unable to complete the operation after multiple attempts. Please try again later.",
        `Attempted ${maxRetries} times`
      )
      return
    }

    setIsRetrying(true)

    // Exponential backoff: 1s, 2s, 4s
    const delay = baseDelay * Math.pow(2, retryCount)
    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      await fn()
      clearError()
    } catch (err) {
      setRetryCount(prev => prev + 1)
      // Error will be handled by the calling code
    } finally {
      setIsRetrying(false)
    }
  }, [retryCount, handleError, clearError])

  return {
    error,
    isRetrying,
    retryCount,
    handleError,
    clearError,
    retry
  }
}

/**
 * Helper function to categorize errors by status code or error type
 */
export function categorizeError(error: unknown): ErrorType {
  if (error && typeof error === "object") {
    // Check for network errors
    if ("message" in error && typeof error.message === "string") {
      const message = error.message.toLowerCase()
      if (message.includes("network") || message.includes("fetch")) {
        return "network"
      }
      if (message.includes("timeout")) {
        return "timeout"
      }
      if (message.includes("python")) {
        return "python"
      }
    }

    // Check for HTTP status codes
    if ("status" in error && typeof error.status === "number") {
      const status = error.status
      if (status === 404) return "not-found"
      if (status === 408) return "timeout"
      if (status >= 500) return "server"
      if (status === 422) return "validation"
    }

    // Check for Response objects
    if (error instanceof Response) {
      if (error.status === 404) return "not-found"
      if (error.status === 408) return "timeout"
      if (error.status >= 500) return "server"
      if (error.status === 422) return "validation"
    }
  }

  return "unknown"
}

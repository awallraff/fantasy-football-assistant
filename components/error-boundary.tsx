"use client"

/**
 * Error Boundary Component (ARCH-001)
 *
 * Catches React errors and prevents full app crashes.
 * Provides user-friendly error UI with recovery options.
 *
 * Usage:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */

import * as React from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
  level?: "root" | "route" | "component"
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error("[ErrorBoundary] Caught error:", error, errorInfo)

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // In production, you could send error to error tracking service here
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI based on error level
      const { error, errorInfo } = this.state
      const { level = "component", showDetails = process.env.NODE_ENV === "development" } = this.props

      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <Card className="w-full max-w-2xl border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-ios-title-2">
                    {level === "root" && "Application Error"}
                    {level === "route" && "Page Error"}
                    {level === "component" && "Something went wrong"}
                  </CardTitle>
                  <CardDescription className="text-ios-body">
                    {level === "root" && "The application encountered an unexpected error"}
                    {level === "route" && "This page encountered an error while loading"}
                    {level === "component" && "A component failed to render"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {showDetails && error && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="text-sm font-mono text-destructive break-all">
                    {error.name}: {error.message}
                  </div>
                  {errorInfo?.componentStack && (
                    <details className="text-xs font-mono text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        Component Stack
                      </summary>
                      <pre className="mt-2 p-2 bg-background rounded overflow-auto max-h-64">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                {level === "component" && (
                  <Button
                    onClick={this.handleReset}
                    variant="default"
                    className="flex-1 min-h-[44px]"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}

                {(level === "route" || level === "root") && (
                  <>
                    <Button
                      onClick={this.handleReload}
                      variant="default"
                      className="flex-1 min-h-[44px]"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reload Page
                    </Button>
                    <Button
                      onClick={this.handleGoHome}
                      variant="outline"
                      className="flex-1 min-h-[44px]"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Go Home
                    </Button>
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                If this problem persists, please contact support
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook to trigger error boundary from function components
 */
export function useErrorHandler() {
  const [, setError] = React.useState()

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error
    })
  }, [])
}

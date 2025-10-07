"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import Link from "next/link"

interface NoLeaguesConnectedProps {
  hasUser: boolean
  debugInfo: string
  retrying: boolean
  onRetry?: () => void
  onClearAndRestart: () => void
  showBackToHome?: boolean
}

export function NoLeaguesConnected({
  hasUser,
  debugInfo,
  retrying,
  onRetry,
  onClearAndRestart,
  showBackToHome = true,
}: NoLeaguesConnectedProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>No Leagues Connected</CardTitle>
            <CardDescription>
              {!hasUser ? "No user data found" : "No leagues found for your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-3 rounded-md text-sm font-mono whitespace-pre-line text-muted-foreground">
              {debugInfo}
            </div>

            <div className="flex flex-col gap-2">
              {hasUser && onRetry && (
                <Button onClick={onRetry} disabled={retrying} className="w-full">
                  {retrying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Fetching Leagues
                    </>
                  )}
                </Button>
              )}

              <Button variant="outline" onClick={onClearAndRestart} className="w-full bg-transparent">
                Start Fresh
              </Button>

              {showBackToHome && (
                <Button asChild className="w-full">
                  <Link href="/">Back to Home</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

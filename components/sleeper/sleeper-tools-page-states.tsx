"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ErrorDisplay } from "@/components/ui/error-display"

export function SleeperToolsHydrationSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-compact-lg py-compact-xl">
        <div className="animate-pulse space-y-compact-md">
          <div className="h-8 w-1/4 rounded-md bg-muted" />
          <div className="h-4 w-1/2 rounded-md bg-muted" />
        </div>
      </div>
    </div>
  )
}

export function SleeperToolsLoadError(props: {
  pageTitle: string
  message: string
  onRetry?: () => void
}) {
  const { pageTitle, message, onRetry } = props
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-compact-lg py-compact-xl">
        <h1 className="mb-compact-md text-ios-title-1 text-foreground">{pageTitle}</h1>
        <ErrorDisplay
          type="validation"
          title="Failed to load saved session"
          message={message}
          showRetry={!!onRetry}
          onRetry={onRetry}
          actions={
            <Button asChild variant="outline" size="sm" className="min-h-[44px]">
              <Link href="/">Return home</Link>
            </Button>
          }
        />
      </div>
    </div>
  )
}

export function SleeperNoLeaguesConnectCard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-compact-lg py-compact-xl">
        <Card className="mx-auto max-w-md rounded-md bg-background-elevated shadow-md">
          <CardContent className="pt-compact-md">
            <div className="py-compact-xl text-center">
              <p className="mb-compact-lg text-ios-body text-text-secondary">No leagues connected</p>
              <Button asChild className="min-h-[44px]">
                <Link href="/">Connect account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function SleeperNoLeaguesForSeasonCard(props: {
  selectedSeason: string
  onSeasonChange: (season: string) => void
}) {
  const { selectedSeason, onSeasonChange } = props
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6">
            <div className="py-8 text-center">
              <p className="mb-4 text-muted-foreground">No leagues connected for {selectedSeason} season</p>
              <div className="space-y-4">
                <Select value={selectedSeason} onValueChange={onSeasonChange}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025 season</SelectItem>
                    <SelectItem value="2024">2024 season</SelectItem>
                  </SelectContent>
                </Select>
                <Button asChild className="min-h-[44px]">
                  <Link href="/">Connect account</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

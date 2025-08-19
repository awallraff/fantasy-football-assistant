"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { NFLDataManager } from "@/components/nfl-data-manager"

export default function NFLDataPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">NFL Historical Data</h1>
            <p className="text-muted-foreground">
              Extract and analyze NFL player statistics using the nfl_data_py library
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              About NFL Data Integration
            </CardTitle>
            <CardDescription>
              This module integrates with the nfl_data_py Python library to provide access to comprehensive NFL statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Available Data</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Weekly player statistics</li>
                  <li>• Seasonal player statistics</li>
                  <li>• Player roster information</li>
                  <li>• Position-specific data (QB, RB, WR, TE)</li>
                  <li>• Historical data from 2020-2024</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Data Sources</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Official NFL statistics</li>
                  <li>• Pro Football Reference</li>
                  <li>• Fantasy football data</li>
                  <li>• Real-time roster updates</li>
                  <li>• Historical performance metrics</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NFL Data Manager */}
        <NFLDataManager />
      </div>
    </div>
  )
}
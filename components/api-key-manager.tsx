"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Key, AlertCircle } from "lucide-react"

interface APIConnection {
  name: string
  key: string
  status: "connected" | "disconnected" | "testing"
  description: string
  signupUrl: string
  testEndpoint?: string
}

export function APIKeyManager() {
  const [connections, setConnections] = useState<APIConnection[]>([])

  useEffect(() => {
    // Load saved API keys from localStorage
    const savedKeys = localStorage.getItem("fantasy_api_keys")
    if (savedKeys) {
      const keys = JSON.parse(savedKeys)
      setConnections((prev) =>
        prev.map((conn) => ({
          ...conn,
          key: keys[conn.name] || "",
          status: keys[conn.name] ? "connected" : "disconnected",
        })),
      )
    }
  }, [])


  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Key className="h-5 w-5" />
        <h3 className="text-lg font-semibold">External Data Sources</h3>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900 dark:text-green-100">Sleeper Player Data Available</p>
            <p className="text-sm text-green-700 dark:text-green-200">
              This application includes comprehensive player data from Sleeper API. Use the Rankings tab to import your own rankings data or view ESPN rankings when available.
            </p>
          </div>
        </div>
      </div>

      {connections.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">No External APIs Required</h3>
              <p className="text-muted-foreground mb-4">
                This application works with your existing Sleeper data and user-imported rankings.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• <strong>Sleeper API:</strong> Player data, league information, and statistics</p>
                <p>• <strong>ESPN API:</strong> Rankings data (when available)</p>
                <p>• <strong>User Imports:</strong> Upload your own rankings and projections</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Key, AlertCircle } from "lucide-react"

interface APIConnection {
  name: string
  key: string
  status: "connected" | "disconnected" | "testing"
  description: string
  signupUrl: string
  testEndpoint?: string
}

export function APIKeyManager() {
  const [connections, setConnections] = useState<APIConnection[]>([
    {
      name: "Fantasy Nerds",
      key: "",
      status: "disconnected",
      description: "Free account provides access to rankings and projections",
      signupUrl: "https://api.fantasynerds.com/getting-started",
    },
    {
      name: "SportsDataIO",
      key: "",
      status: "disconnected",
      description: "Free trial with 1,000 API calls per month",
      signupUrl: "https://sportsdata.io/cart/free-trial-confirmation/nfl",
    },
  ])

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

  const saveAPIKey = (name: string, key: string) => {
    const savedKeys = JSON.parse(localStorage.getItem("fantasy_api_keys") || "{}")
    savedKeys[name] = key
    localStorage.setItem("fantasy_api_keys", JSON.stringify(savedKeys))

    setConnections((prev) =>
      prev.map((conn) => (conn.name === name ? { ...conn, key, status: key ? "connected" : "disconnected" } : conn)),
    )
  }

  const testConnection = async (connection: APIConnection) => {
    if (!connection.key) return

    setConnections((prev) =>
      prev.map((conn) => (conn.name === connection.name ? { ...conn, status: "testing" } : conn)),
    )

    try {
      // Test the API connection
      let testUrl = ""
      if (connection.name === "Fantasy Nerds") {
        testUrl = `https://api.fantasynerds.com/v1/nfl/draft-rankings?apikey=${connection.key}&limit=1`
      }

      if (testUrl) {
        const response = await fetch(testUrl)
        const status = response.ok ? "connected" : "disconnected"

        setConnections((prev) => prev.map((conn) => (conn.name === connection.name ? { ...conn, status } : conn)))
      }
    } catch {
      setConnections((prev) =>
        prev.map((conn) => (conn.name === connection.name ? { ...conn, status: "disconnected" } : conn)),
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Key className="h-5 w-5" />
        <h3 className="text-lg font-semibold">External Data Sources</h3>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Real Data Sources Only</p>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              This application only uses real data from external sources. Connect your API keys below to access rankings
              and projections.
            </p>
          </div>
        </div>
      </div>

      {connections.map((connection) => (
        <Card key={connection.name}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{connection.name}</span>
              <Badge
                variant={connection.status === "connected" ? "default" : "secondary"}
                className={connection.status === "connected" ? "bg-green-600" : ""}
              >
                {connection.status === "testing" ? "Testing..." : connection.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{connection.description}</p>

            <div className="space-y-2">
              <Label htmlFor={`${connection.name}-key`}>API Key</Label>
              <div className="flex gap-2">
                <Input
                  id={`${connection.name}-key`}
                  type="password"
                  placeholder="Enter your API key"
                  value={connection.key}
                  onChange={(e) => {
                    const newKey = e.target.value
                    setConnections((prev) =>
                      prev.map((conn) => (conn.name === connection.name ? { ...conn, key: newKey } : conn)),
                    )
                  }}
                />
                <Button onClick={() => saveAPIKey(connection.name, connection.key)} disabled={!connection.key}>
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testConnection(connection)}
                  disabled={!connection.key || connection.status === "testing"}
                >
                  Test
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={connection.signupUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get API Key
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

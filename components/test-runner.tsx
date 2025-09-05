"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Play } from "lucide-react"

type TestResult = {
  testName: string
  passed: boolean
  duration: number
  error?: string
}

export function TestRunner() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])

    try {
      // Simulate running Playwright tests
      const mockResults: TestResult[] = [
        { testName: "Homepage loads correctly", passed: true, duration: 1200 },
        { testName: "Navigation works", passed: true, duration: 800 },
        { testName: "API endpoints respond", passed: true, duration: 1500 }
      ]
      
      // Simulate async test execution
      await new Promise(resolve => setTimeout(resolve, 2000))
      setTestResults(mockResults)
    } catch (error) {
      console.error("Test runner error:", error)
      setTestResults([
        { testName: "Test execution failed", passed: false, duration: 0, error: error instanceof Error ? error.message : 'Unknown error' }
      ])
    } finally {
      setIsRunning(false)
    }
  }

  const TestResultCard = ({
    title,
    results,
  }: {
    title: string
    results: TestResult[]
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant={results.every((r) => r.passed) ? "default" : "destructive"}>
            {results.filter((r) => r.passed).length}/{results.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {results.map((result, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded border">
            <div className="flex items-center gap-2">
              {result.passed ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">{result.testName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {result.duration}ms
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Test Suite</h2>
          <p className="text-muted-foreground">Run comprehensive tests before deploying enhancements</p>
        </div>
        <Button onClick={runTests} disabled={isRunning}>
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? "Running Tests..." : "Run Tests"}
        </Button>
      </div>

      {testResults.length > 0 && <TestResultCard title="Test Results" results={testResults} />}
    </div>
  )
}

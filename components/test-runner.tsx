"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { smokeTestRunner, type SmokeTestResult } from "@/tests/smoke-tests"
import { functionalTestRunner, type FunctionalTestResult } from "@/tests/functional-tests"
import { CheckCircle, XCircle, Clock, Play } from "lucide-react"

export function TestRunner() {
  const [smokeResults, setSmokeResults] = useState<SmokeTestResult[]>([])
  const [functionalResults, setFunctionalResults] = useState<FunctionalTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runAllTests = async () => {
    setIsRunning(true)
    setSmokeResults([])
    setFunctionalResults([])

    try {
      // Run smoke tests first
      const smokeResults = await smokeTestRunner.runAllTests()
      setSmokeResults(smokeResults)

      // Only run functional tests if smoke tests pass
      const smokeTestsPassed = smokeResults.every((r) => r.passed)
      if (smokeTestsPassed) {
        const functionalResults = await functionalTestRunner.runAllTests()
        setFunctionalResults(functionalResults)
      } else {
        console.log("⚠️ Skipping functional tests due to smoke test failures")
      }
    } catch (error) {
      console.error("Test runner error:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const TestResultCard = ({
    title,
    results,
  }: {
    title: string
    results: (SmokeTestResult | FunctionalTestResult)[]
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
        <Button onClick={runAllTests} disabled={isRunning}>
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? "Running Tests..." : "Run All Tests"}
        </Button>
      </div>

      {smokeResults.length > 0 && <TestResultCard title="Smoke Tests" results={smokeResults} />}

      {functionalResults.length > 0 && <TestResultCard title="Functional Tests" results={functionalResults} />}
    </div>
  )
}

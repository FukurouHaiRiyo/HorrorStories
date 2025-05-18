"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { runVacuum, analyzeDatabase, reindexDatabase } from "@/lib/db-optimization"

export default function DatabaseOptimizationContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [lastOperation, setLastOperation] = useState<string | null>(null)

  useEffect(() => {
    // Check if there's a status in the URL
    const statusParam = searchParams.get("status")
    if (statusParam) {
      setStatus(statusParam)
    }
  }, [searchParams])

  const handleVacuum = async () => {
    setIsLoading(true)
    setStatus("Running VACUUM operation...")
    setLastOperation("vacuum")
    try {
      const result = await runVacuum()
      setStatus(`VACUUM completed: ${result.message}`)
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyze = async () => {
    setIsLoading(true)
    setStatus("Running ANALYZE operation...")
    setLastOperation("analyze")
    try {
      const result = await analyzeDatabase()
      setStatus(`ANALYZE completed: ${result.message}`)
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReindex = async () => {
    setIsLoading(true)
    setStatus("Running REINDEX operation...")
    setLastOperation("reindex")
    try {
      const result = await reindexDatabase()
      setStatus(`REINDEX completed: ${result.message}`)
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Database Optimization</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>VACUUM</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Reclaims storage occupied by dead tuples.</p>
            <Button onClick={handleVacuum} disabled={isLoading} className="w-full">
              Run VACUUM
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ANALYZE</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Updates statistics used by the query planner.</p>
            <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
              Run ANALYZE
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>REINDEX</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Rebuilds indexes to improve query performance.</p>
            <Button onClick={handleReindex} disabled={isLoading} className="w-full">
              Run REINDEX
            </Button>
          </CardContent>
        </Card>
      </div>

      {status && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Operation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`${lastOperation === "vacuum" ? "text-green-600" : lastOperation === "analyze" ? "text-blue-600" : lastOperation === "reindex" ? "text-purple-600" : ""}`}
            >
              {status}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About Database Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Regular database maintenance is important for optimal performance:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>VACUUM</strong> - Reclaims storage and improves visibility.
            </li>
            <li>
              <strong>ANALYZE</strong> - Collects statistics for the query planner.
            </li>
            <li>
              <strong>REINDEX</strong> - Rebuilds indexes that may have become bloated or corrupted.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

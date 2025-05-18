"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Database, Check, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { MainNav } from "@/components/main-nav"
import { runDatabaseOptimizations } from "@/lib/db-optimization"

export default function DatabaseOptimizationPage() {
  const router = useRouter()
  const { isAdmin, isAuthReady } = useAuth()
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<{
    success?: boolean
    error?: any
    message?: string
  } | null>(null)

  // Redirect if not admin
  if (isAuthReady && !isAdmin) {
    router.push("/")
    return null
  }

  const handleRunOptimizations = async () => {
    setIsRunning(true)
    setResults(null)

    try {
      const result = await runDatabaseOptimizations()

      if (result.success) {
        setResults({
          success: true,
          message: "Database optimizations completed successfully!",
        })
        toast({
          title: "Success",
          description: "Database optimizations have been applied successfully.",
        })
      } else {
        setResults({
          success: false,
          error: result.error,
          message: "Failed to apply some database optimizations.",
        })
        toast({
          title: "Partial failure",
          description: "Some database optimizations could not be applied.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setResults({
        success: false,
        error,
        message: "An error occurred while running database optimizations.",
      })
      toast({
        title: "Error",
        description: "Failed to run database optimizations.",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <MainNav />
      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Database Optimization</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-gray-800 bg-gray-950">
              <CardHeader>
                <CardTitle>Optimize Database Performance</CardTitle>
                <CardDescription className="text-gray-400">
                  Run optimizations to improve database performance by creating indexes and specialized functions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-gray-400">This will create the following optimizations:</p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Create indexes on frequently queried columns
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Create a materialized view for story statistics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Create optimized functions for trending and related stories
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Set up triggers to keep statistics up to date
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleRunOptimizations}
                  disabled={isRunning}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Optimizations...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Run Database Optimizations
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {results && (
              <Card className={`border-gray-800 ${results.success ? "bg-green-900/20" : "bg-red-900/20"}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {results.success ? (
                      <>
                        <Check className="h-5 w-5 text-green-500" />
                        <span>Success</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span>Error</span>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{results.message}</p>
                  {results.error && (
                    <div className="rounded-md bg-gray-900 p-4">
                      <p className="font-mono text-xs text-red-400">
                        {typeof results.error === "object"
                          ? JSON.stringify(results.error, null, 2)
                          : String(results.error)}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => router.push("/admin")}
                    variant="outline"
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    Return to Admin Dashboard
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          <div className="mt-8">
            <Card className="border-gray-800 bg-gray-950">
              <CardHeader>
                <CardTitle>Performance Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 font-semibold">Use Optimized Functions</h3>
                    <p className="text-sm text-gray-400">
                      The optimized database functions can be used in your code by importing from the
                      optimized-data-fetching.ts file:
                    </p>
                    <pre className="mt-2 rounded-md bg-gray-900 p-4 text-xs">
                      {`import { 
  fetchStoriesOptimized, 
  fetchStoryOptimized,
  fetchTrendingStories,
  fetchRelatedStories 
} from "@/lib/optimized-data-fetching"`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="mb-2 font-semibold">Monitor Performance</h3>
                    <p className="text-sm text-gray-400">
                      Keep an eye on query performance as your database grows. You may need to adjust indexes or add
                      more optimizations over time.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 font-semibold">Refresh Materialized Views</h3>
                    <p className="text-sm text-gray-400">
                      The materialized view is set to refresh automatically via triggers, but you can manually refresh
                      it if needed:
                    </p>
                    <pre className="mt-2 rounded-md bg-gray-900 p-4 text-xs">
                      {`REFRESH MATERIALIZED VIEW CONCURRENTLY story_statistics;`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

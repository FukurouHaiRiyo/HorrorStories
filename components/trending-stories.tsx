"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader2, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchTrendingStories } from "@/lib/optimized-data-fetching"
import type { Story } from "@/types/supabase"

interface TrendingStoriesProps {
  limit?: number
  days?: number
}

export function TrendingStories({ limit = 5, days = 7 }: TrendingStoriesProps) {
  const [stories, setStories] = useState<(Story & { trending_score?: number })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTrendingStories = async () => {
      setIsLoading(true)
      try {
        const result = await fetchTrendingStories(days, limit)

        if (result.error) {
          throw result.error
        }

        setStories(result.data)
        setError(null)
      } catch (err: any) {
        console.error("Error loading trending stories:", err)
        setError(err.message || "Failed to load trending stories")
      } finally {
        setIsLoading(false)
      }
    }

    loadTrendingStories()
  }, [limit, days])

  if (isLoading) {
    return (
      <Card className="border-gray-800 bg-gray-950">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <span>Trending Stories</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-red-500" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-gray-800 bg-gray-950">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <span>Trending Stories</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">Failed to load trending stories</p>
        </CardContent>
      </Card>
    )
  }

  if (stories.length === 0) {
    return (
      <Card className="border-gray-800 bg-gray-950">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <span>Trending Stories</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">No trending stories found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-800 bg-gray-950">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-red-500" />
          <span>Trending Stories</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {stories.map((story, index) => (
            <Link key={story.id} href={`/stories/${story.id}`}>
              <div className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-gray-900">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium line-clamp-1">{story.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{story.view_count} views</span>
                    <span>{story.likes_count} likes</span>
                    <span>{story.comments_count} comments</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

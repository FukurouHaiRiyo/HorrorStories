"use client"

import { useState, useEffect } from "react"
import { Loader2, Eye, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchStoryStatistics } from "@/lib/story-statistics"

interface StoryStatisticsCardProps {
  storyId: string
}

export function StoryStatisticsCard({ storyId }: StoryStatisticsCardProps) {
  const [statistics, setStatistics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStatistics = async () => {
      setIsLoading(true)
      try {
        const result = await fetchStoryStatistics(storyId)

        if (result.error) {
          throw result.error
        }

        setStatistics(result.statistics)
        setError(null)
      } catch (err: any) {
        console.error("Error loading story statistics:", err)
        setError(err.message || "Failed to load statistics")
      } finally {
        setIsLoading(false)
      }
    }

    loadStatistics()
  }, [storyId])

  if (isLoading) {
    return (
      <Card className="border-gray-800 bg-gray-950">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Story Statistics</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-red-500" />
        </CardContent>
      </Card>
    )
  }

  if (error || !statistics) {
    return (
      <Card className="border-gray-800 bg-gray-950">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Story Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">Failed to load statistics</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-800 bg-gray-950">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Story Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Views</p>
              <p className="font-medium">{statistics.views.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm text-gray-400">Likes</p>
              <p className="font-medium">{statistics.likes.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThumbsDown className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm text-gray-400">Dislikes</p>
              <p className="font-medium">{statistics.dislikes.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Comments</p>
              <p className="font-medium">{statistics.comments.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Engagement Rate</p>
            <p className="font-medium">{statistics.engagementRate}%</p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Like Ratio</p>
            <p className="font-medium">{statistics.likeRatio}%</p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Total Engagements</p>
            <p className="font-medium">{statistics.totalEngagements.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

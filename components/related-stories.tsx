"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchRelatedStories } from "@/lib/optimized-data-fetching"
import type { Story } from "@/types/supabase"

interface RelatedStoriesProps {
  storyId: string
  limit?: number
}

export function RelatedStories({ storyId, limit = 3 }: RelatedStoriesProps) {
  const [stories, setStories] = useState<(Story & { relevance_score?: number })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRelatedStories = async () => {
      setIsLoading(true)
      try {
        const result = await fetchRelatedStories(storyId, limit)

        if (result.error) {
          throw result.error
        }

        setStories(result.data)
        setError(null)
      } catch (err: any) {
        console.error("Error loading related stories:", err)
        setError(err.message || "Failed to load related stories")
      } finally {
        setIsLoading(false)
      }
    }

    loadRelatedStories()
  }, [storyId, limit])

  if (isLoading) {
    return (
      <Card className="border-gray-800 bg-gray-950">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Related Stories</CardTitle>
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
          <CardTitle className="text-lg font-medium">Related Stories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">Failed to load related stories</p>
        </CardContent>
      </Card>
    )
  }

  if (stories.length === 0) {
    return (
      <Card className="border-gray-800 bg-gray-950">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Related Stories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">No related stories found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-800 bg-gray-950">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Related Stories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stories.map((story) => (
          <Link key={story.id} href={`/stories/${story.id}`}>
            <div className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-gray-900">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                <Image
                  src={story.image_url || "/placeholder.svg?height=64&width=64"}
                  alt={story.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-medium line-clamp-1">{story.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-1">{story.excerpt || ""}</p>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { StoryCard } from "@/components/story-card"
import { Button } from "@/components/ui/button"
import { fetchStories } from "@/lib/data-fetching"
import type { Story } from "@/types/supabase"

interface StoryListProps {
  featured?: boolean
  categoryId?: string
  searchQuery?: string
  pageSize?: number
}

export function StoryList({ featured, categoryId, searchQuery, pageSize = 9 }: StoryListProps) {
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const loadStories = async () => {
      setIsLoading(true)

      const { data, count, error } = await fetchStories({
        page,
        pageSize,
        featured,
        categoryId,
        searchQuery,
      })

      if (error) {
        setError(error.message)
      } else {
        console.log("Stories loaded with counts:", data)
        setStories(data)
        setTotalPages(Math.ceil((count || 0) / pageSize))
        setError(null)
      }

      setIsLoading(false)
    }

    loadStories()
  }, [page, pageSize, featured, categoryId, searchQuery])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo(0, 0)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        <span className="ml-2">Loading stories...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-800 bg-red-900/20 rounded-md">
        <h3 className="text-lg font-semibold text-red-500">Error loading stories</h3>
        <p className="text-gray-300">{error}</p>
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-950 p-8 text-center">
        <p className="text-gray-400">No stories found.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            {page > 1 && (
              <Button
                variant="outline"
                className="border-gray-800 hover:bg-gray-900"
                onClick={() => handlePageChange(page - 1)}
              >
                Previous
              </Button>
            )}
            <div className="flex items-center px-4">
              Page {page} of {totalPages}
            </div>
            {page < totalPages && (
              <Button
                variant="outline"
                className="border-gray-800 hover:bg-gray-900"
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

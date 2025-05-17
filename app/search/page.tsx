"use client"

import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { MainNav } from "@/components/main-nav"
import { StoryCard } from "@/components/story-card"
import { SearchBar } from "@/components/search-bar"
import { getServiceClient } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import type { Story } from "@/types/supabase"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams?.get("q") || ""
  const { error: authError } = useAuth()
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (authError || !query) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // Use service client to bypass RLS
        const supabase = getServiceClient()

        // Search for stories that match the query in title or content
        const { data: storiesData, error: storiesError } = await supabase
          .from("stories")
          .select("*")
          .eq("published", true)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
          .order("created_at", { ascending: false })

        if (storiesError) throw storiesError

        setStories(storiesData as Story[])
        setError(null)
      } catch (err: any) {
        console.error("Error searching stories:", err.message)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSearchResults()
  }, [query, authError])

  if (!query) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        <MainNav />
        <main className="flex-1">
          <div className="container px-4 py-8 md:px-6 md:py-12">
            <div className="mb-8 space-y-4">
              <h1 className="text-3xl font-bold">Search</h1>
              <Suspense fallback={<div>Loading search bar...</div>}>
                <SearchBar />
              </Suspense>
              <p className="text-gray-400">Enter a search term to find horror stories.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <MainNav />
      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <div className="mb-8 space-y-4">
            <h1 className="text-3xl font-bold">Search Results</h1>
            <SearchBar />
            {!isLoading && !error && (
              <p className="text-gray-400">
                {stories.length} {stories.length === 1 ? "result" : "results"} for &quot;{query}&quot;
              </p>
            )}
          </div>

          {error && (
            <div className="mb-8 p-4 border border-red-800 bg-red-900/20 rounded-md">
              <h3 className="text-lg font-semibold text-red-500">Error searching stories</h3>
              <p className="text-gray-300">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              <span className="ml-2">Searching...</span>
            </div>
          ) : stories.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-800 bg-gray-950 p-8 text-center">
              <p className="text-gray-400 mb-4">No stories found matching your search.</p>
              <Link href="/stories">
                <span className="text-red-500 hover:underline">Browse all stories</span>
              </Link>
            </div>
          )}
        </div>
      </main>
      <footer className="border-t border-gray-800 bg-black py-6">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <p className="text-center text-sm text-gray-500 md:text-left">
            © {new Date().getFullYear()} NightmareNarrator. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-gray-500 hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-white">
              Privacy
            </Link>
            <Link href="/contact" className="text-sm text-gray-500 hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

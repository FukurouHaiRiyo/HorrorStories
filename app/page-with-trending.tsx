"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { FeaturedStory } from "@/components/featured-story"
import { StoryList } from "@/components/story-list"
import { MainNav } from "@/components/main-nav"
import { EnvChecker } from "@/components/env-checker"
import { useAuth } from "@/context/auth-context"
import { fetchStories } from "@/lib/data-fetching"
import { TrendingStories } from "@/components/trending-stories"
import type { Story } from "@/types/supabase"

export default function HomeWithTrending() {
  const { error: authError, isLoading: authLoading } = useAuth()
  const [featuredStory, setFeaturedStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Wait for auth to be ready before fetching data
    if (authLoading && retryCount === 0) {
      return
    }

    const loadFeaturedStory = async () => {
      if (authError) {
        return
      }

      setIsLoading(true)
      try {
        console.log(`Fetching featured story (attempt ${retryCount + 1})...`)
        const { data, error: storiesError } = await fetchStories({
          featured: true,
          pageSize: 1,
        })

        if (storiesError) throw storiesError

        if (!data || data.length === 0) {
          // If no data and we haven't retried too many times, retry
          if (retryCount < 2) {
            console.log("No featured story found, retrying...")
            setRetryCount(retryCount + 1)
            return
          }
        }

        console.log("Featured story data:", data[0])
        setFeaturedStory(data[0] || null)
        setLoadError(null)
      } catch (err: any) {
        console.error("Error fetching featured story:", err.message)
        setLoadError(err.message)

        // Retry on error if we haven't retried too many times
        if (retryCount < 2) {
          console.log("Error fetching featured story, retrying...")
          setRetryCount(retryCount + 1)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadFeaturedStory()
  }, [authError, authLoading, retryCount])

  const handleRetry = () => {
    setRetryCount(retryCount + 1)
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <MainNav />
      <main className="flex-1">
        <section className="container px-4 py-12 md:px-6 md:py-24">
          {/* Show environment checker */}
          <EnvChecker />

          {loadError && (
            <div className="mb-8 p-4 border border-red-800 bg-red-900/20 rounded-md">
              <h3 className="text-lg font-semibold text-red-500">Error loading content</h3>
              <p className="text-gray-300">{loadError}</p>
              <Button onClick={handleRetry} className="mt-4 bg-red-600 hover:bg-red-700">
                Retry
              </Button>
            </div>
          )}

          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl/none">
              Welcome to <span className="text-red-500">NightmareNarrator</span>
            </h1>
            <p className="max-w-[700px] text-gray-400 md:text-xl">
              Dive into a world of terror and suspense with original horror stories that will keep you up at night.
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/stories">
                <Button className="bg-red-600 text-white hover:bg-red-700">
                  Browse Stories
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-900">
                  Sign Up to Interact
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="container px-4 py-8 md:px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {featuredStory && (
                <section className="mb-12">
                  <h2 className="mb-6 text-3xl font-bold tracking-tighter">Featured Story</h2>
                  <FeaturedStory story={featuredStory} />
                </section>
              )}

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold tracking-tighter">Recent Stories</h2>
                  <Link href="/stories" className="text-red-500 hover:underline">
                    View All
                  </Link>
                </div>
                <StoryList pageSize={4} />
              </section>
            </div>

            <aside>
              <TrendingStories limit={5} days={7} />
            </aside>
          </div>
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

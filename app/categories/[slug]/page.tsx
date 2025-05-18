"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { MainNav } from "@/components/main-nav"
import { StoryCard } from "@/components/story-card"
import { getServiceClient } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import type { Story, Category } from "@/types/supabase"

export default function CategoryPage() {
  const params = useParams()
  const slug = params?.slug as string
  const router = useRouter()
  const { error: authError } = useAuth()
  const [category, setCategory] = useState<Category | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategoryAndStories = async () => {
      if (authError || !slug) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // Use service client to bypass RLS
        const supabase = getServiceClient()

        // Fetch category
        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("*")
          .eq("slug", slug)
          .single()

        if (categoryError) throw categoryError
        setCategory(categoryData)

        // Fetch stories in this category
        const { data: storyCategoryLinks, error: linksError } = await supabase
          .from("story_categories")
          .select("story_id")
          .eq("category_id", categoryData.id)

        if (linksError) throw linksError

        const storyIds = storyCategoryLinks?.map((link) => link.story_id) || []

        if (storyIds.length > 0) {
          const { data: storiesData, error: storiesError } = await supabase
            .from("stories")
            .select("*")
            .in("id", storyIds)
            .eq("published", true)
            .order("created_at", { ascending: false })

          if (storiesError) throw storiesError

          setStories(storiesData as Story[])
        }

        setError(null)
      } catch (err: any) {
        console.error("Error fetching category and stories:", err.message)
        setError(err.message)

        // If category not found, redirect to categories page
        if (err.message.includes("not found")) {
          router.push("/categories")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategoryAndStories()
  }, [slug, authError, router])

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <MainNav />
      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <div className="mb-8">
            <Link href="/categories" className="text-red-500 hover:underline">
              ← Back to Categories
            </Link>

            {isLoading ? (
              <div className="mt-4 h-8 w-48 bg-gray-800 animate-pulse rounded"></div>
            ) : error ? (
              <h1 className="mt-4 text-3xl font-bold">Category not found</h1>
            ) : (
              <>
                <h1 className="mt-4 text-3xl font-bold">{category?.name}</h1>
                {category?.description && <p className="mt-2 text-gray-400">{category.description}</p>}
              </>
            )}
          </div>

          {error && !error.includes("not found") && (
            <div className="mb-8 p-4 border border-red-800 bg-red-900/20 rounded-md">
              <h3 className="text-lg font-semibold text-red-500">Error loading content</h3>
              <p className="text-gray-300">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              <span className="ml-2">Loading stories...</span>
            </div>
          ) : stories.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-800 bg-gray-950 p-8 text-center">
              <p className="text-gray-400">No stories found in this category.</p>
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

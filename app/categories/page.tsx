"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { MainNav } from "@/components/main-nav"
import { getServiceClient } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import type { Category } from "@/types/supabase"

export default function CategoriesPage() {
  const { error: authError } = useAuth()
  const [categories, setCategories] = useState<(Category & { storyCount: number })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      if (authError) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // Use service client to bypass RLS
        const supabase = getServiceClient()

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name")

        if (categoriesError) throw categoriesError

        // Count stories per category
        const categoriesWithCount = await Promise.all(
          (categoriesData || []).map(async (category) => {
            const { count, error: countError } = await supabase
              .from("story_categories")
              .select("*", { count: "exact", head: true })
              .eq("category_id", category.id)

            if (countError) throw countError

            return {
              ...category,
              storyCount: count || 0,
            }
          }),
        )

        setCategories(categoriesWithCount)
        setError(null)
      } catch (err: any) {
        console.error("Error fetching categories:", err.message)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [authError])

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <MainNav />
      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <h1 className="mb-8 text-3xl font-bold">Categories</h1>

          {error && (
            <div className="mb-8 p-4 border border-red-800 bg-red-900/20 rounded-md">
              <h3 className="text-lg font-semibold text-red-500">Error loading categories</h3>
              <p className="text-gray-300">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              <span className="ml-2">Loading categories...</span>
            </div>
          ) : categories.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="rounded-lg border border-gray-800 bg-gray-950 p-4 transition-colors hover:border-gray-700 hover:bg-gray-900"
                >
                  <h2 className="text-xl font-bold">{category.name}</h2>
                  <p className="mt-2 text-sm text-gray-400">
                    {category.storyCount} {category.storyCount === 1 ? "story" : "stories"}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-800 bg-gray-950 p-8 text-center">
              <p className="text-gray-400">No categories found.</p>
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

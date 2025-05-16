"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { MainNav } from "@/components/main-nav"
import { AdminStoryCard } from "@/components/admin-story-card"
import type { Story } from "@/types/supabase"

export default function AdminPage() {
  const router = useRouter()
  const { user, profile, isAdmin, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    // Add debug info
    setDebugInfo(`User: ${user?.email || "none"}, 
                 Profile: ${profile ? JSON.stringify(profile) : "none"}, 
                 isAdmin: ${isAdmin}, 
                 authLoading: ${authLoading}`)

    // Check if user is admin
    if (!authLoading && !isAdmin) {
      toast({
        title: "Access denied",
        description: "You don't have permission to access the admin area.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    const fetchStories = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("stories")
          .select(`
            *,
            categories:story_categories(
              category_id(id, name)
            )
          `)
          .order("created_at", { ascending: false })

        if (error) throw error

        // Count likes and comments
        const storiesWithCounts = await Promise.all(
          data.map(async (story) => {
            // Get likes count
            const { count: likesCount, error: likesError } = await supabase
              .from("likes")
              .select("*", { count: "exact", head: true })
              .eq("story_id", story.id)
              .eq("value", 1)

            if (likesError) throw likesError

            // Get comments count
            const { count: commentsCount, error: commentsError } = await supabase
              .from("comments")
              .select("*", { count: "exact", head: true })
              .eq("story_id", story.id)

            if (commentsError) throw commentsError

            return {
              ...story,
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
            }
          }),
        )

        setStories(storiesWithCounts)
      } catch (error: any) {
        toast({
          title: "Error fetching stories",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user && isAdmin) {
      fetchStories()
    } else {
      setIsLoading(false)
    }
  }, [user, isAdmin, authLoading, router, toast, supabase, profile])

  const handleDeleteStory = async (id: string) => {
    try {
      const { error } = await supabase.from("stories").delete().eq("id", id)

      if (error) throw error

      setStories(stories.filter((story) => story.id !== id))

      toast({
        title: "Story deleted",
        description: "The story has been deleted successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error deleting story",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        <p className="mt-2">Loading...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        <MainNav />
        <div className="container flex flex-1 items-center justify-center px-4 py-12 md:px-6">
          <div className="mx-auto w-full max-w-md space-y-6 text-center">
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-gray-400">You don't have permission to access the admin area.</p>
            <div className="p-4 border border-gray-800 rounded-md bg-gray-900 text-left">
              <h2 className="text-lg font-semibold mb-2">Debug Info:</h2>
              <pre className="whitespace-pre-wrap text-xs text-gray-400 overflow-auto max-h-60">{debugInfo}</pre>
            </div>
            <Link href="/">
              <Button className="bg-red-600 text-white hover:bg-red-700">Go to Homepage</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <MainNav />
      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Link href="/admin/stories/new">
              <Button className="bg-red-600 text-white hover:bg-red-700">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Story
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-800 bg-gray-950 p-6">
              <h2 className="mb-4 text-xl font-bold">Quick Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md bg-gray-900 p-4">
                  <div className="text-sm text-gray-400">Total Stories</div>
                  <div className="text-2xl font-bold">{stories.length}</div>
                </div>
                <div className="rounded-md bg-gray-900 p-4">
                  <div className="text-sm text-gray-400">Published</div>
                  <div className="text-2xl font-bold">{stories.filter((story) => story.published).length}</div>
                </div>
                <div className="rounded-md bg-gray-900 p-4">
                  <div className="text-sm text-gray-400">Total Likes</div>
                  <div className="text-2xl font-bold">
                    {stories.reduce((sum, story) => sum + (story.likes_count || 0), 0)}
                  </div>
                </div>
                <div className="rounded-md bg-gray-900 p-4">
                  <div className="text-sm text-gray-400">Total Comments</div>
                  <div className="text-2xl font-bold">
                    {stories.reduce((sum, story) => sum + (story.comments_count || 0), 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-6 md:col-span-2">
              <h2 className="mb-4 text-xl font-bold">Recent Activity</h2>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-red-500" />
                    <span className="ml-2">Loading stories...</span>
                  </div>
                ) : stories.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No stories found. Create your first horror story!</p>
                  </div>
                ) : (
                  stories.slice(0, 3).map((story) => (
                    <div key={story.id} className="rounded-md border border-gray-800 bg-gray-900 p-4">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{story.title}</h3>
                          <p className="text-sm text-gray-400">{new Date(story.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-sm text-gray-400">{story.published ? "Published" : "Draft"}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <h2 className="mb-4 mt-8 text-2xl font-bold">All Stories</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-red-500" />
              <span className="ml-2">Loading stories...</span>
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border border-gray-800 rounded-lg">
              <p className="mb-4">No stories found. Create your first horror story!</p>
              <Link href="/admin/stories/new">
                <Button className="bg-red-600 text-white hover:bg-red-700">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Story
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => (
                <AdminStoryCard key={story.id} story={story} onDelete={() => handleDeleteStory(story.id)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

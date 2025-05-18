"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { MessageSquare, Share2, ThumbsDown, ThumbsUp, Loader2, RefreshCw } from "lucide-react"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { MainNav } from "@/components/main-nav"
import { StoryStatisticsCard } from "@/components/story-statistics-card"
import { RelatedStories } from "@/components/related-stories"
import type { Story, Comment, Profile, Category } from "@/types/supabase"

export default function StoryPageWithStats() {
  const params = useParams()
  const storyId = params?.id as string
  const { user } = useAuth()
  const { toast } = useToast()
  const [story, setStory] = useState<Story | null>(null)
  const [author, setAuthor] = useState<Profile | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [userLike, setUserLike] = useState<number>(0) // 0 = no like, 1 = like, -1 = dislike
  const [likeCount, setLikeCount] = useState(0)
  const [commentText, setCommentText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchStory = async () => {
      if (!storyId) return

      setIsLoading(true)
      try {
        console.log(`Fetching story (attempt ${retryCount + 1})...`)

        // Use browser client to respect RLS policies
        // 1. Fetch the story
        const { data: storyData, error: storyError } = await supabase
          .from("stories")
          .select("*")
          .eq("id", storyId)
          .eq("published", true) // Only fetch published stories
          .single()

        if (storyError) throw storyError

        // 2. Fetch author separately
        let authorData = null
        if (storyData.author_id) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url")
            .eq("id", storyData.author_id)
            .single()

          if (!profileError) {
            authorData = profileData
          }
        }

        // 3. Fetch categories
        const { data: categoryLinks, error: categoryLinksError } = await supabase
          .from("story_categories")
          .select("category_id")
          .eq("story_id", storyId)

        if (categoryLinksError) throw categoryLinksError

        let categoriesData: Category[] = []
        if (categoryLinks && categoryLinks.length > 0) {
          const categoryIds = categoryLinks.map((link) => link.category_id)
          const { data: fetchedCategories, error: categoriesError } = await supabase
            .from("categories")
            .select("*")
            .in("id", categoryIds)

          if (!categoriesError) {
            categoriesData = fetchedCategories
          }
        }

        // 4. Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select("*")
          .eq("story_id", storyId)
          .order("created_at", { ascending: false })

        if (commentsError) throw commentsError

        // 5. Fetch comment authors
        const commentsWithUsers = await Promise.all(
          (commentsData || []).map(async (comment) => {
            if (comment.user_id) {
              try {
                const { data: userData, error: userError } = await supabase
                  .from("profiles")
                  .select("id, username, full_name, avatar_url")
                  .eq("id", comment.user_id)
                  .single()

                if (!userError) {
                  return {
                    ...comment,
                    user: userData,
                  }
                }
              } catch (error) {
                console.error("Error fetching comment author:", error)
              }
            }

            return {
              ...comment,
              user: null,
            }
          }),
        )

        // 6. Get likes count
        const { count: likesCount, error: likesError } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("story_id", storyId)
          .eq("value", 1)

        if (likesError) throw likesError

        // 7. Check if user has liked/disliked
        if (user) {
          const { data: userLikeData, error: userLikeError } = await supabase
            .from("likes")
            .select("value")
            .eq("story_id", storyId)
            .eq("user_id", user.id)
            .single()

          if (!userLikeError && userLikeData) {
            setUserLike(userLikeData.value)
          }
        }

        // 8. Increment view count using RPC function that respects RLS
        try {
          await supabase.rpc("increment_view_count", { story_id: storyId })
        } catch (viewCountError) {
          console.error("Error incrementing view count:", viewCountError)
          // Continue even if this fails
        }

        // Set all the state
        setStory(storyData)
        setAuthor(authorData)
        setCategories(categoriesData)
        setComments(commentsWithUsers)
        setLikeCount(likesCount || 0)
      } catch (error: any) {
        console.error("Error loading story:", error)

        // Retry on error if we haven't retried too many times
        if (retryCount < 2) {
          console.log("Error loading story, retrying...")
          setRetryCount(retryCount + 1)
          return
        }

        toast({
          title: "Error loading story",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStory()
  }, [storyId, user, toast, supabase, retryCount])

  const handleLike = async (value: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like or dislike stories.",
        variant: "destructive",
      })
      return
    }

    try {
      if (userLike === value) {
        // User is toggling off their like/dislike
        const { error } = await supabase.from("likes").delete().eq("story_id", storyId).eq("user_id", user.id)

        if (error) throw error

        setUserLike(0)
        if (value === 1) {
          setLikeCount(likeCount - 1)
        }
      } else {
        // Check if user already has a like/dislike
        const { data, error } = await supabase.from("likes").select("*").eq("story_id", storyId).eq("user_id", user.id)

        if (error) throw error

        if (data && data.length > 0) {
          // Update existing like/dislike
          const { error: updateError } = await supabase
            .from("likes")
            .update({ value })
            .eq("story_id", storyId)
            .eq("user_id", user.id)

          if (updateError) throw updateError

          // If changing from dislike to like
          if (userLike === -1 && value === 1) {
            setLikeCount(likeCount + 1)
          }
          // If changing from like to dislike
          else if (userLike === 1 && value === -1) {
            setLikeCount(likeCount - 1)
          }
        } else {
          // Insert new like/dislike
          const { error: insertError } = await supabase.from("likes").insert({
            story_id: storyId,
            user_id: user.id,
            value,
          })

          if (insertError) throw insertError

          if (value === 1) {
            setLikeCount(likeCount + 1)
          }
        }

        setUserLike(value)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment on stories.",
        variant: "destructive",
      })
      return
    }

    if (!commentText.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Insert the comment
      const { data: commentData, error: commentError } = await supabase
        .from("comments")
        .insert({
          content: commentText,
          story_id: storyId,
          user_id: user.id,
        })
        .select()
        .single()

      if (commentError) throw commentError

      // Fetch the user profile for the comment
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("id", user.id)
        .single()

      if (userError) throw userError

      // Add the new comment with user data to the comments list
      const newComment = {
        ...commentData,
        user: userData,
      }

      setComments([newComment, ...comments])
      setCommentText("")

      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(retryCount + 1)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        <MainNav />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
          <span className="ml-2">Loading story...</span>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        <MainNav />
        <div className="container mx-auto max-w-4xl px-4 py-12 text-center md:px-6">
          <h1 className="text-3xl font-bold">Story Not Found</h1>
          <p className="mt-4 text-gray-400">The story you're looking for doesn't exist or has been removed.</p>
          <div className="mt-6 flex flex-col gap-4 items-center">
            <Button onClick={handleRetry} className="bg-red-600 text-white hover:bg-red-700">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Link href="/stories">
              <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-900">
                Browse Stories
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const authorName = author?.full_name || author?.username || "Anonymous"
  const formattedDate = new Date(story.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <MainNav />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
          <div className="grid gap-8 lg:grid-cols-3">
            <article className="lg:col-span-2">
              <div className="mb-6 space-y-2">
                <h1 className="text-3xl font-bold md:text-4xl">{story.title}</h1>
                <div className="flex items-center gap-2 text-gray-400">
                  <span>By {authorName}</span>
                  <span>•</span>
                  <span>{formattedDate}</span>
                </div>
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300 hover:bg-gray-700"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative mb-8 h-[300px] w-full overflow-hidden rounded-lg sm:h-[400px]">
                <Image
                  src={story.image_url || "/placeholder.svg?height=600&width=1200"}
                  alt={story.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div
                className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white"
                dangerouslySetInnerHTML={{ __html: story.content }}
              />
              <div className="mt-8 flex items-center justify-between border-t border-gray-800 pt-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(1)}
                    className={`flex items-center gap-1 ${userLike === 1 ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                  >
                    <ThumbsUp className="h-5 w-5" />
                    <span>{likeCount}</span>
                  </button>
                  <button
                    onClick={() => handleLike(-1)}
                    className={`flex items-center gap-1 ${userLike === -1 ? "text-blue-500" : "text-gray-400 hover:text-blue-500"}`}
                  >
                    <ThumbsDown className="h-5 w-5" />
                  </button>
                  <button className="flex items-center gap-1 text-gray-400 hover:text-white">
                    <MessageSquare className="h-5 w-5" />
                    <span>{comments.length}</span>
                  </button>
                </div>
                <button className="flex items-center gap-1 text-gray-400 hover:text-white">
                  <Share2 className="h-5 w-5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>

              <section className="mt-12">
                <h2 className="mb-6 text-2xl font-bold">Comments</h2>
                <form onSubmit={handleCommentSubmit} className="mb-8">
                  <Textarea
                    placeholder={user ? "Add a comment..." : "Please log in to comment"}
                    className="mb-2 border-gray-800 bg-gray-950 text-white"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={!user || isSubmitting}
                  />
                  <Button
                    type="submit"
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={!user || !commentText.trim() || isSubmitting}
                  >
                    {isSubmitting ? "Posting..." : "Post Comment"}
                  </Button>
                </form>
                <div className="space-y-6">
                  {comments.length === 0 ? (
                    <p className="text-center text-gray-400">No comments yet. Be the first to comment!</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Avatar>
                            <AvatarImage
                              src={comment.user?.avatar_url || "/placeholder.svg?height=40&width=40"}
                              alt={comment.user?.username || "User"}
                            />
                            <AvatarFallback>{comment.user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {comment.user?.full_name || comment.user?.username || "Anonymous"}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-300">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </article>

            <aside className="space-y-8">
              <StoryStatisticsCard storyId={storyId} />
              <RelatedStories storyId={storyId} />
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

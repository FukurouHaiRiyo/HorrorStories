import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Story, Category, Profile } from "@/types/supabase"
import { fetchAllStories, fetchStoryById } from "./server-actions"

// Client-side functions that use the browser client
export async function getPublishedStories(page = 1, pageSize = 10) {
  const supabase = getSupabaseBrowserClient()
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1

  const { data, error } = await supabase
    .from("stories")
    .select("*, profiles(name, avatar_url)")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range(start, end)

  if (error) {
    console.error("Error fetching published stories:", error)
    return { data: null, error }
  }

  return { data, error: null }
}

// For admin operations that need to bypass RLS, use server actions
export async function getAllStoriesForAdmin() {
  return fetchAllStories()
}

export async function getStoryByIdForAdmin(id: string) {
  return fetchStoryById(id)
}

// Other functions that don't need the service role can continue using the browser client

/**
 * Fetch trending stories using the optimized database function
 */
export async function fetchTrendingStories(days = 7, limit = 5) {
  try {
    const supabase = getSupabaseBrowserClient()

    // Use the optimized database function
    const { data, error } = await supabase.rpc("get_trending_stories", {
      days_limit: days,
      results_limit: limit,
    })

    if (error) throw error

    // Format the data to match our Story type
    const stories = await Promise.all(
      (data || []).map(async (story) => {
        // Fetch author information
        let author = null
        if (story.author_id) {
          const { data: authorData } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url")
            .eq("id", story.author_id)
            .single()

          author = authorData
        }

        return {
          id: story.story_id,
          title: story.title,
          excerpt: story.excerpt,
          image_url: story.image_url,
          author_id: story.author_id,
          created_at: story.created_at,
          view_count: story.view_count,
          likes_count: Number(story.like_count),
          comments_count: Number(story.comment_count),
          author,
          trending_score: story.trending_score,
        } as Story & { trending_score: number }
      }),
    )

    return { data: stories, error: null }
  } catch (error) {
    console.error("Error fetching trending stories:", error)
    return { data: [], error }
  }
}

/**
 * Fetch related stories using the optimized database function
 */
export async function fetchRelatedStories(storyId: string, limit = 3) {
  try {
    const supabase = getSupabaseBrowserClient()

    // Use the optimized database function
    const { data, error } = await supabase.rpc("get_related_stories", {
      story_id_param: storyId,
      limit_param: limit,
    })

    if (error) throw error

    // Format the data to match our Story type
    const stories = await Promise.all(
      (data || []).map(async (story) => {
        // Fetch author information
        let author = null
        if (story.author_id) {
          const { data: authorData } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url")
            .eq("id", story.author_id)
            .single()

          author = authorData
        }

        return {
          id: story.story_id,
          title: story.title,
          excerpt: story.excerpt,
          image_url: story.image_url,
          author_id: story.author_id,
          created_at: story.created_at,
          view_count: story.view_count,
          likes_count: Number(story.like_count),
          comments_count: Number(story.comment_count),
          author,
          relevance_score: story.relevance_score,
        } as Story & { relevance_score: number }
      }),
    )

    return { data: stories, error: null }
  } catch (error) {
    console.error("Error fetching related stories:", error)
    return { data: [], error }
  }
}

/**
 * Optimized function to fetch stories with pagination and filtering
 */
export async function fetchStoriesOptimized(
  options: {
    page?: number
    pageSize?: number
    featured?: boolean
    categoryId?: string
    searchQuery?: string
  } = {},
) {
  const { page = 1, pageSize = 10, featured, categoryId, searchQuery } = options

  try {
    const supabase = getSupabaseBrowserClient()

    // Calculate pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Start building the query
    let query = supabase
      .from("stories")
      .select(`
        id, 
        title, 
        excerpt, 
        content,
        image_url, 
        published, 
        featured, 
        view_count, 
        created_at, 
        updated_at, 
        author_id
      `)
      .eq("published", true)
      .order("created_at", { ascending: false })

    // Add filters
    if (featured !== undefined) {
      query = query.eq("featured", featured)
    }

    if (searchQuery) {
      // Use full text search if available, otherwise use ILIKE
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`)
    }

    // Handle category filtering
    if (categoryId) {
      // Get story IDs in this category first
      const { data: categoryStoryIds, error: categoryError } = await supabase
        .from("story_categories")
        .select("story_id")
        .eq("category_id", categoryId)

      if (categoryError) throw categoryError

      if (!categoryStoryIds || categoryStoryIds.length === 0) {
        return { data: [], count: 0, error: null }
      }

      // Add the story IDs to the query
      query = query.in(
        "id",
        categoryStoryIds.map((item) => item.story_id),
      )
    }

    // Get the count for pagination
    const countQuery = query.clone()
    const { count, error: countError } = await countQuery.count()

    if (countError) throw countError

    // Execute the main query with pagination
    const { data, error } = await query.range(from, to)

    if (error) throw error

    if (!data || data.length === 0) {
      return { data: [], count: 0, error: null }
    }

    // Get all story IDs for batch operations
    const storyIds = data.map((story) => story.id)

    // Batch fetch likes counts
    const { data: likesData, error: likesError } = await supabase
      .from("likes")
      .select("story_id, value")
      .in("story_id", storyIds)
      .eq("value", 1)

    if (likesError) throw likesError

    // Count likes per story
    const likesCountMap = (likesData || []).reduce(
      (acc, like) => {
        acc[like.story_id] = (acc[like.story_id] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Batch fetch comments counts
    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select("story_id")
      .in("story_id", storyIds)

    if (commentsError) throw commentsError

    // Count comments per story
    const commentsCountMap = (commentsData || []).reduce(
      (acc, comment) => {
        acc[comment.story_id] = (acc[comment.story_id] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Get unique author IDs
    const authorIds = [...new Set(data.map((story) => story.author_id).filter(Boolean))]

    // Batch fetch authors
    let authorsMap: Record<string, Profile> = {}
    if (authorIds.length > 0) {
      const { data: authorsData, error: authorsError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", authorIds)

      if (authorsError) throw authorsError

      // Create a map of author ID to author data
      authorsMap = (authorsData || []).reduce(
        (acc, author) => {
          acc[author.id] = author
          return acc
        },
        {} as Record<string, Profile>,
      )
    }

    // Combine all data
    const stories = data.map((story) => ({
      ...story,
      likes_count: likesCountMap[story.id] || 0,
      comments_count: commentsCountMap[story.id] || 0,
      author: story.author_id ? authorsMap[story.author_id] || null : null,
    }))

    return { data: stories, count, error: null }
  } catch (error) {
    console.error("Error in fetchStoriesOptimized:", error)
    return { data: [], count: 0, error }
  }
}

/**
 * Optimized function to fetch a single story with all related data
 */
export async function fetchStoryOptimized(storyId: string) {
  try {
    const supabase = getSupabaseBrowserClient()

    // Fetch the story
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .eq("published", true)
      .single()

    if (storyError) throw storyError

    // Increment view count
    try {
      await supabase.rpc("increment_view_count", { story_id: storyId })
    } catch (viewCountError) {
      console.error("Error incrementing view count:", viewCountError)
      // Continue even if this fails
    }

    // Parallel fetch all related data
    const [authorResult, commentsResult, categoriesResult, likesResult] = await Promise.all([
      // Fetch author
      story.author_id
        ? supabase.from("profiles").select("id, username, full_name, avatar_url").eq("id", story.author_id).single()
        : Promise.resolve({ data: null, error: null }),

      // Fetch comments
      supabase
        .from("comments")
        .select("*")
        .eq("story_id", storyId)
        .order("created_at", { ascending: false }),

      // Fetch categories
      supabase
        .from("story_categories")
        .select("category_id")
        .eq("story_id", storyId),

      // Fetch likes count
      supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("story_id", storyId)
        .eq("value", 1),
    ])

    // Handle any errors
    if (authorResult.error && story.author_id) console.error("Error fetching author:", authorResult.error)
    if (commentsResult.error) throw commentsResult.error
    if (categoriesResult.error) throw categoriesResult.error
    if (likesResult.error) throw likesResult.error

    // Get comment user IDs for batch fetching
    const commentUserIds = [...new Set((commentsResult.data || []).map((comment) => comment.user_id).filter(Boolean))]

    // Batch fetch comment authors
    let commentUsersMap: Record<string, Profile> = {}
    if (commentUserIds.length > 0) {
      const { data: commentUsers, error: commentUsersError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", commentUserIds)

      if (commentUsersError) throw commentUsersError

      // Create a map of user ID to user data
      commentUsersMap = (commentUsers || []).reduce(
        (acc, user) => {
          acc[user.id] = user
          return acc
        },
        {} as Record<string, Profile>,
      )
    }

    // Add user data to comments
    const commentsWithUsers = (commentsResult.data || []).map((comment) => ({
      ...comment,
      user: comment.user_id ? commentUsersMap[comment.user_id] || null : null,
    }))

    // Fetch category details if we have categories
    let categories: Category[] = []
    if (categoriesResult.data && categoriesResult.data.length > 0) {
      const categoryIds = categoriesResult.data.map((link) => link.category_id)

      const { data: categoriesData, error: categoriesDataError } = await supabase
        .from("categories")
        .select("*")
        .in("id", categoryIds)

      if (categoriesDataError) throw categoriesDataError
      categories = categoriesData || []
    }

    // Combine everything
    const storyWithDetails = {
      ...story,
      author: authorResult.data,
      comments: commentsWithUsers,
      categories,
      likes_count: likesResult.count || 0,
      comments_count: commentsWithUsers.length,
    }

    return { data: storyWithDetails, error: null }
  } catch (error) {
    console.error("Error in fetchStoryOptimized:", error)
    return { data: null, error }
  }
}

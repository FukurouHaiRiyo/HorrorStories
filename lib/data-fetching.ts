import { getSupabaseBrowserClient } from "@/lib/supabase"

// Extend Supabase query builder with conditionalFilter
declare module "@supabase/supabase-js" {
  interface PostgrestFilterBuilder<T> {
    conditionalFilter: (column: string, value: any, operator?: string) => PostgrestFilterBuilder<T>
  }
}

// Attach conditionalFilter only in the browser
if (typeof window !== "undefined") {
  try {
    const PostgrestFilterBuilder = Object.getPrototypeOf(
      getSupabaseBrowserClient().from("stories").select("*"),
    ).constructor

    PostgrestFilterBuilder.prototype.conditionalFilter = function (column: string, value: any, operator = "eq") {
      if (value === undefined || value === null) return this
      if (operator === "in" && Array.isArray(value)) {
        if (value.length === 0) return this
        return this.in(column, value)
      }
      if (operator === "or") return this.or(value)
      if (operator === "eq") return this.eq(column, value)
      return this
    }
  } catch (error) {
    console.error("Error setting up conditionalFilter:", error)
  }
}

export async function fetchStories(
  options: {
    page?: number
    pageSize?: number
    featured?: boolean
    categoryId?: string
    searchQuery?: string
  } = {},
  retryCount = 0,
) {
  const { page = 1, pageSize = 10, featured, categoryId, searchQuery } = options

  try {
    const supabase = getSupabaseBrowserClient()
    console.log("Using browser client for fetchStories to respect RLS")

    let storyIds: string[] = []

    if (categoryId) {
      const { data: categoryStoryIds, error: categoryError } = await supabase
        .from("story_categories")
        .select("story_id")
        .eq("category_id", categoryId)

      if (categoryError) throw categoryError
      if (!categoryStoryIds || categoryStoryIds.length === 0) return { data: [], count: 0, error: null }

      storyIds = categoryStoryIds.map(item => item.story_id)
    }

    // Count query
    let countQuery = supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .eq("published", true)

    if (featured !== undefined) countQuery = countQuery.eq("featured", featured)
    if (categoryId && storyIds.length > 0) countQuery = countQuery.in("id", storyIds)
    if (searchQuery) {
      countQuery = countQuery.or(
        `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`,
      )
    }

    const { count, error: countError } = await countQuery
    if (countError) {
      if (retryCount < 2) {
        console.log(`Retrying fetchStories (${retryCount + 1})...`)
        return fetchStories(options, retryCount + 1)
      }
      throw countError
    }

    // Data query
    let dataQuery = supabase
      .from("stories")
      .select("id, title, content, excerpt, image_url, published, featured, view_count, created_at, updated_at, author_id")
      .eq("published", true)

    if (featured !== undefined) dataQuery = dataQuery.eq("featured", featured)
    if (categoryId && storyIds.length > 0) dataQuery = dataQuery.in("id", storyIds)
    if (searchQuery) {
      dataQuery = dataQuery.or(
        `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`,
      )
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data, error } = await dataQuery.order("created_at", { ascending: false }).range(from, to)

    if (error) {
      if (retryCount < 2) {
        console.log(`Retrying fetchStories (${retryCount + 1})...`)
        return fetchStories(options, retryCount + 1)
      }
      throw error
    }

    if (!data || data.length === 0) return { data: [], count: 0, error: null }

    const storyIdsToFetch = data.map(story => story.id)

    // Batch likes
    const { count: likesCount, error: likesError } = await supabase
      .from("likes")
      .select("story_id", { count: "exact" })
      .eq("value", 1)
      .in("story_id", storyIdsToFetch)

    const { data: likesData } = await supabase
      .from("likes")
      .select("story_id")
      .eq("value", 1)
      .in("story_id", storyIdsToFetch)

    const likesMap = likesData?.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.story_id] = (acc[curr.story_id] || 0) + 1
      return acc
    }, {}) ?? {}

    // Batch comments
    const { data: commentsData } = await supabase
      .from("comments")
      .select("story_id")
      .in("story_id", storyIdsToFetch)

    const commentsMap = commentsData?.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.story_id] = (acc[curr.story_id] || 0) + 1
      return acc
    }, {}) ?? {}

    // Batch author fetch
    const uniqueAuthorIds = [...new Set(data.map(story => story.author_id).filter(Boolean))]
    const { data: authorsData } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", uniqueAuthorIds)

    const authorMap = authorsData?.reduce<Record<string, any>>((acc, author) => {
      acc[author.id] = author
      return acc
    }, {}) ?? {}

    const stories = data.map(story => ({
      ...story,
      likes_count: likesMap[story.id] || 0,
      comments_count: commentsMap[story.id] || 0,
      author: authorMap[story.author_id] || null,
    }))

    return { data: stories, count, error: null }
  } catch (error: any) {
    console.error("Error in fetchStories:", error)
    return { data: [], count: 0, error }
  }
}

export async function fetchStory(storyId: string) {
  try {
    const supabase = getSupabaseBrowserClient()
    console.log("Using browser client for fetchStory to respect RLS")

    const { data: story, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .single()

    if (error) throw error
    if (!story) return { data: null, error: new Error("Story not found") }

    try {
      await supabase.rpc("increment_view_count", { story_id: storyId })
    } catch (viewCountError) {
      console.error("Error incrementing view count:", viewCountError)
    }

    const { data: authorData } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .eq("id", story.author_id)
      .single()

    const { data: commentsData } = await supabase
      .from("comments")
      .select("*")
      .eq("story_id", storyId)
      .order("created_at", { ascending: false })

    const commentUserIds = [...new Set((commentsData || []).map(c => c.user_id).filter(Boolean))]
    const { data: commentUsers } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", commentUserIds)

    const commentUserMap = commentUsers?.reduce((acc, user) => {
      acc[user.id] = user
      return acc
    }, {} as Record<string, any>) ?? {}

    const commentsWithAuthors = (commentsData || []).map(comment => ({
      ...comment,
      author: commentUserMap[comment.user_id] || null,
    }))

    return {
      data: {
        ...story,
        author: authorData || null,
        comments: commentsWithAuthors,
      },
      error: null,
    }
  } catch (error: any) {
    console.error("Error in fetchStory:", error)
    return { data: null, error }
  }
}

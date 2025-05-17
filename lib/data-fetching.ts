import { getSupabaseBrowserClient, getServiceClient } from "@/lib/supabase"

// Helper to extend Supabase query with conditional filters
declare module "@supabase/supabase-js" {
  interface PostgrestFilterBuilder<T> {
    conditionalFilter: (column: string, value: any, operator?: string) => PostgrestFilterBuilder<T>
  }
}

// Add conditionalFilter method to PostgrestFilterBuilder prototype
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

      if (operator === "or") {
        return this.or(value)
      }

      if (operator === "eq") {
        return this.eq(column, value)
      }

      return this
    }
  } catch (error) {
    console.error("Error setting up conditionalFilter:", error)
  }
}

// Fetch stories with proper error handling and no circular dependencies
export async function fetchStories(
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
    // Try with service client first for more reliable results
    let supabase
    try {
      supabase = getServiceClient()
      console.log("Using service client for fetchStories")
    } catch (error) {
      console.warn("Service client failed, falling back to browser client:", error)
      supabase = getSupabaseBrowserClient()
    }

    let storyIds: { story_id: string }[] = []

    // Handle category filtering first
    if (categoryId) {
      const { data: categoryStoryIds, error: categoryError } = await supabase
        .from("story_categories")
        .select("story_id")
        .eq("category_id", categoryId)

      if (categoryError) throw categoryError

      if (!categoryStoryIds || categoryStoryIds.length === 0) {
        // No stories in this category
        return { data: [], count: 0, error: null }
      }

      storyIds = categoryStoryIds
    }

    // Build the base query for counting
    let countQuery = supabase.from("stories").select("*", { count: "exact", head: true }).eq("published", true)

    // Add filters to count query
    if (featured !== undefined) {
      countQuery = countQuery.eq("featured", featured)
    }

    if (categoryId && storyIds.length > 0) {
      countQuery = countQuery.in(
        "id",
        storyIds.map((item) => item.story_id),
      )
    }

    if (searchQuery) {
      countQuery = countQuery.or(
        `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`,
      )
    }

    // Get the count
    const { count, error: countError } = await countQuery

    if (countError) throw countError

    // Build the query for fetching data
    let dataQuery = supabase
      .from("stories")
      .select(
        "id, title, content, excerpt, image_url, published, featured, view_count, created_at, updated_at, author_id",
      )
      .eq("published", true)

    // Add filters to data query
    if (featured !== undefined) {
      dataQuery = dataQuery.eq("featured", featured)
    }

    if (categoryId && storyIds.length > 0) {
      dataQuery = dataQuery.in(
        "id",
        storyIds.map((item) => item.story_id),
      )
    }

    if (searchQuery) {
      dataQuery = dataQuery.or(
        `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`,
      )
    }

    // Add pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Execute the query with pagination
    const { data, error } = await dataQuery.order("created_at", { ascending: false }).range(from, to)

    if (error) throw error

    if (!data || data.length === 0) {
      console.log("No stories found in fetchStories")
      return { data: [], count: 0, error: null }
    }

    console.log(`Found ${data.length} stories, fetching additional data...`)

    // Fetch likes and comments counts for each story
    const storiesWithCounts = await Promise.all(
      data.map(async (story) => {
        try {
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
        } catch (countError) {
          console.error("Error fetching counts for story:", countError)
          return {
            ...story,
            likes_count: 0,
            comments_count: 0,
          }
        }
      }),
    )

    // Fetch author information separately to avoid circular dependencies
    const stories = await Promise.all(
      storiesWithCounts.map(async (story) => {
        // Only fetch author if we have an author_id
        if (story.author_id) {
          try {
            const { data: authorData } = await supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url")
              .eq("id", story.author_id)
              .single()

            return {
              ...story,
              author: authorData || null,
            }
          } catch (error) {
            console.error("Error fetching author:", error)
            return {
              ...story,
              author: null,
            }
          }
        }

        return {
          ...story,
          author: null,
        }
      }),
    )

    console.log(`Successfully processed ${stories.length} stories with counts and authors`)
    return { data: stories, count, error: null }
  } catch (error: any) {
    console.error("Error in fetchStories:", error)
    return { data: [], count: 0, error }
  }
}

// Fetch a single story with author and comments
export async function fetchStory(storyId: string) {
  try {
    const supabase = getSupabaseBrowserClient()

    // Fetch the story
    const { data: story, error } = await supabase.from("stories").select("*").eq("id", storyId).single()

    if (error) {
      throw error
    }

    if (!story) {
      return { data: null, error: new Error("Story not found") }
    }

    // Fetch author separately
    let author = null
    if (story.author_id) {
      const { data: authorData } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("id", story.author_id)
        .single()

      author = authorData
    }

    // Fetch comments separately
    const { data: comments } = await supabase
      .from("comments")
      .select("*")
      .eq("story_id", storyId)
      .order("created_at", { ascending: false })

    // Fetch comment authors separately
    const commentsWithAuthors = await Promise.all(
      (comments || []).map(async (comment) => {
        if (comment.user_id) {
          try {
            const { data: userData } = await supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url")
              .eq("id", comment.user_id)
              .single()

            return {
              ...comment,
              user: userData || null,
            }
          } catch (error) {
            console.error("Error fetching comment author:", error)
            return {
              ...comment,
              user: null,
            }
          }
        }

        return {
          ...comment,
          user: null,
        }
      }),
    )

    // Fetch categories
    const { data: categoryLinks } = await supabase
      .from("story_categories")
      .select("category_id")
      .eq("story_id", storyId)

    let categories = []
    if (categoryLinks && categoryLinks.length > 0) {
      const categoryIds = categoryLinks.map((link) => link.category_id)
      const { data: categoriesData } = await supabase.from("categories").select("*").in("id", categoryIds)

      categories = categoriesData || []
    }

    // Get likes count
    const { count: likesCount } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId)
      .eq("value", 1)

    // Combine everything
    const storyWithDetails = {
      ...story,
      author,
      comments: commentsWithAuthors,
      categories,
      likes_count: likesCount || 0,
      comments_count: (commentsWithAuthors || []).length,
    }

    return { data: storyWithDetails, error: null }
  } catch (error) {
    console.error("Error fetching story:", error)
    return { data: null, error }
  }
}

// Fetch categories with story counts
export async function fetchCategories() {
  try {
    const supabase = getSupabaseBrowserClient()

    // Fetch categories
    const { data: categories, error } = await supabase.from("categories").select("*").order("name")

    if (error) {
      throw error
    }

    // Get story counts for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category) => {
        const { count } = await supabase
          .from("story_categories")
          .select("*", { count: "exact", head: true })
          .eq("category_id", category.id)

        return {
          ...category,
          storyCount: count || 0,
        }
      }),
    )

    return { data: categoriesWithCounts, error: null }
  } catch (error) {
    console.error("Error fetching categories:", error)
    return { data: [], error }
  }
}

// Fetch user profile with proper error handling
export async function fetchProfile(userId: string) {
  try {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, bio, role, created_at")
      .eq("id", userId)
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching profile:", error)
    return { data: null, error }
  }
}

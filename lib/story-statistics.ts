import { getSupabaseBrowserClient } from "@/lib/supabase"

/**
 * Fetches comprehensive statistics for a story
 * Respects RLS policies by using the browser client
 */
export async function fetchStoryStatistics(storyId: string) {
  try {
    const supabase = getSupabaseBrowserClient()

    // Fetch the story with basic info
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, title, view_count, created_at, updated_at, author_id")
      .eq("id", storyId)
      .single()

    if (storyError) throw storyError

    // Fetch likes count (positive likes only)
    const { count: likesCount, error: likesError } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId)
      .eq("value", 1)

    if (likesError) throw likesError

    // Fetch dislikes count
    const { count: dislikesCount, error: dislikesError } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId)
      .eq("value", -1)

    if (dislikesError) throw dislikesError

    // Fetch comments count
    const { count: commentsCount, error: commentsError } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId)

    if (commentsError) throw commentsError

    // Calculate engagement metrics
    const totalEngagements = (likesCount || 0) + (dislikesCount || 0) + (commentsCount || 0)
    const engagementRate = story.view_count > 0 ? (totalEngagements / story.view_count) * 100 : 0

    // Return comprehensive statistics
    return {
      story,
      statistics: {
        views: story.view_count,
        likes: likesCount || 0,
        dislikes: dislikesCount || 0,
        comments: commentsCount || 0,
        totalEngagements,
        engagementRate: Number.parseFloat(engagementRate.toFixed(2)),
        likeRatio:
          totalEngagements > 0 ? Number.parseFloat((((likesCount || 0) / totalEngagements) * 100).toFixed(2)) : 0,
      },
      error: null,
    }
  } catch (error: any) {
    console.error("Error fetching story statistics:", error)
    return { story: null, statistics: null, error }
  }
}

/**
 * Fetches related stories based on categories
 * Respects RLS policies by using the browser client
 */
export async function fetchRelatedStories(storyId: string, limit = 3) {
  try {
    const supabase = getSupabaseBrowserClient()

    // First, get the categories for this story
    const { data: storyCategories, error: categoriesError } = await supabase
      .from("story_categories")
      .select("category_id")
      .eq("story_id", storyId)

    if (categoriesError) throw categoriesError

    if (!storyCategories || storyCategories.length === 0) {
      return { data: [], error: null }
    }

    // Get category IDs
    const categoryIds = storyCategories.map((sc) => sc.category_id)

    // Find stories that share these categories, excluding the current story
    const { data: relatedStoryIds, error: relatedError } = await supabase
      .from("story_categories")
      .select("story_id")
      .in("category_id", categoryIds)
      .neq("story_id", storyId)
      .limit(limit * 3) // Fetch more than needed to account for duplicates

    if (relatedError) throw relatedError

    if (!relatedStoryIds || relatedStoryIds.length === 0) {
      return { data: [], error: null }
    }

    // Remove duplicates and limit the number of stories
    const uniqueStoryIds = [...new Set(relatedStoryIds.map((item) => item.story_id))].slice(0, limit)

    // Fetch the actual stories
    const { data: stories, error: storiesError } = await supabase
      .from("stories")
      .select(`
        id, 
        title, 
        excerpt, 
        image_url, 
        created_at, 
        view_count,
        author_id
      `)
      .in("id", uniqueStoryIds)
      .eq("published", true)

    if (storiesError) throw storiesError

    // Fetch additional statistics for each story
    const storiesWithStats = await Promise.all(
      (stories || []).map(async (story) => {
        // Get likes count
        const { count: likesCount } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("story_id", story.id)
          .eq("value", 1)

        // Get comments count
        const { count: commentsCount } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("story_id", story.id)

        return {
          ...story,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
        }
      }),
    )

    return { data: storiesWithStats, error: null }
  } catch (error: any) {
    console.error("Error fetching related stories:", error)
    return { data: [], error }
  }
}

/**
 * Fetches trending stories based on engagement metrics
 * Respects RLS policies by using the browser client
 */
export async function fetchTrendingStories(limit = 5, days = 7) {
  try {
    const supabase = getSupabaseBrowserClient()

    // Calculate the date range for trending (e.g., last 7 days)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateString = startDate.toISOString()

    // Fetch recently published stories
    const { data: stories, error: storiesError } = await supabase
      .from("stories")
      .select(`
        id, 
        title, 
        excerpt, 
        image_url, 
        created_at, 
        view_count,
        author_id
      `)
      .eq("published", true)
      .gte("created_at", startDateString)
      .order("view_count", { ascending: false })
      .limit(limit * 2) // Fetch more than needed to account for filtering

    if (storiesError) throw storiesError

    if (!stories || stories.length === 0) {
      return { data: [], error: null }
    }

    // Fetch engagement metrics for each story
    const storiesWithEngagement = await Promise.all(
      stories.map(async (story) => {
        // Get likes count
        const { count: likesCount } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("story_id", story.id)
          .eq("value", 1)

        // Get comments count
        const { count: commentsCount } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("story_id", story.id)

        // Calculate engagement score (weighted formula)
        const viewWeight = 1
        const likeWeight = 5
        const commentWeight = 10

        const engagementScore =
          story.view_count * viewWeight + (likesCount || 0) * likeWeight + (commentsCount || 0) * commentWeight

        return {
          ...story,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          engagement_score: engagementScore,
        }
      }),
    )

    // Sort by engagement score and limit
    const trendingStories = storiesWithEngagement
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, limit)

    return { data: trendingStories, error: null }
  } catch (error: any) {
    console.error("Error fetching trending stories:", error)
    return { data: [], error }
  }
}

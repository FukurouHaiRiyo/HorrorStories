"use server"

import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Function to get a server-side Supabase client with admin privileges
const getServerClient = () => {
  const cookieStore = cookies()
  return createServerClient(cookieStore)
}

// Admin function to fetch all stories with optional filtering
export async function fetchAllStories({
  limit = 10,
  page = 1,
  categoryId,
  search,
}: {
  limit?: number
  page?: number
  categoryId?: string
  search?: string
} = {}) {
  try {
    const supabase = getServerClient()

    // Calculate offset based on page and limit
    const offset = (page - 1) * limit

    // Start building the query
    let query = supabase
      .from("stories")
      .select("*, categories(*)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Add category filter if provided
    if (categoryId) {
      query = query.eq("category_id", categoryId)
    }

    // Add search filter if provided
    if (search) {
      query = query.ilike("title", `%${search}%`)
    }

    // Execute the query
    const { data: stories, error } = await query

    if (error) {
      console.error("Error fetching stories:", error)
      return { stories: [], error: error.message }
    }

    return { stories, error: null }
  } catch (error) {
    console.error("Error in fetchAllStories:", error)
    return { stories: [], error: "Failed to fetch stories" }
  }
}

// Admin function to get all stories for admin dashboard
export async function getAllStoriesForAdmin() {
  try {
    const supabase = getServerClient()
    const { data: stories, error } = await supabase
      .from("stories")
      .select("*, categories(*)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching stories for admin:", error)
      return { stories: [], error: error.message }
    }

    return { stories, error: null }
  } catch (error) {
    console.error("Error in getAllStoriesForAdmin:", error)
    return { stories: [], error: "Failed to fetch stories for admin" }
  }
}

// Admin function to delete a story
export async function deleteStory(id: string) {
  try {
    const supabase = getServerClient()
    const { error } = await supabase.from("stories").delete().eq("id", id)

    if (error) {
      console.error("Error deleting story:", error)
      return { success: false, error: error.message }
    }

    // Revalidate the admin stories page and the stories page
    revalidatePath("/admin/stories")
    revalidatePath("/stories")

    return { success: true, error: null }
  } catch (error) {
    console.error("Error in deleteStory:", error)
    return { success: false, error: "Failed to delete story" }
  }
}

// Admin function to update a story's featured status
export async function updateStoryFeaturedStatus(id: string, featured: boolean) {
  try {
    const supabase = getServerClient()
    const { error } = await supabase.from("stories").update({ featured }).eq("id", id)

    if (error) {
      console.error("Error updating story featured status:", error)
      return { success: false, error: error.message }
    }

    // Revalidate the admin stories page and the home page
    revalidatePath("/admin/stories")
    revalidatePath("/")

    return { success: true, error: null }
  } catch (error) {
    console.error("Error in updateStoryFeaturedStatus:", error)
    return { success: false, error: "Failed to update story featured status" }
  }
}

// Admin function to update a story's published status
export async function updateStoryPublishedStatus(id: string, published: boolean) {
  try {
    const supabase = getServerClient()
    const { error } = await supabase.from("stories").update({ published }).eq("id", id)

    if (error) {
      console.error("Error updating story published status:", error)
      return { success: false, error: error.message }
    }

    // Revalidate the admin stories page and the stories page
    revalidatePath("/admin/stories")
    revalidatePath("/stories")

    return { success: true, error: null }
  } catch (error) {
    console.error("Error in updateStoryPublishedStatus:", error)
    return { success: false, error: "Failed to update story published status" }
  }
}

// Admin function to run database optimizations
export async function runDatabaseOptimization(optimizationType: string) {
  try {
    const supabase = getServerClient()

    let result

    switch (optimizationType) {
      case "vacuum":
        result = await supabase.rpc("vacuum_analyze_tables")
        break
      case "reindex":
        result = await supabase.rpc("reindex_tables")
        break
      case "analyze":
        result = await supabase.rpc("analyze_tables")
        break
      default:
        return { success: false, error: "Invalid optimization type" }
    }

    if (result.error) {
      console.error(`Error running ${optimizationType}:`, result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error in runDatabaseOptimization:", error)
    return { success: false, error: "Failed to run database optimization" }
  }
}

// Admin function to get database statistics
export async function getDatabaseStatistics() {
  try {
    const supabase = getServerClient()
    const { data, error } = await supabase.rpc("get_database_statistics")

    if (error) {
      console.error("Error getting database statistics:", error)
      return { statistics: null, error: error.message }
    }

    return { statistics: data, error: null }
  } catch (error) {
    console.error("Error in getDatabaseStatistics:", error)
    return { statistics: null, error: "Failed to get database statistics" }
  }
}

"use server"

import { createServerClient } from "./supabase"
import type { Database } from "@/types/supabase"

// Server action to fetch data that requires bypassing RLS
export async function fetchWithServiceRole<T>(
  tableName: keyof Database["public"]["Tables"],
  query: (supabase: ReturnType<typeof createServerClient>) => Promise<{ data: T | null; error: any }>,
): Promise<{ data: T | null; error: any }> {
  try {
    const supabase = createServerClient()
    return await query(supabase)
  } catch (error) {
    console.error(`Error in fetchWithServiceRole for ${tableName}:`, error)
    return { data: null, error }
  }
}

// Add the missing fetchAllStories export
export async function fetchAllStories(options?: {
  limit?: number
  page?: number
  categoryId?: string
  searchQuery?: string
}) {
  const limit = options?.limit || 10
  const page = options?.page || 1
  const offset = (page - 1) * limit

  let query = createServerClient()
    .from("stories")
    .select("*, categories(*)")
    .order("created_at", { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1)

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId)
  }

  if (options?.searchQuery) {
    query = query.ilike("title", `%${options.searchQuery}%`)
  }

  return query
}

// Example server action to fetch all stories (bypassing RLS)
export async function getAllStoriesForAdmin() {
  return fetchWithServiceRole("stories", (supabase) =>
    supabase.from("stories").select("*").order("created_at", { ascending: false }),
  )
}

// Example server action to fetch story by ID (bypassing RLS)
export async function fetchStoryById(id: string) {
  return fetchWithServiceRole("stories", (supabase) => supabase.from("stories").select("*").eq("id", id).single())
}

// Add more server actions as needed for operations that require the service role

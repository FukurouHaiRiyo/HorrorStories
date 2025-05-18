"use server"

import { createServerClient } from "@/lib/supabase"

export async function runVacuum() {
  try {
    const supabase = createServerClient()

    // Run VACUUM operation
    const { data, error } = await supabase.rpc("run_vacuum")

    if (error) {
      throw new Error(`Failed to run VACUUM: ${error.message}`)
    }

    return { success: true, message: "VACUUM operation completed successfully" }
  } catch (error) {
    console.error("Error running VACUUM:", error)
    return { success: false, message: error instanceof Error ? error.message : "Unknown error occurred" }
  }
}

export async function analyzeDatabase() {
  try {
    const supabase = createServerClient()

    // Run ANALYZE operation
    const { data, error } = await supabase.rpc("run_analyze")

    if (error) {
      throw new Error(`Failed to run ANALYZE: ${error.message}`)
    }

    return { success: true, message: "ANALYZE operation completed successfully" }
  } catch (error) {
    console.error("Error running ANALYZE:", error)
    return { success: false, message: error instanceof Error ? error.message : "Unknown error occurred" }
  }
}

export async function reindexDatabase() {
  try {
    const supabase = createServerClient()

    // Run REINDEX operation
    const { data, error } = await supabase.rpc("run_reindex")

    if (error) {
      throw new Error(`Failed to run REINDEX: ${error.message}`)
    }

    return { success: true, message: "REINDEX operation completed successfully" }
  } catch (error) {
    console.error("Error running REINDEX:", error)
    return { success: false, message: error instanceof Error ? error.message : "Unknown error occurred" }
  }
}

export async function getDatabaseStats() {
  try {
    const supabase = createServerClient()

    // Get database statistics
    const { data, error } = await supabase.rpc("get_database_stats")

    if (error) {
      throw new Error(`Failed to get database stats: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error getting database stats:", error)
    return { success: false, message: error instanceof Error ? error.message : "Unknown error occurred" }
  }
}

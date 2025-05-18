"use server"

import { createServerClient } from "@/lib/supabase"

export async function runVacuum() {
  try {
    const supabase = createServerClient()

    // Call the RPC function to run VACUUM
    const { data, error } = await supabase.rpc("vacuum_analyze_tables")

    if (error) {
      throw new Error(`Failed to run VACUUM: ${error.message}`)
    }

    return { success: true, message: "VACUUM operation completed successfully" }
  } catch (error) {
    console.error("Error running VACUUM:", error)
    return {
      success: false,
      message: "Failed to run VACUUM operation",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function analyzeDatabase() {
  try {
    const supabase = createServerClient()

    // Call the RPC function to run ANALYZE
    const { data, error } = await supabase.rpc("analyze_tables")

    if (error) {
      throw new Error(`Failed to run ANALYZE: ${error.message}`)
    }

    return { success: true, message: "ANALYZE operation completed successfully" }
  } catch (error) {
    console.error("Error running ANALYZE:", error)
    return {
      success: false,
      message: "Failed to run ANALYZE operation",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function reindexDatabase() {
  try {
    const supabase = createServerClient()

    // Call the RPC function to run REINDEX
    const { data, error } = await supabase.rpc("reindex_tables")

    if (error) {
      throw new Error(`Failed to run REINDEX: ${error.message}`)
    }

    return { success: true, message: "REINDEX operation completed successfully" }
  } catch (error) {
    console.error("Error running REINDEX:", error)
    return {
      success: false,
      message: "Failed to run REINDEX operation",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function runDatabaseOptimizations() {
  try {
    // Run all optimizations in sequence
    const vacuumResult = await runVacuum()
    const analyzeResult = await analyzeDatabase()
    const reindexResult = await reindexDatabase()

    // Check if all operations were successful
    const allSuccessful = vacuumResult.success && analyzeResult.success && reindexResult.success

    return {
      success: allSuccessful,
      message: "Database optimizations completed",
      details: {
        vacuum: vacuumResult,
        analyze: analyzeResult,
        reindex: reindexResult,
      },
    }
  } catch (error) {
    console.error("Error running database optimizations:", error)
    return {
      success: false,
      message: "Failed to run database optimizations",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

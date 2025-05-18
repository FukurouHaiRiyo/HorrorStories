import { getSupabaseBrowserClient, getServiceClient } from "@/lib/supabase"

/**
 * Checks if a user has admin role in the database
 * This bypasses the auth context and directly queries the database
 */
export async function checkAdminStatus(userId: string) {
  try {
    console.log("Checking admin status for user:", userId)

    // Try with service client first (most reliable)
    try {
      const serviceClient = getServiceClient()
      const { data, error } = await serviceClient.from("profiles").select("role").eq("id", userId).single()

      if (error) throw error

      console.log("Admin check result (service client):", data)
      return data?.role === "admin"
    } catch (serviceError) {
      console.error("Service client admin check failed:", serviceError)
    }

    // Fall back to browser client
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single()

    if (error) throw error

    console.log("Admin check result (browser client):", data)
    return data?.role === "admin"
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

/**
 * Updates a user's admin status in the database
 */
export async function setAdminStatus(userId: string, isAdmin: boolean) {
  try {
    console.log(`Setting admin status for user ${userId} to ${isAdmin}`)

    // Try with service client first
    try {
      const serviceClient = getServiceClient()
      const { data, error } = await serviceClient
        .from("profiles")
        .update({ role: isAdmin ? "admin" : "user" })
        .eq("id", userId)
        .select()
        .single()

      if (error) throw error

      console.log("Admin status update result (service client):", data)
      return { success: true, data }
    } catch (serviceError) {
      console.error("Service client admin update failed:", serviceError)
    }

    // Fall back to browser client
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: isAdmin ? "admin" : "user" })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    console.log("Admin status update result (browser client):", data)
    return { success: true, data }
  } catch (error) {
    console.error("Error updating admin status:", error)
    return { success: false, error }
  }
}

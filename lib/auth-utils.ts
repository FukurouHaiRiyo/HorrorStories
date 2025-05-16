import { getSupabaseBrowserClient } from "@/lib/supabase"

// Check if the current user is an admin
export async function isUserAdmin() {
  try {
    const supabase = getSupabaseBrowserClient()

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return false
    }

    // Check if the role is in the JWT
    const role = session.user?.app_metadata?.role
    if (role === "admin") {
      return true
    }

    // If not in JWT, check the profiles table
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    return profile?.role === "admin"
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

// Update user metadata to include role
export async function updateUserRole(userId: string, role: string) {
  try {
    const supabase = getSupabaseBrowserClient()

    // First update the profiles table
    const { error: profileError } = await supabase.from("profiles").update({ role }).eq("id", userId)

    if (profileError) {
      throw profileError
    }

    // For a complete solution, you would also update the user's JWT
    // This typically requires a server-side function or API endpoint
    // that calls the Supabase admin API

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating user role:", error)
    return { success: false, error }
  }
}

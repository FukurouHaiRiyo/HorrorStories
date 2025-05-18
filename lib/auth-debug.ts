/**
 * Utility functions for debugging authentication issues
 */

// Check if localStorage has a Supabase session
export function checkLocalStorageForSession() {
  if (typeof window === "undefined") return null

  try {
    // Check for Supabase session in localStorage
    const storageKey = "supabase_auth_token"
    const sessionStr = localStorage.getItem(storageKey)

    if (!sessionStr) {
      console.log("No Supabase session found in localStorage")
      return null
    }

    // Parse the session data
    const sessionData = JSON.parse(sessionStr)

    return {
      hasSession: true,
      expiresAt: sessionData?.expiresAt,
      user: {
        id: sessionData?.user?.id,
        email: sessionData?.user?.email,
      },
    }
  } catch (error) {
    console.error("Error checking localStorage for session:", error)
    return null
  }
}

// Log auth debug info to console
export function logAuthDebugInfo(authState: any) {
  console.group("Auth Debug Info")
  console.log("Auth State:", authState)
  console.log("LocalStorage Session:", checkLocalStorageForSession())
  console.log("Current URL:", typeof window !== "undefined" ? window.location.href : "SSR")
  console.groupEnd()
}

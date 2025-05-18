import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a single supabase client for the browser
const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL and anon key are required. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables.",
    )
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // Ensure sessions are persisted
      storageKey: "supabase_auth_token", // Specify the storage key
      storage: typeof window !== "undefined" ? localStorage : undefined, // Use localStorage when available
      autoRefreshToken: true, // Auto refresh the token
    },
  })
}

// For server components - using service role to bypass RLS
export const createServerClient = () => {
  // This should only be used in server components or server actions
  if (typeof window !== "undefined") {
    console.error("createServerClient should not be called from client-side code")
    // Return a browser client instead for safety
    return createBrowserClient()
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Supabase URL and service key are required. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment variables.",
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })
}

// For client components (singleton pattern to prevent multiple instances)
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export const getSupabaseBrowserClient = () => {
  if (!browserClient && typeof window !== "undefined") {
    browserClient = createBrowserClient()
  }
  return browserClient!
}

// IMPORTANT: This function has been removed for security reasons
// DO NOT use service role key in client-side code
export const getServiceClient = () => {
  // For client-side code, always return the browser client
  if (typeof window !== "undefined") {
    console.warn("getServiceClient called from client-side code - returning browser client instead")
    return getSupabaseBrowserClient()
  }

  // For server-side code, use createServerClient
  return createServerClient()
}

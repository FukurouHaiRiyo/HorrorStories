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

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// For server components - using service role to bypass RLS
export const createServerClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

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
  if (!browserClient) {
    browserClient = createBrowserClient()
  }
  return browserClient
}

// Create a service client that bypasses RLS for client components
// This should be used ONLY for read operations where RLS is causing issues
let serviceClient: ReturnType<typeof createServerClient> | null = null

export const getServiceClient = () => {
  // For client-side code, we need to be careful with service role keys
  // Only use this for read operations that need to bypass RLS
  if (typeof window !== "undefined") {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

      console.log("Service client env vars available:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
      })

      if (!supabaseUrl || !supabaseServiceKey) {
        console.warn("Missing environment variables for service client, falling back to browser client")
        return getSupabaseBrowserClient()
      }

      if (!serviceClient) {
        serviceClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
          auth: {
            persistSession: false,
          },
        })
      }
      return serviceClient
    } catch (error) {
      console.error("Failed to create service client:", error)
      return getSupabaseBrowserClient()
    }
  } else {
    // For server-side code, use createServerClient
    return createServerClient()
  }
}

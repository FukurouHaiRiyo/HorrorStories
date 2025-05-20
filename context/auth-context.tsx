"use client"

import React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"

import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Profile } from "@/types/supabase"

// Update the type definition to include isAuthReady
type AuthContextType = {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  isAuthReady: boolean
  isAdmin: boolean
  signUp: (email: string, password: string, userData: any) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  error: string | null
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseBrowserClient> | null>(null)
  const router = useRouter()
  const [isAuthReady, setIsAuthReady] = useState(false)

  // Initialize Supabase client
  useEffect(() => {
    try {
      console.log("Initializing Supabase client")
      if (typeof window !== "undefined") {
        const client = getSupabaseBrowserClient()
        setSupabase(client)
      }
    } catch (err: any) {
      console.error("Failed to initialize Supabase client:", err.message)
      setError(err.message)
      setIsLoading(false)
      setIsAuthReady(true) // Mark auth as ready even if there's an error
    }
  }, [])

  // Helper function to fetch user profile - memoized with useCallback
  const fetchUserProfile = useCallback(
    async (userId: string) => {
      if (!supabase) return null

      console.log("Fetching profile for user:", userId)

      try {
        // Use the browser client with proper authentication
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, bio, role, created_at, updated_at")
          .eq("id", userId)
          .single()

        if (profileError) {
          console.error("Error fetching profile:", profileError.message)
          return null
        }

        if (data) {
          console.log("Profile fetched successfully:", data)
          const profileData = {
            ...data,
            bio: data.bio ?? null,
            created_at: data.created_at ?? "",
            updated_at: data.updated_at ?? "",
          }
          setProfile(profileData)
          return profileData
        }

        return null
      } catch (err: any) {
        console.error("Error in profile fetch:", err.message)
        return null
      }
    },
    [supabase],
  )

  // Refresh profile function that can be called from components
  const refreshProfile = useCallback(async () => {
    if (!user || !supabase) return

    console.log("Manually refreshing profile for user:", user.id)
    await fetchUserProfile(user.id)
  }, [user, supabase, fetchUserProfile])

  // Set up auth state listener and fetch initial session
  useEffect(() => {
    if (!supabase) {
      console.log("Supabase client not initialized yet")
      return
    }

    console.log("Setting up auth state listener")
    let isMounted = true

    // Update the fetchSession function to set isAuthReady when complete
    const fetchSession = async () => {
      try {
        console.log("Fetching initial session")
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError.message)
          throw sessionError
        }

        console.log("Session fetched:", session ? "Session exists" : "No session")

        if (isMounted) {
          setSession(session)
          setUser(session?.user ?? null)

          // Only fetch profile if we have a user
          if (session?.user) {
            await fetchUserProfile(session.user.id)
          } else {
            console.log("No user in session, skipping profile fetch")
            setProfile(null)
          }
        }
      } catch (err: any) {
        console.error("Error fetching session:", err.message)
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        // Always set auth as ready, even if there was an error
        if (isMounted) {
          setIsLoading(false)
          setIsAuthReady(true)
          console.log("Auth initialization complete, isAuthReady set to true")
        }
      }
    }

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event, newSession?.user?.email)

      if (isMounted) {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          await fetchUserProfile(newSession.user.id)
        } else {
          console.log("No user in session after auth change, clearing profile")
          setProfile(null)
        }

        setIsLoading(false)
        setIsAuthReady(true)
      }
    })

    // Fetch the initial session
    fetchSession()

    // Cleanup function
    return () => {
      console.log("Cleaning up auth subscription")
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserProfile])

  // Add a navigation event listener to ensure auth state is preserved
  useEffect(() => {
    if (typeof window === "undefined" || !supabase) return

    const handleRouteChange = async () => {
      console.log("Route changed, checking auth state")

      // If we already have a user, no need to refetch
      if (user) return

      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        if (currentSession?.user && !user) {
          console.log("Found session after navigation, restoring user state")
          setUser(currentSession.user)
          setSession(currentSession)
          await fetchUserProfile(currentSession.user.id)
        }
      } catch (err) {
        console.error("Error checking session after navigation:", err)
      }
    }

    // Listen for route changes
    window.addEventListener("popstate", handleRouteChange)

    return () => {
      window.removeEventListener("popstate", handleRouteChange)
    }
  }, [supabase, user, fetchUserProfile])

  const signUp = useCallback(
    async (email: string, password: string, userData: any) => {
      if (!supabase) {
        const error = new Error("Supabase client not initialized")
        setError(error.message)
        throw error
      }

      try {
        console.log("Signing up user:", email)
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData,
          },
        })

        if (error) throw error
        setError(null)
      } catch (err: any) {
        console.error("Error signing up:", err.message)
        setError(err.message)
        throw err
      }
    },
    [supabase],
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        const error = new Error("Supabase client not initialized")
        setError(error.message)
        throw error
      }

      try {
        console.log("Signing in with:", email)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        console.log("Sign in successful:", data.user?.email)

        // Immediately fetch the user profile after sign in
        if (data.user) {
          setUser(data.user)
          setSession(data.session)
          await fetchUserProfile(data.user.id)
        }

        setError(null)
        router.refresh()
      } catch (err: any) {
        console.error("Error signing in:", err.message)
        setError(err.message)
        throw err
      }
    },
    [supabase, router, fetchUserProfile],
  )

  const signOut = useCallback(async () => {
  if (!supabase) {
    const error = new Error("Supabase client not initialized")
    setError(error.message)
    throw error
  }

  try {
    console.log("Signing out")
    setIsAuthReady(false) // Prevents redirection issues by delaying until state resets
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    console.log("Signed out successfully")
    setError(null)
    setUser(null)
    setProfile(null)
    setSession(null)

    // Delay slightly to ensure state updates propagate
    setTimeout(() => {
      setIsAuthReady(true)
      router.refresh()
      router.push("/")
    }, 10000) // adjust delay as needed
  } catch (err: any) {
    console.error("Error signing out:", err.message)
    setError(err.message)
    setIsAuthReady(true) // Ensure UI doesn't get stuck
    throw err
  }
}, [supabase, router])

  // Check if user is admin from profile or JWT
  const isAdmin = React.useMemo(() => {
    const profileIsAdmin = profile?.role === "admin"
    const metadataIsAdmin = user?.app_metadata?.role === "admin"

    console.log("Admin check:", {
      profileRole: profile?.role,
      metadataRole: user?.app_metadata?.role,
      profileIsAdmin,
      metadataIsAdmin,
      userId: user?.id,
      email: user?.email,
    })

    return profileIsAdmin || metadataIsAdmin
  }, [profile, user])

  // Add isAuthReady to the context value
  const contextValue = React.useMemo(
    () => ({
      user,
      profile,
      session,
      isLoading,
      isAuthReady,
      isAdmin,
      signUp,
      signIn,
      signOut,
      error,
      refreshProfile,
    }),
    [user, profile, session, isLoading, isAuthReady, isAdmin, signUp, signIn, signOut, error, refreshProfile],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

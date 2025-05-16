"use client"

import React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"

import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Profile } from "@/types/supabase"

type AuthContextType = {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
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

  // Initialize Supabase client
  useEffect(() => {
    try {
      console.log("Initializing Supabase client")
      const client = getSupabaseBrowserClient()
      setSupabase(client)
    } catch (err: any) {
      console.error("Failed to initialize Supabase client:", err.message)
      setError(err.message)
      setIsLoading(false)
    }
  }, [])

  // Helper function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
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
  }

  // Refresh profile function that can be called from components
  const refreshProfile = async () => {
    if (!user || !supabase) return

    console.log("Manually refreshing profile for user:", user.id)
    await fetchUserProfile(user.id)
  }

  // Set up auth state listener and fetch initial session
  useEffect(() => {
    if (!supabase) {
      console.log("Supabase client not initialized yet")
      return
    }

    console.log("Setting up auth state listener")

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

        setSession(session)
        setUser(session?.user ?? null)

        // Only fetch profile if we have a user
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          console.log("No user in session, skipping profile fetch")
        }
      } catch (err: any) {
        console.error("Error fetching session:", err.message)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        console.log("No user in session after auth change, clearing profile")
        setProfile(null)
      }

      setIsLoading(false)
    })

    return () => {
      console.log("Cleaning up auth subscription")
      subscription.unsubscribe()
    }
  }, [supabase])

  const signUp = async (email: string, password: string, userData: any) => {
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
  }

  const signIn = async (email: string, password: string) => {
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
        await fetchUserProfile(data.user.id)
      }

      setError(null)
      router.refresh()
    } catch (err: any) {
      console.error("Error signing in:", err.message)
      setError(err.message)
      throw err
    }
  }

  const signOut = async () => {
    if (!supabase) {
      const error = new Error("Supabase client not initialized")
      setError(error.message)
      throw error
    }

    try {
      console.log("Signing out")
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      console.log("Signed out successfully")
      setError(null)
      setUser(null)
      setProfile(null)
      setSession(null)
      router.refresh()
      router.push("/")
    } catch (err: any) {
      console.error("Error signing out:", err.message)
      setError(err.message)
      throw err
    }
  }

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

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAdmin,
        signUp,
        signIn,
        signOut,
        error,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { MainNav } from "@/components/main-nav"

export default function AuthDebugPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [authState, setAuthState] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  const supabase = getSupabaseBrowserClient()

  // Check auth state on load and every refresh
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      try {
        // Get session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        // Get user
        const { data: userData, error: userError } = await supabase.auth.getUser()

        // If we have a user, try to get their profile
        let profileData = null
        let profileError = null

        if (userData?.user) {
          const { data, error } = await supabase.from("profiles").select("*").eq("id", userData.user.id).single()

          profileData = data
          profileError = error
        }

        setAuthState({
          session: {
            data: sessionData,
            error: sessionError ? sessionError.message : null,
          },
          user: {
            data: userData,
            error: userError ? userError.message : null,
          },
          profile: {
            data: profileData,
            error: profileError ? profileError.message : null,
          },
          timestamp: new Date().toISOString(),
          refreshCount,
        })
      } catch (error: any) {
        console.error("Error checking auth:", error)
        setAuthState({
          error: error.message,
          timestamp: new Date().toISOString(),
          refreshCount,
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [supabase, refreshCount])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigningIn(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Signed in successfully",
        description: `Signed in as ${data.user.email}`,
      })

      // Refresh auth state
      setRefreshCount((prev) => prev + 1)
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Signed out successfully",
      })

      // Refresh auth state
      setRefreshCount((prev) => prev + 1)
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const refreshAuthState = () => {
    setRefreshCount((prev) => prev + 1)
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <MainNav />
      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6">
          <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-6">
                <h2 className="text-xl font-bold mb-4">Authentication State</h2>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-red-500" />
                    <span className="ml-2">Loading auth state...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-1">Status</h3>
                      <p className="text-sm">
                        {authState?.user?.data?.user ? (
                          <span className="text-green-500">Authenticated</span>
                        ) : (
                          <span className="text-red-500">Not authenticated</span>
                        )}
                      </p>
                    </div>

                    {authState?.user?.data?.user && (
                      <>
                        <div>
                          <h3 className="font-semibold mb-1">User</h3>
                          <p className="text-sm">ID: {authState.user.data.user.id}</p>
                          <p className="text-sm">Email: {authState.user.data.user.email}</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">Profile</h3>
                          {authState.profile.data ? (
                            <>
                              <p className="text-sm">Username: {authState.profile.data.username || "Not set"}</p>
                              <p className="text-sm">Role: {authState.profile.data.role || "Not set"}</p>
                            </>
                          ) : (
                            <p className="text-sm text-red-500">Profile not found: {authState.profile.error}</p>
                          )}
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">JWT Metadata</h3>
                          <p className="text-sm">
                            App Metadata: {JSON.stringify(authState.user.data.user.app_metadata || {})}
                          </p>
                          <p className="text-sm">
                            User Metadata: {JSON.stringify(authState.user.data.user.user_metadata || {})}
                          </p>
                        </div>
                      </>
                    )}

                    <div>
                      <h3 className="font-semibold mb-1">Debug Info</h3>
                      <p className="text-sm">Last updated: {authState?.timestamp}</p>
                      <p className="text-sm">Refresh count: {authState?.refreshCount}</p>
                    </div>

                    <div className="flex space-x-4">
                      <Button onClick={refreshAuthState} className="bg-blue-600 hover:bg-blue-700">
                        Refresh State
                      </Button>

                      {authState?.user?.data?.user && (
                        <Button onClick={handleSignOut} className="bg-red-600 hover:bg-red-700">
                          Sign Out
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-800 bg-gray-950 p-6">
                <h2 className="text-xl font-bold mb-4">Navigation</h2>
                <div className="space-y-4">
                  <Button onClick={() => router.push("/admin")} className="w-full bg-red-600 hover:bg-red-700">
                    Try Admin Page
                  </Button>
                  <Button onClick={() => router.push("/debug")} className="w-full bg-blue-600 hover:bg-blue-700">
                    Go to Role Debug
                  </Button>
                  <Button onClick={() => router.push("/")} variant="outline" className="w-full">
                    Go to Homepage
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {!authState?.user?.data?.user && (
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-6">
                  <h2 className="text-xl font-bold mb-4">Sign In</h2>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-gray-800 bg-gray-900 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-gray-800 bg-gray-900 text-white"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSigningIn}>
                      {isSigningIn ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </div>
              )}

              <div className="rounded-lg border border-gray-800 bg-gray-950 p-6">
                <h2 className="text-xl font-bold mb-4">Raw Auth State</h2>
                <div className="overflow-auto max-h-[400px] bg-gray-900 p-4 rounded-md">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap">{JSON.stringify(authState, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

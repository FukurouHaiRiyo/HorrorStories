"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { MainNav } from "@/components/main-nav"
import { checkAdminStatus, setAdminStatus } from "@/lib/admin-utils"

export default function DebugPage() {
  const router = useRouter()
  const { user, profile, isAdmin, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [directAdminCheck, setDirectAdminCheck] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (user) {
      handleCheckAdmin()
    }
  }, [user])

  const handleCheckAdmin = async () => {
    if (!user) return

    setIsChecking(true)
    try {
      const isAdminDirect = await checkAdminStatus(user.id)
      setDirectAdminCheck(isAdminDirect)
    } catch (error) {
      console.error("Error checking admin status:", error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleSetAdmin = async (makeAdmin: boolean) => {
    if (!user) return

    setIsUpdating(true)
    try {
      const result = await setAdminStatus(user.id, makeAdmin)

      if (result.success) {
        toast({
          title: "Admin status updated",
          description: `User is now ${makeAdmin ? "an admin" : "a regular user"}`,
        })

        // Refresh the check
        await handleCheckAdmin()

        // Force a page refresh to update auth context
        window.location.reload()
      } else {
        toast({
          title: "Update failed",
          description: "Could not update admin status",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        <p className="mt-2">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        <MainNav />
        <div className="container flex flex-1 items-center justify-center px-4 py-12 md:px-6">
          <div className="mx-auto w-full max-w-md space-y-6 text-center">
            <h1 className="text-3xl font-bold">Authentication Required</h1>
            <p className="text-gray-400">Please log in to access the debug page.</p>
            <Button onClick={() => router.push("/login")} className="bg-red-600 text-white hover:bg-red-700">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <MainNav />
      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6">
          <h1 className="text-3xl font-bold mb-8">Admin Debug Page</h1>

          <div className="space-y-8">
            <div className="rounded-lg border border-gray-800 bg-gray-950 p-6">
              <h2 className="text-xl font-bold mb-4">User Information</h2>
              <div className="space-y-2">
                <p>
                  <strong>User ID:</strong> {user.id}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Auth Context isAdmin:</strong> {isAdmin ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Profile Role:</strong> {profile?.role || "Not set"}
                </p>
                <p>
                  <strong>Direct DB Check:</strong>{" "}
                  {isChecking ? (
                    <Loader2 className="inline h-4 w-4 animate-spin ml-2" />
                  ) : directAdminCheck === null ? (
                    "Not checked"
                  ) : directAdminCheck ? (
                    "Admin"
                  ) : (
                    "Not Admin"
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-6">
              <h2 className="text-xl font-bold mb-4">Admin Actions</h2>
              <div className="space-y-4">
                <Button onClick={handleCheckAdmin} disabled={isChecking} className="bg-blue-600 hover:bg-blue-700 mr-4">
                  {isChecking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Check Admin Status"
                  )}
                </Button>

                <div className="flex space-x-4">
                  <Button
                    onClick={() => handleSetAdmin(true)}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting...
                      </>
                    ) : (
                      "Make Admin"
                    )}
                  </Button>

                  <Button
                    onClick={() => handleSetAdmin(false)}
                    disabled={isUpdating}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting...
                      </>
                    ) : (
                      "Remove Admin"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-6">
              <h2 className="text-xl font-bold mb-4">JWT Information</h2>
              <div className="space-y-2">
                <p>
                  <strong>App Metadata:</strong> {JSON.stringify(user.app_metadata || {})}
                </p>
                <p>
                  <strong>User Metadata:</strong> {JSON.stringify(user.user_metadata || {})}
                </p>
                <p className="text-yellow-500 text-sm mt-4">
                  Note: The role in app_metadata may not match the database. This is normal if the role was updated
                  directly in the database.
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button onClick={() => router.push("/admin")} className="bg-red-600 hover:bg-red-700">
                Try Admin Page
              </Button>

              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

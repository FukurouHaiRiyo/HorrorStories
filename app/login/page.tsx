"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { MainNav } from "@/components/main-nav"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams?.get("redirect") || "/"
  const { toast } = useToast()
  const { signIn, user, isLoading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [debugInfo, setDebugInfo] = useState("")

  // If already logged in, redirect
  useEffect(() => {
    if (!authLoading && user) {
      console.log("User already logged in, redirecting to:", redirect)
      router.push(redirect)
    }
  }, [user, authLoading, router, redirect])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setDebugInfo("Attempting login...")

    try {
      await signIn(formData.email, formData.password)

      setDebugInfo("Login successful, preparing to redirect...")

      toast({
        title: "Login successful",
        description: "Welcome back to NightmareNarrator!",
      })

      // Add a small delay to ensure auth state is updated
      setTimeout(() => {
        router.push(redirect)
      }, 500)
    } catch (error: any) {
      setDebugInfo(`Login failed: ${error.message}`)

      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Suspense fallback={<div>Loading login...</div>}>
      <div className="flex min-h-screen flex-col bg-black text-white">
        <MainNav />
        <div className="container flex flex-1 items-center justify-center px-4 py-12 md:px-6">
          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold">Login</h1>
              <p className="text-gray-400">Enter your credentials to access your account</p>
            </div>
            <div className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    className="border-gray-800 bg-gray-950 text-white"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-red-500 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="border-gray-800 bg-gray-950 pr-10 text-white"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-red-600 text-white hover:bg-red-700" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-red-500 hover:underline">
                  Sign up
                </Link>
              </div>

              {/* Debug section */}
              {debugInfo && (
                <div className="mt-4 p-3 bg-gray-900 rounded-md border border-gray-800">
                  <p className="text-xs text-gray-400">Debug info:</p>
                  <p className="text-xs text-gray-300">{debugInfo}</p>
                </div>
              )}

              <div className="flex justify-center space-x-4 mt-4">
                <Button variant="outline" size="sm" onClick={() => router.push("/auth-debug")} className="text-xs">
                  Auth Debug
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push("/")} className="text-xs">
                  Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { AuthProvider, useAuth } from "@/context/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ErrorDisplay } from "@/components/error-display"

// Wrapper component to access auth context
function AppContent({ children }: { children: React.ReactNode }) {
  const { error, isLoading, isAuthReady } = useAuth()
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Set a timeout to show loading indicator only if it takes too long
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && !isAuthReady) {
        setLoadingTimeout(true)
      }
    }, 4000) // Wait 2 seconds before showing loading indicator

    return () => clearTimeout(timer)
  }, [isLoading, isAuthReady])

  if (error) {
    return (
      <ErrorDisplay
        title="Configuration Error"
        message={`There was a problem initializing the application: ${error}`}
        showHomeLink={false}
      />
    )
  }

  // Show a loading indicator only if loading takes more than 2 seconds
  if (isLoading && !isAuthReady && loadingTimeout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        <p className="mt-4 text-gray-400">Loading application...</p>
        <p className="mt-2 text-xs text-gray-500">If this takes too long, try refreshing the page</p>
      </div>
    )
  }

  // Proceed with rendering children even if auth is still initializing
  // This allows the page to render while auth is being checked in the background
  return children
}

// Update the ClientLayout component to include the AuthDebugIndicator
export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // This state is used to prevent hydration mismatch
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        {mounted ? <AppContent>{children}</AppContent> : <div style={{ visibility: "hidden" }}>{children}</div>}
        <Toaster />
        {/* <AuthDebugIndicator /> */}
      </AuthProvider>
    </ThemeProvider>
  )
}

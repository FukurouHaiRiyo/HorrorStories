"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { AuthProvider, useAuth } from "@/context/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ErrorDisplay } from "@/components/error-display"

// Wrapper component to access auth context
function AppContent({ children }: { children: React.ReactNode }) {
  const { error } = useAuth()

  if (error) {
    return (
      <ErrorDisplay
        title="Configuration Error"
        message={`There was a problem initializing the application: ${error}`}
        showHomeLink={false}
      />
    )
  }

  return children
}

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
      </AuthProvider>
    </ThemeProvider>
  )
}

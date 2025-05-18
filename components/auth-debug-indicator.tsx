"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"

export function AuthDebugIndicator() {
  const { isLoading, isAuthReady, user, profile, session } = useAuth()
  const [showDebug, setShowDebug] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Only show in development
  useEffect(() => {
    setShowDebug(process.env.NODE_ENV === "development")
  }, [])

  if (!showDebug) return null

  return (
    <div
      className="fixed bottom-2 right-2 z-50 rounded-md bg-gray-900 p-2 text-xs text-white opacity-70 hover:opacity-100 transition-all"
      style={{ maxWidth: expanded ? "400px" : "200px" }}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold">Auth Debug</span>
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-white">
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>
      <div>Auth: {isAuthReady ? "✅ Ready" : "⏳ Loading"}</div>
      <div>Loading: {isLoading ? "⏳ Yes" : "✅ No"}</div>
      <div>User: {user ? "✅ " + user.email : "❌ None"}</div>
      <div>Profile: {profile ? "✅ " + profile.role : "❌ None"}</div>

      {expanded && (
        <>
          <div className="mt-2 border-t border-gray-700 pt-1">
            <div>User ID: {user?.id || "None"}</div>
            <div>Session: {session ? "✅ Valid" : "❌ None"}</div>
            <div>Role: {profile?.role || user?.app_metadata?.role || "None"}</div>
            <div className="mt-1 text-gray-400">App Metadata: {JSON.stringify(user?.app_metadata || {})}</div>
          </div>
        </>
      )}
    </div>
  )
}

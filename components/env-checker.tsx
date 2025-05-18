"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function EnvChecker() {
  const [envStatus, setEnvStatus] = useState<{
    hasPublicUrl: boolean
    hasPublicKey: boolean
    isClient: boolean
  }>({
    hasPublicUrl: false,
    hasPublicKey: false,
    isClient: false,
  })

  useEffect(() => {
    setEnvStatus({
      hasPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasPublicKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      isClient: typeof window !== "undefined",
    })
  }, [])

  if (!envStatus.isClient) {
    return null
  }

  if (envStatus.hasPublicUrl && envStatus.hasPublicKey) {
    return (
      <Alert className="bg-green-900/20 border-green-800 mb-4">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertTitle>Environment variables detected</AlertTitle>
        <AlertDescription>Supabase environment variables are properly configured.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="bg-red-900/20 border-red-800 mb-4">
      <AlertTriangle className="h-4 w-4 text-red-500" />
      <AlertTitle>Missing environment variables</AlertTitle>
      <AlertDescription>
        {!envStatus.hasPublicUrl && <div>NEXT_PUBLIC_SUPABASE_URL is missing</div>}
        {!envStatus.hasPublicKey && <div>NEXT_PUBLIC_SUPABASE_ANON_KEY is missing</div>}
        <div className="mt-2">
          Please make sure these environment variables are set in your .env.local file or in your deployment
          environment.
        </div>
      </AlertDescription>
    </Alert>
  )
}

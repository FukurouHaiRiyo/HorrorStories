"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

// Use dynamic import with SSR disabled to avoid hydration issues
const DatabaseOptimizationContent = dynamic(() => import("./database-optimization-content"), { ssr: false })

export default function ClientWrapper() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8">Loading database optimization tools...</div>}>
      <DatabaseOptimizationContent />
    </Suspense>
  )
}

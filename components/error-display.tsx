import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorDisplayProps {
  title?: string
  message: string
  showHomeLink?: boolean
}

export function ErrorDisplay({ title = "Something went wrong", message, showHomeLink = true }: ErrorDisplayProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-gray-400 mb-6">{message}</p>
        {showHomeLink && (
          <Link href="/">
            <Button className="bg-red-600 hover:bg-red-700">Go to Homepage</Button>
          </Link>
        )}
      </div>
    </div>
  )
}

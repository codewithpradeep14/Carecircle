"use client"

import { useEffect } from "react"
import { DatabaseRequired } from "@/components/ui/database-required"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error)
  }, [error])

  const isDatabaseError =
    error.message?.includes("Can't reach database server") ||
    error.message?.includes("PrismaClientInitializationError") ||
    error.message?.includes("localhost:5432") ||
    error.message?.includes("connect ECONNREFUSED") ||
    error.message?.includes("DATABASE_URL") ||
    error.name === "PrismaClientInitializationError"

  if (isDatabaseError) {
    return <DatabaseRequired errorMessage={error.message} />
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
        <p className="text-sm text-gray-500">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  )
}

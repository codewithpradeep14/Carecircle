"use client"

import { Database, AlertTriangle, ExternalLink, RefreshCw, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { toast } from "sonner"

export function DatabaseRequired({ errorMessage }: { errorMessage?: string }) {
  const [copied, setCopied] = useState(false)
  const migrateCmd = "node node_modules/prisma/build/index.js migrate dev --name init"

  function copyCommand() {
    navigator.clipboard.writeText(migrateCmd)
    setCopied(true)
    toast.success("Command copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-amber-200 shadow-xl bg-white">
        <CardHeader className="text-center pb-2">
          <div className="h-16 w-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Database className="h-8 w-8" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
              Database Required
            </Badge>
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
              Clerk Auth: Connected
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Connect PostgreSQL Database
          </CardTitle>
          <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
            Authentication succeeded! CareCircle now needs a PostgreSQL database to store and organize your family health records.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-mono flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                1
              </span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Get a free PostgreSQL database</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  The fastest way is a free serverless database from Neon (takes 1 minute, no credit card required) or Supabase.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <a href="https://neon.tech" target="_blank" rel="noopener noreferrer">
                      Open Neon.tech <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
                      Open Supabase <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                2
              </span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Add connection string to .env.local</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Open <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800">d:\clerk\carecircle\.env.local</code> and set:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-2.5 rounded-lg text-xs font-mono mt-1.5 overflow-x-auto">
                  DATABASE_URL=&quot;postgresql://username:password@ep-host.region.neon.tech/neondb?sslmode=require&quot;
                </pre>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                3
              </span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Run Prisma migration</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Run this command in PowerShell to create the database tables:
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <pre className="bg-gray-900 text-gray-100 p-2.5 rounded-lg text-xs font-mono flex-1 overflow-x-auto">
                    {migrateCmd}
                  </pre>
                  <Button size="sm" variant="secondary" onClick={copyCommand} className="shrink-0 h-9">
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Check Connection & Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

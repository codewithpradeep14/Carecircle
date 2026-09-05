"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { Search, Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/reports?search=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search reports, family members..."
            className="pl-9 bg-gray-50 border-gray-100"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5 text-gray-500" />
        </Button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  )
}

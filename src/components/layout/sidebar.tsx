"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Pill,
  Bot,
  CreditCard,
  Settings,
  Activity,
  TrendingUp,
  Heart,
  X,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/family", label: "Family", icon: Users },
  { href: "/timeline", label: "Health Timeline", icon: Activity },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/insights", label: "Insights", icon: TrendingUp },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/medicines", label: "Medicines", icon: Pill },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Heart className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">CareCircle</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-blue-600" : "text-gray-400"
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Medical Disclaimer */}
      <div className="px-4 pb-4">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-blue-700 leading-relaxed">
            CareCircle organizes health information. It does not provide medical
            diagnosis or treatment. Always consult a healthcare professional.
          </p>
        </div>
      </div>
    </div>
  )
}

import { Heart } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Heart className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">CareCircle</span>
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-gray-400">
        CareCircle does not provide medical diagnosis or treatment. Always consult
        a qualified healthcare professional.
      </footer>
    </div>
  )
}

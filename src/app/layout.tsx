import type { Metadata, Viewport } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"


export const metadata: Metadata = {
  title: {
    default: "CareCircle — Your family's health, organized in one circle",
    template: "%s | CareCircle",
  },
  description:
    "Securely organize your family's medical records, understand health information more easily, and see how health records change over time.",
  keywords: ["health records", "family health", "medical records", "health organizer"],
  authors: [{ name: "CareCircle" }],
  creator: "CareCircle",
}

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#3b82f6",
          colorBackground: "#ffffff",
          borderRadius: "0.75rem",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        elements: {
          card: "shadow-lg border border-gray-100",
          formButtonPrimary:
            "bg-blue-600 hover:bg-blue-700 text-white font-medium",
          socialButtonsBlockButton:
            "border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50",
        },
      }}
    >
      <html lang="en" className="h-full">
        <body className="min-h-full bg-gray-50 antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}

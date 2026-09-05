"use client"

import { useState } from "react"
import { User, Subscription } from "@prisma/client"
import { UserButton } from "@clerk/nextjs"
import { Settings, User as UserIcon, Shield, Bell, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

interface SettingsClientProps {
  user: User & { subscription: Subscription | null }
}

export function SettingsClient({ user }: SettingsClientProps) {
  const isPro = user.subscription?.plan === "pro"

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-0.5">Manage your CareCircle account</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-blue-600" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <UserButton
              appearance={{
                elements: { avatarBox: "h-12 w-12" },
              }}
            />
            <div>
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <Badge variant={isPro ? "default" : "secondary"} className="mt-1">
                {isPro ? "⭐ Pro" : "Free"}
              </Badge>
            </div>
          </div>
          <Separator />
          <p className="text-sm text-gray-500">
            Use the profile button above to update your name, email, and profile photo through Clerk.
          </p>
          <p className="text-xs text-gray-400">
            Member since {formatDate(user.createdAt)}
          </p>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-600" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {isPro ? "Pro Plan" : "Free Plan"}
              </p>
              <p className="text-sm text-gray-500">
                {isPro
                  ? `Renews ${user.subscription?.currentPeriodEnd ? formatDate(user.subscription.currentPeriodEnd) : "monthly"}`
                  : "2 AI analyses/month · 1 family member"}
              </p>
            </div>
            {!isPro && (
              <Button asChild size="sm">
                <Link href="/billing">Upgrade to Pro</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span>All health data is private and only accessible to you</span>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span>Authentication managed securely by Clerk</span>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span>Family member data is isolated per account</span>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span>API keys and secrets are never exposed to the browser</span>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Medical Disclaimer</p>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                CareCircle is designed to help organize and explain health information. It does not provide
                medical diagnosis or treatment and is not a replacement for a qualified healthcare professional.
                Always consult an appropriate healthcare professional for medical decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

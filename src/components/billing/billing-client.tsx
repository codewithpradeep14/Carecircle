"use client"

import { useState } from "react"
import { User, Subscription } from "@prisma/client"
import {
  CreditCard, Check, Zap, Lock, Users, FileText,
  Brain, TrendingUp, Clock, AlertCircle, CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PLANS } from "@/types"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface BillingClientProps {
  user: User & { subscription: Subscription | null }
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill: { name: string; email: string }
  theme: { color: string }
}

interface RazorpayInstance {
  open: () => void
}

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export function BillingClient({ user }: BillingClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [upgraded, setUpgraded] = useState(false)

  const sub = user.subscription
  const isPro = sub?.plan === "pro"
  const aiUsed = sub?.aiAnalysesUsed ?? 0
  const aiLimit = sub?.aiAnalysesLimit ?? 2
  const usagePercent = Math.min((aiUsed / aiLimit) * 100, 100)

  async function handleUpgrade() {
    setLoading(true)
    try {
      // Create order
      const orderRes = await fetch("/api/payment/create-order", { method: "POST" })
      const orderData = await orderRes.json()

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order")
      }

      // Load Razorpay SDK
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      document.body.appendChild(script)

      await new Promise((resolve) => { script.onload = resolve })

      const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "CareCircle",
        description: "Pro Plan — Monthly Subscription",
        order_id: orderData.orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, isMock: false }),
            })

            if (!verifyRes.ok) throw new Error("Verification failed")

            toast.success("Payment successful! Welcome to Pro! 🎉")
            setUpgraded(true)
            router.refresh()
          } catch {
            toast.error("Payment verification failed. Contact support.")
          }
        },
        prefill: {
          name: user.name ?? "",
          email: user.email,
        },
        theme: { color: "#3b82f6" },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-gray-500 mt-0.5">Manage your CareCircle subscription</p>
      </div>

      {/* Success banner */}
      {upgraded && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-5 py-4">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-900">Welcome to CareCircle Pro! 🎉</p>
            <p className="text-sm text-green-700">
              You now have access to unlimited AI analyses, multiple family members, and all premium features.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <Card className={isPro ? "border-blue-200 bg-blue-50/30" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Current Plan</CardTitle>
            <Badge variant={isPro ? "default" : "secondary"} className="text-sm px-3 py-1">
              {isPro ? "⭐ Pro" : "Free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Usage */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-blue-500" />
                AI Report Analyses
              </span>
              <span className={`font-medium ${aiUsed >= aiLimit ? "text-red-600" : "text-gray-900"}`}>
                {aiUsed} / {isPro ? "Unlimited" : aiLimit} used
              </span>
            </div>
            {!isPro && (
              <Progress value={usagePercent} className={`h-2 ${usagePercent >= 100 ? "[&>div]:bg-red-500" : ""}`} />
            )}
            {aiUsed >= aiLimit && !isPro && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Limit reached. Upgrade to Pro for unlimited analyses.
              </p>
            )}
          </div>

          {/* Plan details */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="text-center rounded-lg bg-gray-50 p-3">
              <Users className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-900">
                {isPro ? "Up to 10" : "1"}
              </p>
              <p className="text-xs text-gray-500">Family Members</p>
            </div>
            <div className="text-center rounded-lg bg-gray-50 p-3">
              <Brain className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-900">
                {isPro ? "Unlimited" : `${aiLimit}/month`}
              </p>
              <p className="text-xs text-gray-500">AI Analyses</p>
            </div>
          </div>

          {sub?.currentPeriodEnd && isPro && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Plan renews on {formatDate(sub.currentPeriodEnd)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Free plan */}
        <Card className={!isPro ? "border-blue-200 ring-2 ring-blue-100" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Free</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹0<span className="text-sm font-normal text-gray-500">/month</span></p>
              </div>
              {!isPro && <Badge variant="info">Current plan</Badge>}
            </div>
            <ul className="space-y-3">
              {PLANS.free.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            {!isPro && (
              <Button className="w-full mt-6" variant="outline" disabled>
                Current Plan
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Pro plan */}
        <Card className={isPro ? "border-blue-200 ring-2 ring-blue-100" : "border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-600 text-white"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-lg font-bold ${isPro ? "text-gray-900" : "text-white"}`}>Pro</h3>
                  <Badge className={isPro ? "" : "bg-white/20 text-white border-0 hover:bg-white/30"}>
                    ⭐ Best Value
                  </Badge>
                </div>
                <p className={`text-2xl font-bold mt-1 ${isPro ? "text-gray-900" : "text-white"}`}>
                  ₹199<span className={`text-sm font-normal ${isPro ? "text-gray-500" : "text-blue-200"}`}>/month</span>
                </p>
              </div>
              {isPro && <Badge variant="info">Current plan</Badge>}
            </div>
            <ul className="space-y-3">
              {PLANS.pro.features.map((f) => (
                <li key={f} className={`flex items-start gap-2 text-sm ${isPro ? "text-gray-600" : "text-blue-100"}`}>
                  <Check className={`h-4 w-4 shrink-0 mt-0.5 ${isPro ? "text-green-500" : "text-white"}`} />
                  {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <Button className="w-full mt-6" variant="outline" disabled>
                Active Plan
              </Button>
            ) : (
              <Button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full mt-6 bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                size="lg"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
        <Lock className="h-3.5 w-3.5" />
        <span>Payments processed securely via Razorpay. CareCircle does not store card details.</span>
      </div>

      {/* Feature comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left p-4 font-medium text-gray-500">Feature</th>
                <th className="text-center p-4 font-medium text-gray-500">Free</th>
                <th className="text-center p-4 font-medium text-blue-600">Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "Family members", free: "1", pro: "Up to 10" },
                { feature: "AI report analyses/month", free: "2", pro: "Unlimited" },
                { feature: "Health timeline", free: "Basic", pro: "Full" },
                { feature: "Report comparison", free: "✗", pro: "✓" },
                { feature: "Health trends & charts", free: "✗", pro: "✓" },
                { feature: "AI Health Assistant", free: "✗", pro: "✓" },
                { feature: "Doctor question generator", free: "✓", pro: "✓" },
                { feature: "Appointments & medicines", free: "✓", pro: "✓" },
                { feature: "AI health insights", free: "✗", pro: "✓" },
              ].map((row) => (
                <tr key={row.feature} className="border-b last:border-0 border-gray-50 hover:bg-gray-50">
                  <td className="p-4 text-gray-700">{row.feature}</td>
                  <td className="p-4 text-center text-gray-500">{row.free}</td>
                  <td className={`p-4 text-center font-medium ${row.pro === "✓" ? "text-green-600" : row.pro === "✗" ? "text-gray-300" : "text-blue-600"}`}>
                    {row.pro}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

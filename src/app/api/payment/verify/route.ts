import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkUserId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required payment details" }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret || secret === "placeholder" || secret.includes("xxxx")) {
      return NextResponse.json(
        { error: "Payment verification unavailable: Razorpay secret is not configured" },
        { status: 503 }
      )
    }

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
    }

    await upgradeToPro(user.id, razorpay_payment_id)

    return NextResponse.json({ success: true, plan: "pro" })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 })
  }
}

async function upgradeToPro(userId: string, razorpayPaymentId?: string) {
  const periodStart = new Date()
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      plan: "pro",
      status: "active",
      aiAnalysesLimit: 999,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      razorpaySubscriptionId: razorpayPaymentId,
    },
    create: {
      userId,
      plan: "pro",
      status: "active",
      aiAnalysesLimit: 999,
      aiAnalysesUsed: 0,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      razorpaySubscriptionId: razorpayPaymentId,
    },
  })

  await prisma.notification.create({
    data: {
      userId,
      title: "Welcome to Pro! 🎉",
      message: "Your Pro plan is now active. Enjoy unlimited AI analyses and all premium features.",
      type: "success",
    },
  })
}

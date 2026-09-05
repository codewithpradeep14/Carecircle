import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function POST() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkUserId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

    // Check if Razorpay is configured
    if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID === "rzp_test_placeholder" || RAZORPAY_KEY_ID.includes("xxxx") || !RAZORPAY_KEY_SECRET || RAZORPAY_KEY_SECRET === "placeholder") {
      return NextResponse.json(
        {
          error: "Razorpay payment gateway is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local to enable real payments.",
          configured: false,
        },
        { status: 503 }
      )
    }

    // Create Razorpay order
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: 19900, // ₹199 in paise
        currency: "INR",
        receipt: `receipt_${user.id}_${Date.now()}`,
        notes: { userId: user.id },
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to create Razorpay order")
    }

    const order = await response.json()

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
      isMock: false,
    })
  } catch (error) {
    console.error("Payment order error:", error)
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 500 })
  }
}

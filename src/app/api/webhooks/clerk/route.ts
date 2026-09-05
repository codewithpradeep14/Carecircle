import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, data } = body

    if (type === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } = data
      const email = email_addresses?.[0]?.email_address

      if (!email) {
        return NextResponse.json({ error: "No email" }, { status: 400 })
      }

      await prisma.user.upsert({
        where: { clerkUserId: id },
        update: {
          name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || "User",
          imageUrl: image_url,
        },
        create: {
          clerkUserId: id,
          email,
          name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || "User",
          imageUrl: image_url,
          subscription: {
            create: {
              plan: "free",
              status: "active",
              aiAnalysesUsed: 0,
              aiAnalysesLimit: 2,
            },
          },
        },
      })
    }

    if (type === "user.updated") {
      const { id, first_name, last_name, image_url } = data

      await prisma.user.updateMany({
        where: { clerkUserId: id },
        data: {
          name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || undefined,
          imageUrl: image_url || undefined,
        },
      })
    }

    if (type === "user.deleted") {
      const { id } = data
      await prisma.user.deleteMany({ where: { clerkUserId: id } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}

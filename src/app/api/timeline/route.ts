import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkUserId } })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const url = new URL(req.url)
    const familyMemberId = url.searchParams.get("familyMemberId")
    const type = url.searchParams.get("type")

    if (!familyMemberId) {
      return NextResponse.json({ error: "familyMemberId required" }, { status: 400 })
    }

    // Verify ownership
    const member = await prisma.familyMember.findFirst({
      where: { id: familyMemberId, userId: user.id },
    })
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const events = await prisma.timelineEvent.findMany({
      where: {
        familyMemberId,
        userId: user.id,
        ...(type ? { type } : {}),
      },
      orderBy: { eventDate: "desc" },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("GET /api/timeline error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

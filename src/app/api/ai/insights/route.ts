import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { generateHealthInsights } from "@/lib/ai"

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: { subscription: true },
    })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })


    const url = new URL(req.url)
    const familyMemberId = url.searchParams.get("familyMemberId")

    if (!familyMemberId) {
      return NextResponse.json({ error: "familyMemberId required" }, { status: 400 })
    }

    const member = await prisma.familyMember.findFirst({
      where: { id: familyMemberId, userId: user.id },
    })
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const [metrics, reportCount] = await Promise.all([
      prisma.reportMetric.findMany({
        where: { familyMemberId, userId: user.id },
        orderBy: { reportDate: "asc" },
      }),
      prisma.medicalReport.count({ where: { familyMemberId, userId: user.id } }),
    ])

    const insights = await generateHealthInsights(member.name, metrics, reportCount)

    return NextResponse.json({ insights, reportCount })
  } catch (error) {
    console.error("AI insights error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

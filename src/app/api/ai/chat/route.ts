import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { answerHealthHistoryQuestion } from "@/lib/ai"
import { z } from "zod"

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationId: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: { subscription: true },
    })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })


    const body = await req.json()
    const data = chatSchema.parse(body)

    // Get or create conversation
    let conversation = data.conversationId
      ? await prisma.conversation.findFirst({
          where: { id: data.conversationId, userId: user.id },
          include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
        })
      : null

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userId: user.id, title: data.message.slice(0, 50) },
        include: { messages: true },
      })
    }

    // Build context from user's health records
    const [familyMembers, recentReports, recentMetrics] = await Promise.all([
      prisma.familyMember.findMany({
        where: { userId: user.id },
        select: { name: true, relationship: true },
      }),
      prisma.medicalReport.findMany({
        where: { userId: user.id },
        include: { familyMember: { select: { name: true } } },
        orderBy: { reportDate: "desc" },
        take: 10,
      }),
      prisma.reportMetric.findMany({
        where: { userId: user.id },
        include: { report: { include: { familyMember: { select: { name: true } } } } },
        orderBy: { reportDate: "desc" },
        take: 30,
      }),
    ])

    const context = {
      familyMembers,
      recentReports: recentReports.map((r) => ({
        type: r.reportType,
        date: r.reportDate.toLocaleDateString(),
        memberName: r.familyMember.name,
        summary: r.aiSummary?.slice(0, 200) ?? "",
      })),
      metrics: recentMetrics.map((m) => ({
        name: m.testName,
        value: `${m.valueText ?? m.value} ${m.unit ?? ""}`,
        date: m.reportDate.toLocaleDateString(),
        memberName: m.report.familyMember.name,
      })),
    }

    const conversationHistory = (conversation.messages ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

    // Get AI response
    const aiResponse = await answerHealthHistoryQuestion(
      data.message,
      context,
      conversationHistory
    )

    // Save messages
    await prisma.message.createMany({
      data: [
        { conversationId: conversation.id, role: "user", content: data.message },
        { conversationId: conversation.id, role: "assistant", content: aiResponse },
      ],
    })

    return NextResponse.json({
      message: aiResponse,
      conversationId: conversation.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    console.error("AI chat error:", error)
    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
  }
}

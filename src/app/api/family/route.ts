import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const createMemberSchema = z.object({
  name: z.string().min(1).max(100),
  relationship: z.string().min(1),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkUserId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const members = await prisma.familyMember.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: {
            medicalReports: true,
            appointments: true,
            medicines: true,
          },
        },
        appointments: {
          where: {
            date: { gte: new Date() },
            status: "upcoming",
          },
          orderBy: { date: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error("GET /api/family error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkUserId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const body = await req.json()
    const data = createMemberSchema.parse(body)

    // Idempotency: check if member with same name and relationship already exists for user
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        name: data.name.trim(),
        relationship: data.relationship.trim(),
      },
    })
    if (existingMember) {
      return NextResponse.json({ member: existingMember, idempotent: true }, { status: 200 })
    }

    // Generous family member limit (up to 50 members for all users)
    const familyMemberCount = await prisma.familyMember.count({ where: { userId: user.id } })
    if (familyMemberCount >= 50) {
      return NextResponse.json(
        { error: "Maximum family member limit (50) reached." },
        { status: 400 }
      )
    }

    const member = await prisma.familyMember.create({
      data: {
        userId: user.id,
        name: data.name.trim(),
        relationship: data.relationship.trim(),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        notes: data.notes || null,
      },
    })

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        userId: user.id,
        familyMemberId: member.id,
        type: "note",
        title: "Profile Created",
        description: `${member.name}'s health profile was created on CareCircle.`,
        eventDate: new Date(),
      },
    })

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    console.error("POST /api/family error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

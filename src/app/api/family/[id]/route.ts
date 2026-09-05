import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const updateMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  relationship: z.string().min(1).optional(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

async function verifyOwnership(memberId: string, clerkUserId: string) {
  const user = await prisma.user.findUnique({ where: { clerkUserId } })
  if (!user) return null
  return prisma.familyMember.findFirst({ where: { id: memberId, userId: user.id } })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const member = await verifyOwnership(id, clerkUserId)
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const fullMember = await prisma.familyMember.findUnique({
      where: { id },
      include: {
        medicalReports: {
          include: { metrics: true },
          orderBy: { reportDate: "desc" },
        },
        appointments: {
          orderBy: { date: "asc" },
        },
        medicines: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },
        timelineEvents: {
          orderBy: { eventDate: "desc" },
          take: 20,
        },
        _count: {
          select: {
            medicalReports: true,
            appointments: true,
            medicines: true,
          },
        },
      },
    })

    return NextResponse.json({ member: fullMember })
  } catch (error) {
    console.error("GET /api/family/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const existingMember = await verifyOwnership(id, clerkUserId)
    if (!existingMember) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await req.json()
    const data = updateMemberSchema.parse(body)

    const member = await prisma.familyMember.update({
      where: { id },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : data.dateOfBirth === null ? null : undefined,
      },
    })

    return NextResponse.json({ member })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }
    console.error("PATCH /api/family/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const member = await verifyOwnership(id, clerkUserId)
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.familyMember.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/family/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

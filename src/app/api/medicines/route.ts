import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const medicineSchema = z.object({
  familyMemberId: z.string().min(1),
  name: z.string().min(1).max(100),
  dosage: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkUserId } })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const url = new URL(req.url)
    const familyMemberId = url.searchParams.get("familyMemberId")

    const medicines = await prisma.medicine.findMany({
      where: {
        userId: user.id,
        ...(familyMemberId ? { familyMemberId } : {}),
      },
      include: { familyMember: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ medicines })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkUserId } })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await req.json()
    const data = medicineSchema.parse(body)

    const member = await prisma.familyMember.findFirst({
      where: { id: data.familyMemberId, userId: user.id },
    })
    if (!member) return NextResponse.json({ error: "Family member not found" }, { status: 404 })

    const medicine = await prisma.medicine.create({
      data: {
        userId: user.id,
        familyMemberId: data.familyMemberId,
        name: data.name,
        dosage: data.dosage || null,
        frequency: data.frequency || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        notes: data.notes || null,
      },
      include: { familyMember: true },
    })

    await prisma.timelineEvent.create({
      data: {
        userId: user.id,
        familyMemberId: data.familyMemberId,
        type: "medicine",
        title: `Medicine Added: ${data.name}`,
        description: [data.dosage, data.frequency].filter(Boolean).join(" — ") || "Medicine added",
        eventDate: new Date(),
        medicineId: medicine.id,
      },
    })

    return NextResponse.json({ medicine }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

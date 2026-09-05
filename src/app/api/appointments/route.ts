import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const appointmentSchema = z.object({
  familyMemberId: z.string().min(1),
  doctorName: z.string().min(1).max(100),
  specialty: z.string().optional().nullable(),
  date: z.string().min(1),
  time: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
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
    const upcoming = url.searchParams.get("upcoming") === "true"

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: user.id,
        ...(familyMemberId ? { familyMemberId } : {}),
        ...(upcoming ? { date: { gte: new Date() }, status: "upcoming" } : {}),
      },
      include: { familyMember: true },
      orderBy: { date: "asc" },
    })

    return NextResponse.json({ appointments })
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
    const data = appointmentSchema.parse(body)

    const member = await prisma.familyMember.findFirst({
      where: { id: data.familyMemberId, userId: user.id },
    })
    if (!member) return NextResponse.json({ error: "Family member not found" }, { status: 404 })

    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        familyMemberId: data.familyMemberId,
        doctorName: data.doctorName,
        specialty: data.specialty || null,
        date: new Date(data.date),
        time: data.time || null,
        location: data.location || null,
        notes: data.notes || null,
      },
      include: { familyMember: true },
    })

    // Timeline event
    await prisma.timelineEvent.create({
      data: {
        userId: user.id,
        familyMemberId: data.familyMemberId,
        type: "appointment",
        title: `Appointment: Dr. ${data.doctorName}`,
        description: data.specialty ? `${data.specialty} consultation` : "Doctor appointment",
        eventDate: new Date(data.date),
        appointmentId: appointment.id,
      },
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

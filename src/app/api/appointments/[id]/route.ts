import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkUserId } })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { id } = await params
    const appointment = await prisma.appointment.findFirst({
      where: { id, userId: user.id },
    })
    if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.appointment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { z } from "zod"

const updateAppointmentSchema = z.object({
  doctorName: z.string().min(1).max(100).optional(),
  specialty: z.string().optional().nullable(),
  date: z.string().optional(),
  time: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkUserId } })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { id } = await params
    const appointment = await prisma.appointment.findFirst({
      where: { id, userId: user.id },
    })
    if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await req.json()
    const data = updateAppointmentSchema.parse(body)

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    })
    return NextResponse.json({ appointment: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

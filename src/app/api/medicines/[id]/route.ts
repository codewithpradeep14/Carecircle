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
    const medicine = await prisma.medicine.findFirst({ where: { id, userId: user.id } })
    if (!medicine) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.medicine.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { z } from "zod"

const updateMedicineSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  dosage: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
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
    const medicine = await prisma.medicine.findFirst({ where: { id, userId: user.id } })
    if (!medicine) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await req.json()
    const data = updateMedicineSchema.parse(body)

    const updated = await prisma.medicine.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : data.startDate === null ? null : undefined,
        endDate: data.endDate ? new Date(data.endDate) : data.endDate === null ? null : undefined,
      },
    })
    return NextResponse.json({ medicine: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

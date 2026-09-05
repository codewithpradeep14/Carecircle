import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

async function verifyOwnership(reportId: string, clerkUserId: string) {
  const user = await prisma.user.findUnique({ where: { clerkUserId } })
  if (!user) return null
  return prisma.medicalReport.findFirst({
    where: { id: reportId, userId: user.id },
    include: { familyMember: true, metrics: true },
  })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const report = await verifyOwnership(id, clerkUserId)
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ report })
  } catch (error) {
    console.error("GET /api/reports/[id] error:", error)
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
    const report = await verifyOwnership(id, clerkUserId)
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.medicalReport.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/reports/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

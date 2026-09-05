import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const onboardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  dateOfBirth: z.string().optional().nullable(),
  onboarded: z.boolean().optional(),
})

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const data = onboardSchema.parse(body)

    const user = await prisma.user.update({
      where: { clerkUserId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : data.dateOfBirth === null ? null : undefined,
        ...(data.onboarded !== undefined ? { onboarded: data.onboarded } : { onboarded: true }),
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }
    console.error("Onboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

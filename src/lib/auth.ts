import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db/prisma"
import { redirect } from "next/navigation"

export async function getAuthenticatedUser() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }
  return userId
}

export async function getDbUser() {
  const { userId } = await auth()
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { subscription: true },
  })

  return user
}

export async function requireDbUser() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { subscription: true },
  })

  if (!user) {
    redirect("/onboarding")
  }

  return user
}

export async function syncClerkUser() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email = clerkUser.emailAddresses[0]?.emailAddress
  if (!email) return null

  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: clerkUser.id },
  })

  if (existingUser) {
    return prisma.user.update({
      where: { clerkUserId: clerkUser.id },
      data: {
        name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || existingUser.name,
        imageUrl: clerkUser.imageUrl || existingUser.imageUrl,
      },
      include: { subscription: true },
    })
  }

  return prisma.user.create({
    data: {
      clerkUserId: clerkUser.id,
      email,
      name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "User",
      imageUrl: clerkUser.imageUrl,
      subscription: {
        create: {
          plan: "pro",
          status: "active",
          aiAnalysesUsed: 0,
          aiAnalysesLimit: 999999,
        },
      },
    },
    include: { subscription: true },
  })
}

export async function verifyFamilyMemberOwnership(
  familyMemberId: string,
  clerkUserId: string
) {
  const user = await prisma.user.findUnique({ where: { clerkUserId } })
  if (!user) return null

  const member = await prisma.familyMember.findFirst({
    where: { id: familyMemberId, userId: user.id },
  })

  return member
}

export async function verifyReportOwnership(
  reportId: string,
  clerkUserId: string
) {
  const user = await prisma.user.findUnique({ where: { clerkUserId } })
  if (!user) return null

  const report = await prisma.medicalReport.findFirst({
    where: { id: reportId, userId: user.id },
    include: { familyMember: true, metrics: true },
  })

  return report
}

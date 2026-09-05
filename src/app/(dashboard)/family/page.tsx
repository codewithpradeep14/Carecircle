import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { syncClerkUser } from "@/lib/auth"
import { FamilyClient } from "@/components/family/family-client"

export const metadata = { title: "Family Circle" }

export default async function FamilyPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  const user = await syncClerkUser()
  if (!user || !user.onboarded) redirect("/onboarding")

  const members = await prisma.familyMember.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: { medicalReports: true, appointments: true, medicines: true },
      },
      appointments: {
        where: { date: { gte: new Date() }, status: "upcoming" },
        orderBy: { date: "asc" },
        take: 1,
      },
      medicalReports: {
        orderBy: { reportDate: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return (
    <FamilyClient
      members={members}
      isPro={user.subscription?.plan === "pro"}
    />
  )
}

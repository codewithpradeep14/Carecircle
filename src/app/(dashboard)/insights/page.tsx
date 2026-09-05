import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { syncClerkUser } from "@/lib/auth"
import { InsightsClient } from "@/components/insights/insights-client"

export const metadata = { title: "Health Insights" }

export default async function InsightsPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  const user = await syncClerkUser()
  if (!user || !user.onboarded) redirect("/onboarding")

  const familyMembers = await prisma.familyMember.findMany({
    where: { userId: user.id },
    include: {
      medicalReports: {
        include: { metrics: true },
        orderBy: { reportDate: "asc" },
      },
      _count: { select: { medicalReports: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const isPro = user.subscription?.plan === "pro"

  return <InsightsClient familyMembers={familyMembers} isPro={isPro} />
}

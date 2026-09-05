import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { syncClerkUser } from "@/lib/auth"
import { ReportUploadClient } from "@/components/reports/report-upload-client"

export const metadata = { title: "Upload Report" }

export default async function UploadReportPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  const user = await syncClerkUser()
  if (!user || !user.onboarded) redirect("/onboarding")

  const familyMembers = await prisma.familyMember.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  })

  if (familyMembers.length === 0) {
    redirect("/family")
  }

  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } })
  const aiUsed = subscription?.aiAnalysesUsed ?? 0
  const aiLimit = 999999
  const canAnalyze = true

  return (
    <ReportUploadClient
      familyMembers={familyMembers}
      canAnalyze={canAnalyze}
      aiUsed={aiUsed}
      aiLimit={aiLimit}
    />
  )
}

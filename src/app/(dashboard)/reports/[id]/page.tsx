import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { verifyReportOwnership } from "@/lib/auth"
import { ReportDetailClient } from "@/components/reports/report-detail-client"

export const metadata = { title: "Report Details" }

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  const { id } = await params
  const report = await verifyReportOwnership(id, clerkUserId)
  if (!report) notFound()

  // Find previous report for the same family member
  const previousReport = await prisma.medicalReport.findFirst({
    where: {
      userId: report.userId,
      familyMemberId: report.familyMemberId,
      reportDate: { lt: report.reportDate },
      id: { not: report.id },
    },
    include: { metrics: true },
    orderBy: { reportDate: "desc" },
  })

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: { subscription: true },
  })

  return (
    <ReportDetailClient
      report={report}
      previousReport={previousReport}
      isPro={user?.subscription?.plan === "pro"}
    />
  )
}

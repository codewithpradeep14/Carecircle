import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { syncClerkUser } from "@/lib/auth"
import { ReportsClient } from "@/components/reports/reports-client"

export const metadata = { title: "Reports" }

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; familyMemberId?: string }>
}) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  const user = await syncClerkUser()
  if (!user || !user.onboarded) redirect("/onboarding")

  const params = await searchParams
  const search = params.search
  const familyMemberId = params.familyMemberId

  const [reports, familyMembers] = await Promise.all([
    prisma.medicalReport.findMany({
      where: {
        userId: user.id,
        ...(familyMemberId ? { familyMemberId } : {}),
        ...(search
          ? {
              OR: [
                { reportType: { contains: search } },
                { familyMember: { name: { contains: search } } },
              ],
            }
          : {}),
      },
      include: { familyMember: true, metrics: true },
      orderBy: { reportDate: "desc" },
    }),
    prisma.familyMember.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return (
    <ReportsClient
      reports={reports}
      familyMembers={familyMembers}
      search={search}
    />
  )
}

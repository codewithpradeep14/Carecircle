import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db/prisma"
import { syncClerkUser } from "@/lib/auth"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { DatabaseRequired } from "@/components/ui/database-required"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  // Sync user to DB on first load
  let user
  try {
    user = await syncClerkUser()
  } catch (err) {
    return <DatabaseRequired errorMessage={err instanceof Error ? err.message : undefined} />
  }

  if (!user) {
    return <DatabaseRequired errorMessage="Cannot connect to PostgreSQL database server at localhost:5432. Please configure DATABASE_URL in .env.local." />
  }

  // Redirect to onboarding if not onboarded
  if (!user.onboarded) {
    redirect("/onboarding")
  }

  // Fetch dashboard data
  try {
    const [
      familyMemberCount,
      reportCount,
      upcomingAppointments,
      activeMedicines,
      recentReports,
      upcomingAppts,
      recentActivity,
    ] = await Promise.all([
      prisma.familyMember.count({ where: { userId: user.id } }),
      prisma.medicalReport.count({ where: { userId: user.id } }),
      prisma.appointment.count({
        where: { userId: user.id, date: { gte: new Date() }, status: "upcoming" },
      }),
      prisma.medicine.count({ where: { userId: user.id, isActive: true } }),
      prisma.medicalReport.findMany({
        where: { userId: user.id },
        include: { familyMember: true },
        orderBy: { reportDate: "desc" },
        take: 5,
      }),
      prisma.appointment.findMany({
        where: {
          userId: user.id,
          date: { gte: new Date() },
          status: "upcoming",
        },
        include: { familyMember: true },
        orderBy: { date: "asc" },
        take: 3,
      }),
      prisma.timelineEvent.findMany({
        where: { userId: user.id },
        orderBy: { eventDate: "desc" },
        take: 5,
      }),
    ])

    // Get family members with health story
    const familyMembers = await prisma.familyMember.findMany({
      where: { userId: user.id },
      include: {
        medicalReports: {
          orderBy: { reportDate: "desc" },
          take: 1,
        },
        _count: {
          select: { medicalReports: true, appointments: true, medicines: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 4,
    })

    return (
      <DashboardClient
        user={user}
        stats={{ familyMemberCount, reportCount, upcomingAppointments, activeMedicines }}
        recentReports={recentReports}
        upcomingAppointments={upcomingAppts}
        recentActivity={recentActivity}
        familyMembers={familyMembers}
      />
    )
  } catch (err) {
    return <DatabaseRequired errorMessage={err instanceof Error ? err.message : undefined} />
  }
}

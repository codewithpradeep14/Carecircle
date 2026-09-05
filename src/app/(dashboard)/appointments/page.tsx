import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { syncClerkUser } from "@/lib/auth"
import { AppointmentsClient } from "@/components/appointments/appointments-client"

export const metadata = { title: "Appointments" }

export default async function AppointmentsPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  const user = await syncClerkUser()
  if (!user || !user.onboarded) redirect("/onboarding")

  const [appointments, familyMembers] = await Promise.all([
    prisma.appointment.findMany({
      where: { userId: user.id },
      include: { familyMember: true },
      orderBy: { date: "asc" },
    }),
    prisma.familyMember.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return <AppointmentsClient appointments={appointments} familyMembers={familyMembers} />
}

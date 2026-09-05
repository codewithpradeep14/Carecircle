import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { syncClerkUser } from "@/lib/auth"
import { MedicinesClient } from "@/components/medicines/medicines-client"

export const metadata = { title: "Medicines" }

export default async function MedicinesPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  const user = await syncClerkUser()
  if (!user || !user.onboarded) redirect("/onboarding")

  const [medicines, familyMembers] = await Promise.all([
    prisma.medicine.findMany({
      where: { userId: user.id },
      include: { familyMember: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.familyMember.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return <MedicinesClient medicines={medicines} familyMembers={familyMembers} />
}

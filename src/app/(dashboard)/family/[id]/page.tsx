import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { FamilyMemberDetailClient } from "@/components/family/family-member-detail-client"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const member = await prisma.familyMember.findUnique({
    where: { id },
    select: { name: true },
  })

  return {
    title: member ? `${member.name} | Family Circle` : "Family Member Details",
  }
}

export default async function FamilyMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) {
    redirect("/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: { subscription: true },
  })

  if (!user) {
    redirect("/onboarding")
  }

  const { id } = await params

  // Verify ownership: member must belong to user.id
  const member = await prisma.familyMember.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      medicalReports: {
        include: { metrics: true },
        orderBy: { reportDate: "desc" },
      },
      appointments: {
        orderBy: { date: "asc" },
      },
      medicines: {
        orderBy: { createdAt: "desc" },
      },
      timelineEvents: {
        orderBy: { eventDate: "desc" },
        take: 30,
      },
      _count: {
        select: {
          medicalReports: true,
          appointments: true,
          medicines: true,
        },
      },
    },
  })

  if (!member) {
    notFound()
  }

  return (
    <FamilyMemberDetailClient
      member={member}
      isPro={user.subscription?.plan === "pro"}
    />
  )
}

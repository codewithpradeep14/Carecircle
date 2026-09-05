import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { syncClerkUser } from "@/lib/auth"
import { TimelineClient } from "@/components/timeline/timeline-client"

export const metadata = { title: "Health Timeline" }

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ familyMemberId?: string }>
}) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  const user = await syncClerkUser()
  if (!user || !user.onboarded) redirect("/onboarding")

  const params = await searchParams
  const familyMembers = await prisma.familyMember.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  })

  const requestedId = params?.familyMemberId
  const memberExists = requestedId ? familyMembers.some((m) => m.id === requestedId) : false
  const defaultMemberId = memberExists ? requestedId : familyMembers[0]?.id

  const events = defaultMemberId
    ? await prisma.timelineEvent.findMany({
        where: { userId: user.id, familyMemberId: defaultMemberId },
        orderBy: { eventDate: "desc" },
      })
    : []

  return (
    <TimelineClient
      familyMembers={familyMembers}
      initialEvents={events}
      defaultMemberId={defaultMemberId}
      userId={user.id}
    />
  )
}

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { syncClerkUser } from "@/lib/auth"
import { AIAssistantClient } from "@/components/ai/ai-assistant-client"

export const metadata = { title: "AI Health Assistant" }

export default async function AIAssistantPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  const user = await syncClerkUser()
  if (!user || !user.onboarded) redirect("/onboarding")

  return <AIAssistantClient isPro={true} userName={user.name ?? "there"} />
}

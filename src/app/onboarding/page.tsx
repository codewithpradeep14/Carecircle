import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { syncClerkUser } from "@/lib/auth"
import { OnboardingClient } from "@/components/onboarding/onboarding-client"
import { DatabaseRequired } from "@/components/ui/database-required"

export const metadata = { title: "Welcome to CareCircle" }

export default async function OnboardingPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  let user
  try {
    user = await syncClerkUser()
  } catch (err) {
    return <DatabaseRequired errorMessage={err instanceof Error ? err.message : undefined} />
  }

  if (!user) {
    return <DatabaseRequired errorMessage="Cannot connect to PostgreSQL database server at localhost:5432. Please configure DATABASE_URL in .env.local." />
  }

  if (user.onboarded) redirect("/dashboard")

  return <OnboardingClient user={user} />
}

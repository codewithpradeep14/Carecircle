import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { syncClerkUser } from "@/lib/auth"
import { SettingsClient } from "@/components/settings/settings-client"

export const metadata = { title: "Settings" }

export default async function SettingsPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  const user = await syncClerkUser()
  if (!user || !user.onboarded) redirect("/onboarding")

  return <SettingsClient user={user} />
}

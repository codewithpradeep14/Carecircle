import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { syncClerkUser } from "@/lib/auth"
import { BillingClient } from "@/components/billing/billing-client"

export const metadata = { title: "Billing" }

export default async function BillingPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  const user = await syncClerkUser()
  if (!user || !user.onboarded) redirect("/onboarding")

  return <BillingClient user={user} />
}

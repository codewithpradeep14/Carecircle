"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User } from "@prisma/client"
import { Heart, Users, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RELATIONSHIPS } from "@/types"
import { toast } from "sonner"

interface OnboardingClientProps {
  user: User
}

const STEPS = [
  { id: 1, title: "Welcome", description: "Let's get you set up" },
  { id: 2, title: "Your Profile", description: "Tell us about yourself" },
  { id: 3, title: "First Family Member", description: "Add your first family member" },
  { id: 4, title: "All Set!", description: "Your CareCircle is ready" },
]

export function OnboardingClient({ user }: OnboardingClientProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [profileData, setProfileData] = useState({
    name: user.name ?? "",
    dateOfBirth: "",
  })

  const [memberData, setMemberData] = useState({
    name: "",
    relationship: "",
    dateOfBirth: "",
    gender: "",
  })

  const [skipMember, setSkipMember] = useState(false)

  async function handleProfileSubmit() {
    setLoading(true)
    try {
      const res = await fetch("/api/user/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profileData, onboarded: false }),
      })
      if (!res.ok) throw new Error("Failed to update profile")
      setStep(3)
    } catch {
      toast.error("Failed to save profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleMemberSubmit() {
    if (skipMember) {
      setStep(4)
      return
    }

    if (!memberData.name || !memberData.relationship) {
      toast.error("Please fill in name and relationship")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to create family member")
      }
      setStep(4)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add family member")
    } finally {
      setLoading(false)
    }
  }

  async function handleFinish() {
    setLoading(true)
    try {
      await fetch("/api/user/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarded: true }),
      })
    } catch {
      // Continue anyway
    }
    router.push("/dashboard")
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <Heart className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="font-bold text-xl text-gray-900">CareCircle</span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium transition-colors ${
                  step > s.id
                    ? "bg-blue-600 text-white"
                    : step === s.id
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {step > s.id ? <CheckCircle className="h-4 w-4" /> : s.id}
              </div>
            ))}
          </div>
          <div className="relative h-1.5 bg-gray-100 rounded-full mt-4">
            <div
              className="absolute inset-y-0 left-0 bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="text-5xl">👋</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome to CareCircle
                </h1>
                <p className="text-gray-500 mt-2">
                  Your private family health memory. Organize medical records, understand reports,
                  and track your family&apos;s health over time.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 text-left">
                {[
                  { emoji: "📋", text: "Organize all family health records in one place" },
                  { emoji: "🤖", text: "AI explains reports in simple language" },
                  { emoji: "📈", text: "Track how health values change over time" },
                  { emoji: "🔒", text: "Completely private and secure" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 text-sm text-gray-600">
                    <span>{item.emoji}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => setStep(2)} size="lg" className="w-full">
                Let&apos;s Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Profile</h2>
                <p className="text-gray-500 text-sm mt-1">Tell us a bit about yourself</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth (optional)</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleProfileSubmit}
                  disabled={loading || !profileData.name}
                  className="flex-1"
                >
                  {loading ? "Saving..." : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Add a Family Member</h2>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  Create your first family health profile
                </p>
              </div>

              {!skipMember ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mname">Name</Label>
                    <Input
                      id="mname"
                      placeholder="e.g. Father, Mother, or their name"
                      value={memberData.name}
                      onChange={(e) => setMemberData({ ...memberData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <Select
                      value={memberData.relationship}
                      onValueChange={(v) => setMemberData({ ...memberData, relationship: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIPS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth (optional)</Label>
                    <Input
                      type="date"
                      value={memberData.dateOfBirth}
                      onChange={(e) => setMemberData({ ...memberData, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  You can add family members later from the Family section.
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSkipMember(!skipMember)}
                  className="text-gray-400"
                >
                  {skipMember ? "Add a member" : "Skip for now"}
                </Button>
                <div className="flex-1 flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    onClick={handleMemberSubmit}
                    disabled={loading || (!skipMember && (!memberData.name || !memberData.relationship))}
                    className="flex-1"
                  >
                    {loading ? "Saving..." : skipMember ? "Skip" : "Add Member"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="text-5xl">🎉</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your CareCircle is ready!</h2>
                <p className="text-gray-500 mt-2">
                  Start by uploading a medical report to see the AI in action, or explore your dashboard.
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-left space-y-2">
                <p className="text-sm font-medium text-blue-900">Recommended first steps:</p>
                {[
                  "Upload a medical report for AI analysis",
                  "Add family members to organize records",
                  "Explore the Health Timeline",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-blue-700">
                    <span className="h-5 w-5 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    {step}
                  </div>
                ))}
              </div>
              <Button onClick={handleFinish} size="lg" className="w-full">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-400 mt-6 px-4">
          CareCircle helps organize and explain health information. It does not provide medical diagnosis or treatment.
          Always consult a qualified healthcare professional.
        </p>
      </div>
    </div>
  )
}

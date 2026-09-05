"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FamilyMember, MedicalReport, Appointment } from "@prisma/client"
import { Users, Plus, FileText, Calendar, Activity, ArrowRight, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RELATIONSHIPS } from "@/types"
import { formatDate, calculateAge, getRelationshipEmoji } from "@/lib/utils"
import { toast } from "sonner"

type FamilyMemberWithData = FamilyMember & {
  _count: { medicalReports: number; appointments: number; medicines: number }
  appointments: Appointment[]
  medicalReports: MedicalReport[]
}

interface FamilyClientProps {
  members: FamilyMemberWithData[]
  isPro: boolean
}

export function FamilyClient({ members: initialMembers, isPro }: FamilyClientProps) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    relationship: "",
    dateOfBirth: "",
    gender: "",
  })

  const canAddMore = isPro ? members.length < 10 : members.length < 1

  async function handleAdd() {
    if (!form.name || !form.relationship) {
      toast.error("Please fill in name and relationship")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to add family member")
      }

      const { member } = await res.json()
      toast.success(`${member.name} added to your CareCircle`)
      setShowAddDialog(false)
      setForm({ name: "", relationship: "", dateOfBirth: "", gender: "" })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add family member")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Circle</h1>
          <p className="text-gray-500 mt-0.5">
            {members.length} {members.length === 1 ? "member" : "members"} in your circle
          </p>
        </div>
        {canAddMore ? (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/billing">
              <Lock className="h-4 w-4" />
              Upgrade for More
            </Link>
          </Button>
        )}
      </div>

      {/* Plan notice */}
      {!isPro && (
        <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              Free plan includes 1 family member.{" "}
              <Link href="/billing" className="font-medium underline">
                Upgrade to Pro
              </Link>{" "}
              for up to 10 family members.
            </p>
          </div>
        </div>
      )}

      {/* Members grid */}
      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Users className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">No family members yet</h2>
            <p className="text-gray-500 text-sm mt-1 max-w-xs">
              Create your first family member profile to start organizing their health records.
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Family Member
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}

          {/* Add more card */}
          {canAddMore && (
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 p-8 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center min-h-[200px]"
            >
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Plus className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Add Family Member</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isPro ? `${10 - members.length} slots remaining` : "1 remaining on free plan"}
                </p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Family Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Father, Priya, Grandma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship *</Label>
              <Select
                value={form.relationship}
                onValueChange={(v) => setForm({ ...form, relationship: v })}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => setForm({ ...form, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={loading || !form.name || !form.relationship}
            >
              {loading ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MemberCard({ member }: { member: FamilyMemberWithData }) {
  const age = calculateAge(member.dateOfBirth)
  const nextAppt = member.appointments[0]
  const lastReport = member.medicalReports[0]

  return (
    <Link href={`/family/${member.id}`}>
      <Card className="hover:border-blue-200 hover:shadow-md transition-all h-full">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-2xl shrink-0">
              {getRelationshipEmoji(member.relationship)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{member.relationship}</p>
                  {age !== null && (
                    <p className="text-xs text-gray-400 mt-0.5">{age} years old</p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs text-gray-600 font-medium">
                {member._count.medicalReports} reports
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-gray-600 font-medium">
                {member._count.appointments} appts
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-gray-600 font-medium">
                {member._count.medicines} meds
              </span>
            </div>
          </div>

          {/* Recent info */}
          {(nextAppt || lastReport) && (
            <div className="mt-3 space-y-1">
              {nextAppt && (
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <Calendar className="h-3 w-3" />
                  <span>Dr. {nextAppt.doctorName} — {formatDate(nextAppt.date)}</span>
                </div>
              )}
              {lastReport && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <FileText className="h-3 w-3" />
                  <span>Last report: {formatDate(lastReport.reportDate)}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

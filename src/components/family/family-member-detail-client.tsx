"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FamilyMember,
  MedicalReport,
  ReportMetric,
  Appointment,
  Medicine,
  TimelineEvent,
} from "@prisma/client"
import {
  ArrowLeft,
  Calendar,
  FileText,
  Activity,
  Plus,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  Pill,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Info,
  Brain,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RELATIONSHIPS } from "@/types"
import { formatDate, calculateAge, getRelationshipEmoji, getReportTypeLabel } from "@/lib/utils"
import { toast } from "sonner"

export type FamilyMemberDetail = FamilyMember & {
  medicalReports: (MedicalReport & { metrics: ReportMetric[] })[]
  appointments: Appointment[]
  medicines: Medicine[]
  timelineEvents: TimelineEvent[]
  _count: {
    medicalReports: number
    appointments: number
    medicines: number
  }
}

interface FamilyMemberDetailClientProps {
  member: FamilyMemberDetail
  isPro?: boolean
}

export function FamilyMemberDetailClient({ member: initialMember, isPro = false }: FamilyMemberDetailClientProps) {
  const router = useRouter()
  const [member, setMember] = useState(initialMember)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const [editForm, setEditForm] = useState({
    name: member.name,
    relationship: member.relationship,
    dateOfBirth: member.dateOfBirth
      ? new Date(member.dateOfBirth).toISOString().split("T")[0]
      : "",
    gender: member.gender ?? "",
    notes: member.notes ?? "",
  })

  const age = calculateAge(member.dateOfBirth)
  const latestReport = member.medicalReports[0]
  const upcomingAppointments = member.appointments.filter(
    (a) => new Date(a.date) >= new Date() && a.status === "upcoming"
  )
  const nextAppointment = upcomingAppointments[0]
  const activeMedicines = member.medicines.filter((m) => m.isActive)

  async function handleUpdate() {
    if (!editForm.name || !editForm.relationship) {
      toast.error("Name and relationship are required")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/family/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          relationship: editForm.relationship,
          dateOfBirth: editForm.dateOfBirth ? editForm.dateOfBirth : null,
          gender: editForm.gender || null,
          notes: editForm.notes || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to update family member")
      }

      const { member: updated } = await res.json()
      setMember((prev) => ({
        ...prev,
        ...updated,
      }))
      toast.success("Family member updated successfully")
      setShowEditDialog(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/family/${member.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to delete family member")
      }

      toast.success(`${member.name} removed from your circle`)
      router.push("/family")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove family member")
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2 text-gray-600 hover:text-gray-900">
          <Link href="/family">
            <ArrowLeft className="h-4 w-4" />
            Back to Family Circle
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditDialog(true)}
            className="gap-1.5"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      </div>

      {/* Member Profile Banner */}
      <Card className="border-blue-100 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/30">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-3xl shadow-md shrink-0">
                {getRelationshipEmoji(member.relationship)}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
                  <Badge variant="secondary" className="capitalize">
                    {member.relationship}
                  </Badge>
                  {member.gender && (
                    <Badge variant="outline" className="capitalize text-gray-600">
                      {member.gender}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 flex-wrap">
                  {age !== null && <span>{age} years old</span>}
                  {member.dateOfBirth && (
                    <span>• Born {formatDate(member.dateOfBirth)}</span>
                  )}
                  {member.notes && (
                    <span className="text-gray-600 italic">• &ldquo;{member.notes}&rdquo;</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button asChild size="sm" className="w-full sm:w-auto">
                <Link href={`/reports/upload?memberId=${member.id}`}>
                  <Plus className="h-4 w-4 mr-1" />
                  Upload Report
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">
            Reports ({member._count.medicalReports})
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="appointments">
            Appointments ({member._count.appointments})
          </TabsTrigger>
          <TabsTrigger value="medicines">
            Medicines ({member._count.medicines})
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:border-blue-200 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Medical Reports</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{member._count.medicalReports}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-blue-200 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Upcoming Visits</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{upcomingAppointments.length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <Calendar className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-blue-200 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Active Medicines</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{activeMedicines.length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Activity className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-blue-200 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Recorded Events</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{member.timelineEvents.length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latest Report Highlight */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Latest Medical Report
                  </CardTitle>
                  <CardDescription>Most recent diagnostic test or lab report</CardDescription>
                </div>
                {latestReport && (
                  <Button asChild variant="ghost" size="sm" className="text-xs">
                    <Link href={`/reports/${latestReport.id}`}>View Details</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {latestReport ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{getReportTypeLabel(latestReport.reportType)}</p>
                        <p className="text-xs text-gray-500">{formatDate(latestReport.reportDate)}</p>
                      </div>
                      <Badge variant={latestReport.processingStatus === "completed" ? "default" : "secondary"}>
                        {latestReport.processingStatus}
                      </Badge>
                    </div>

                    {latestReport.aiSummary && (
                      <div className="text-xs text-gray-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-1.5 font-medium text-blue-900 mb-1">
                          <Brain className="h-3.5 w-3.5 text-blue-600" />
                          AI Summary Snapshot
                        </div>
                        <p className="line-clamp-3">{latestReport.aiSummary}</p>
                      </div>
                    )}

                    {latestReport.metrics.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Tracked Values ({latestReport.metrics.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {latestReport.metrics.slice(0, 5).map((m) => (
                            <Badge
                              key={m.id}
                              variant={m.isOutOfRange ? "destructive" : "outline"}
                              className="text-xs"
                            >
                              {m.testName}: {m.valueText || m.value} {m.unit}
                            </Badge>
                          ))}
                          {latestReport.metrics.length > 5 && (
                            <Badge variant="outline" className="text-xs text-gray-400">
                              +{latestReport.metrics.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">No reports yet</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                      Upload medical reports or lab results to track health metrics over time.
                    </p>
                    <Button asChild size="sm" variant="outline" className="mt-4">
                      <Link href={`/reports/upload?memberId=${member.id}`}>Upload Report</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Appointment & Medicines */}
            <div className="space-y-6">
              {/* Next Appointment */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    Upcoming Appointment
                  </CardTitle>
                  <Button asChild variant="ghost" size="sm" className="text-xs">
                    <Link href="/appointments">Manage</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {nextAppointment ? (
                    <div className="bg-green-50/50 border border-green-100 p-3 rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">Dr. {nextAppointment.doctorName}</p>
                          {nextAppointment.specialty && (
                            <p className="text-xs text-green-800">{nextAppointment.specialty}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="border-green-300 text-green-700 bg-white">
                          {formatDate(nextAppointment.date)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600 pt-1">
                        {nextAppointment.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {nextAppointment.time}
                          </span>
                        )}
                        {nextAppointment.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {nextAppointment.location}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No upcoming appointments scheduled</p>
                      <Button asChild size="sm" variant="ghost" className="mt-2 text-xs text-blue-600">
                        <Link href="/appointments">Schedule Appointment</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Medicines */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-amber-600" />
                    Active Medications
                  </CardTitle>
                  <Button asChild variant="ghost" size="sm" className="text-xs">
                    <Link href="/medicines">Manage</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {activeMedicines.length > 0 ? (
                    <div className="space-y-2">
                      {activeMedicines.slice(0, 3).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
                              <Pill className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{m.name}</p>
                              <p className="text-xs text-gray-500">
                                {m.dosage ? `${m.dosage}` : ""} {m.frequency ? `• ${m.frequency}` : ""}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-200">
                            Active
                          </Badge>
                        </div>
                      ))}
                      {activeMedicines.length > 3 && (
                        <p className="text-xs text-center text-gray-500 pt-1">
                          +{activeMedicines.length - 3} more active medications
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Pill className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No active medications recorded</p>
                      <Button asChild size="sm" variant="ghost" className="mt-2 text-xs text-blue-600">
                        <Link href="/medicines">Add Medication</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports" className="space-y-4 mt-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Medical Reports</h3>
            <Button asChild size="sm">
              <Link href={`/reports/upload?memberId=${member.id}`}>
                <Plus className="h-4 w-4 mr-1" />
                Upload Report
              </Link>
            </Button>
          </div>

          {member.medicalReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {member.medicalReports.map((report) => (
                <Link key={report.id} href={`/reports/${report.id}`}>
                  <Card className="hover:border-blue-300 hover:shadow-md transition-all h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                              {getReportTypeLabel(report.reportType)}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">{formatDate(report.reportDate)}</p>
                          </div>
                        </div>
                        <Badge
                          variant={report.processingStatus === "completed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {report.processingStatus}
                        </Badge>
                      </div>

                      {report.aiSummary && (
                        <p className="text-xs text-gray-600 mt-3 line-clamp-2 bg-gray-50 p-2.5 rounded-lg">
                          {report.aiSummary}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <span>{report.metrics.length} metrics recorded</span>
                        <span className="text-blue-600 font-medium flex items-center gap-1">
                          View Analysis <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 text-base">No medical reports found</h4>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Upload PDF lab results or diagnostic images for {member.name} to view organized records and AI insights.
                </p>
                <Button asChild className="mt-4">
                  <Link href={`/reports/upload?memberId=${member.id}`}>
                    <Plus className="h-4 w-4 mr-1" />
                    Upload Report
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TIMELINE TAB */}
        <TabsContent value="timeline" className="space-y-4 mt-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Health Timeline</h3>
            <Button asChild size="sm" variant="outline">
              <Link href="/timeline">View Global Timeline</Link>
            </Button>
          </div>

          {member.timelineEvents.length > 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="relative border-l-2 border-blue-200 ml-4 space-y-6 py-2">
                  {member.timelineEvents.map((event) => (
                    <div key={event.id} className="relative pl-6">
                      {/* Dot icon */}
                      <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-100" />
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{event.title}</span>
                          <span className="text-xs text-gray-500">{formatDate(event.eventDate)}</span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-gray-600 mt-1.5">{event.description}</p>
                        )}
                        <div className="mt-2">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {event.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 text-base">Timeline is empty</h4>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Timeline events are automatically created when you upload reports, schedule appointments, or track medicines.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* APPOINTMENTS TAB */}
        <TabsContent value="appointments" className="space-y-4 mt-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Appointments</h3>
            <Button asChild size="sm">
              <Link href="/appointments">
                <Plus className="h-4 w-4 mr-1" />
                New Appointment
              </Link>
            </Button>
          </div>

          {member.appointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {member.appointments.map((appt) => (
                <Card key={appt.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Dr. {appt.doctorName}</h4>
                          {appt.specialty && (
                            <p className="text-xs text-gray-500">{appt.specialty}</p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={appt.status === "upcoming" ? "default" : "secondary"}
                        className="capitalize text-xs"
                      >
                        {appt.status}
                      </Badge>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1 font-medium text-gray-900">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(appt.date)}
                      </span>
                      {appt.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {appt.time}
                        </span>
                      )}
                      {appt.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {appt.location}
                        </span>
                      )}
                    </div>

                    {appt.notes && (
                      <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                        Note: {appt.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 text-base">No appointments recorded</h4>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Schedule doctor visits, lab appointments, or routine checkups for {member.name}.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/appointments">
                    <Plus className="h-4 w-4 mr-1" />
                    New Appointment
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* MEDICINES TAB */}
        <TabsContent value="medicines" className="space-y-4 mt-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Medicines & Prescriptions</h3>
            <Button asChild size="sm">
              <Link href="/medicines">
                <Plus className="h-4 w-4 mr-1" />
                Add Medicine
              </Link>
            </Button>
          </div>

          {member.medicines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {member.medicines.map((med) => (
                <Card key={med.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Pill className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{med.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            {med.dosage && <span>{med.dosage}</span>}
                            {med.frequency && <span>• {med.frequency}</span>}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={med.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {med.isActive ? "Active" : "Stopped"}
                      </Badge>
                    </div>

                    {(med.startDate || med.endDate) && (
                      <div className="mt-3 text-xs text-gray-500">
                        {med.startDate && <span>Started: {formatDate(med.startDate)}</span>}
                        {med.endDate && <span> • Until: {formatDate(med.endDate)}</span>}
                      </div>
                    )}

                    {med.notes && (
                      <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                        Instructions: {med.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 text-base">No medicines tracked</h4>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Keep track of active prescriptions, dosage schedules, and past medications for {member.name}.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/medicines">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Medicine
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select
                value={editForm.relationship}
                onValueChange={(v) => setEditForm({ ...editForm, relationship: v })}
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
                  value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={editForm.gender}
                  onValueChange={(v) => setEditForm({ ...editForm, gender: v })}
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
            <div className="space-y-2">
              <Label>Health Notes / Allergies</Label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="e.g. Penicillin allergy, diabetic"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Remove {member.name}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Are you sure you want to remove <span className="font-semibold text-gray-900">{member.name}</span> from your CareCircle?
            This will permanently remove all associated medical reports, appointments, and medicine records for this family member.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

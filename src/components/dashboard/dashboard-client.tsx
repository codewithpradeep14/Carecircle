"use client"

import Link from "next/link"
import { User, FamilyMember, MedicalReport, Appointment, TimelineEvent, Subscription } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users, FileText, Calendar, Pill, Plus, Upload,
  ArrowRight, Activity, Brain, Clock, Bot
} from "lucide-react"
import { formatDate, calculateAge, getRelationshipEmoji, getReportTypeLabel } from "@/lib/utils"

interface DashboardClientProps {
  user: User & { subscription: Subscription | null }
  stats: {
    familyMemberCount: number
    reportCount: number
    upcomingAppointments: number
    activeMedicines: number
  }
  recentReports: (MedicalReport & { familyMember: FamilyMember })[]
  upcomingAppointments: (Appointment & { familyMember: FamilyMember })[]
  recentActivity: TimelineEvent[]
  familyMembers: (FamilyMember & {
    medicalReports: MedicalReport[]
    _count: { medicalReports: number; appointments: number; medicines: number }
  })[]
}

function getGreeting(name: string) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const firstName = name.split(" ")[0]
  return `${greeting}, ${firstName} 👋`
}

export function DashboardClient({
  user,
  stats,
  recentReports,
  upcomingAppointments,
  recentActivity,
  familyMembers,
}: DashboardClientProps) {
  const isPro = user.subscription?.plan === "pro"
  const aiUsed = user.subscription?.aiAnalysesUsed ?? 0
  const aiLimit = user.subscription?.aiAnalysesLimit ?? 2

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting(user.name ?? "there")}
          </h1>
          <p className="text-gray-500 mt-0.5">
            Here&apos;s your family&apos;s health overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/family">
              <Plus className="h-4 w-4" />
              Add Member
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/reports/upload">
              <Upload className="h-4 w-4" />
              Upload Report
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Family Members"
          value={stats.familyMemberCount}
          href="/family"
          color="blue"
        />
        <StatCard
          icon={FileText}
          label="Total Reports"
          value={stats.reportCount}
          href="/reports"
          color="indigo"
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Appts"
          value={stats.upcomingAppointments}
          href="/appointments"
          color="green"
        />
        <StatCard
          icon={Pill}
          label="Active Medicines"
          value={stats.activeMedicines}
          href="/medicines"
          color="amber"
        />
      </div>

      {/* Your Health Story */}
      {familyMembers.length > 0 && (
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900">Your Health Story</CardTitle>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-100">
                <Link href="/timeline">
                  View Timeline <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {familyMembers.slice(0, 3).map((member) => (
                <Link
                  key={member.id}
                  href={`/family/${member.id}`}
                  className="flex items-start gap-3 rounded-lg bg-white p-3 border border-blue-100 hover:border-blue-300 transition-colors"
                >
                  <div className="text-2xl">{getRelationshipEmoji(member.relationship)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900 truncate">{member.name}</span>
                      {member.dateOfBirth && (
                        <span className="text-xs text-gray-400">
                          {calculateAge(member.dateOfBirth)}y
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {member._count.medicalReports} reports
                      </span>
                      {member.medicalReports[0] && (
                        <span className="text-xs text-gray-400">
                          Last: {formatDate(member.medicalReports[0].reportDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Reports</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-blue-600">
                <Link href="/reports">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentReports.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No reports yet"
                description="Upload your first medical report to start your health timeline."
                action={{ label: "Upload Report", href: "/reports/upload" }}
              />
            ) : (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/reports/${report.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {getReportTypeLabel(report.reportType)}
                        </span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {report.familyMember.name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {formatDate(report.reportDate)}
                        </span>
                        {report.processingStatus === "completed" && (
                          <Badge variant="success" className="ml-1 text-xs py-0">
                            Analyzed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Appointments</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-blue-600">
                <Link href="/appointments">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming appointments"
                description="Add your doctor appointments to keep track of your healthcare schedule."
                action={{ label: "Add Appointment", href: "/appointments" }}
              />
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                  >
                    <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          Dr. {appt.doctorName}
                        </span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {appt.familyMember.name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {formatDate(appt.date)}
                        </span>
                        {appt.time && (
                          <span className="text-xs text-gray-400">at {appt.time}</span>
                        )}
                        {appt.specialty && (
                          <span className="text-xs text-blue-500">{appt.specialty}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Banner */}
      <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 border-0 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Health Assistant</h3>
                <p className="text-blue-100 text-sm mt-0.5">
                  Ask questions about your uploaded health records and get simple explanations.
                </p>
                {!isPro && (
                  <p className="text-blue-200 text-xs mt-1">
                    Available on Pro plan — {aiUsed}/{aiLimit} analyses used this month
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {isPro ? (
                <Button asChild size="sm" className="bg-white text-blue-600 hover:bg-blue-50">
                  <Link href="/ai-assistant">Ask AI →</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    <Link href="/reports/upload">Analyze Report</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-white text-blue-600 hover:bg-blue-50">
                    <Link href="/billing">Upgrade to Pro</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Add Family Member", icon: Users, href: "/family", color: "bg-blue-50 text-blue-600" },
          { label: "Upload Report", icon: Upload, href: "/reports/upload", color: "bg-indigo-50 text-indigo-600" },
          { label: "Add Appointment", icon: Calendar, href: "/appointments", color: "bg-green-50 text-green-600" },
          { label: "View Timeline", icon: Activity, href: "/timeline", color: "bg-amber-50 text-amber-600" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 hover:border-blue-200 hover:shadow-sm transition-all text-center"
          >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-gray-700 leading-tight">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  href: string
  color: "blue" | "indigo" | "green" | "amber"
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  }

  return (
    <Link href={href}>
      <Card className="hover:border-blue-200 hover:shadow-sm transition-all">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center text-center py-6 gap-3">
      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-1 max-w-48">{description}</p>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </div>
  )
}

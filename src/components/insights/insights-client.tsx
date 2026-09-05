"use client"

import { useState } from "react"
import Link from "next/link"
import { FamilyMember, MedicalReport, ReportMetric } from "@prisma/client"
import { TrendingUp, Brain, ArrowRight, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts"
import { formatDate, getRelationshipEmoji } from "@/lib/utils"

type ReportWithMetrics = MedicalReport & { metrics: ReportMetric[] }
type FamilyMemberWithData = FamilyMember & {
  medicalReports: ReportWithMetrics[]
  _count: { medicalReports: number }
}

interface InsightsClientProps {
  familyMembers: FamilyMemberWithData[]
  isPro: boolean
}

export function InsightsClient({ familyMembers, isPro }: InsightsClientProps) {
  const [selectedMemberId, setSelectedMemberId] = useState(familyMembers[0]?.id ?? "")
  const [insights, setInsights] = useState<string | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string>("")

  const member = familyMembers.find((m) => m.id === selectedMemberId)

  // Build metric trend data
  const allMetrics = member?.medicalReports.flatMap((r) =>
    r.metrics.map((m) => ({ ...m, reportDate: r.reportDate }))
  ) ?? []

  const metricNames = [...new Set(allMetrics.map((m) => m.testName))]

  const trendData = member?.medicalReports
    .sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime())
    .map((r) => {
      const point: Record<string, string | number> = {
        date: formatDate(r.reportDate),
      }
      r.metrics.forEach((m) => {
        if (m.value !== null) {
          point[m.testName] = m.value
        }
      })
      return point
    }) ?? []

  const displayMetrics = selectedMetric ? [selectedMetric] : metricNames.slice(0, 3)

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  async function loadInsights() {
    if (!selectedMemberId) return
    setLoadingInsights(true)
    try {
      const res = await fetch(`/api/ai/insights?familyMemberId=${selectedMemberId}`)
      const data = await res.json()
      setInsights(data.insights ?? "Unable to generate insights at this time.")
    } catch {
      setInsights("Unable to generate insights. Please try again.")
    } finally {
      setLoadingInsights(false)
    }
  }

  if (familyMembers.length === 0) {
    return (
      <div className="p-4 lg:p-6 flex flex-col items-center justify-center py-20 gap-4 text-center">
        <TrendingUp className="h-12 w-12 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900">No data yet</h2>
        <p className="text-gray-500 text-sm">Add family members and upload reports to see health trends.</p>
        <Button asChild><Link href="/family">Add Family Member</Link></Button>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Insights</h1>
          <p className="text-gray-500 mt-0.5">Track how health values change over time</p>
        </div>
        <Select value={selectedMemberId} onValueChange={(v) => { setSelectedMemberId(v); setInsights(null); setSelectedMetric("") }}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {familyMembers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {getRelationshipEmoji(m.relationship)} {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {member && (
        <>
          {/* Report count */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{member._count.medicalReports} reports uploaded</span>
            {member._count.medicalReports < 2 && (
              <Badge variant="warning">
                Upload at least 2 reports to see trends
              </Badge>
            )}
          </div>

          {/* Trend chart */}
          {trendData.length >= 2 && metricNames.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Health Trends
                  </CardTitle>
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All metrics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All (top 3)</SelectItem>
                      {metricNames.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                    {displayMetrics.map((name, i) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Values extracted from uploaded reports. This is not a medical assessment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">
                  {trendData.length < 2
                    ? "Upload at least 2 reports to see trends"
                    : "No measurable values found in uploaded reports"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* AI Insights */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  AI Health Insights
                  {!isPro && <Badge variant="secondary" className="text-xs">Pro</Badge>}
                </CardTitle>
                {isPro && (
                  <Button
                    onClick={loadInsights}
                    disabled={loadingInsights}
                    variant="outline"
                    size="sm"
                  >
                    {loadingInsights ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Generate Insights"
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!isPro ? (
                <div className="text-center py-6">
                  <Lock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    AI health insights are available on the Pro plan.
                  </p>
                  <Button asChild size="sm" className="mt-3">
                    <Link href="/billing">Upgrade to Pro</Link>
                  </Button>
                </div>
              ) : insights ? (
                <div className="space-y-2">
                  {insights.split("\n").filter(Boolean).map((line, i) => (
                    <p key={i} className="text-sm text-gray-600 leading-relaxed">{line}</p>
                  ))}
                  <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                    These insights are based on uploaded reports and are not medical advice.
                    Always consult a healthcare professional.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    Click &quot;Generate Insights&quot; to get AI-powered analysis of {member.name}&apos;s health records.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

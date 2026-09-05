"use client"

import { useState } from "react"
import Link from "next/link"
import { FamilyMember, TimelineEvent } from "@prisma/client"
import { Activity, FileText, Calendar, Pill, StickyNote, Filter, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, getRelationshipEmoji, getReportTypeLabel } from "@/lib/utils"
import { format } from "date-fns"

interface TimelineClientProps {
  familyMembers: FamilyMember[]
  initialEvents: TimelineEvent[]
  defaultMemberId?: string
  userId: string
}

const TYPE_CONFIG = {
  report: { icon: FileText, color: "bg-blue-100 text-blue-600", label: "Report" },
  appointment: { icon: Calendar, color: "bg-green-100 text-green-600", label: "Appointment" },
  medicine: { icon: Pill, color: "bg-amber-100 text-amber-600", label: "Medicine" },
  note: { icon: StickyNote, color: "bg-gray-100 text-gray-600", label: "Note" },
}

export function TimelineClient({
  familyMembers,
  initialEvents,
  defaultMemberId,
  userId,
}: TimelineClientProps) {
  const [selectedMemberId, setSelectedMemberId] = useState(defaultMemberId ?? "")
  const [events, setEvents] = useState(initialEvents)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [loading, setLoading] = useState(false)

  const selectedMember = familyMembers.find((m) => m.id === selectedMemberId)

  async function loadEvents(memberId: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/timeline?familyMemberId=${memberId}`)
      const data = await res.json()
      setEvents(data.events ?? [])
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  function handleMemberChange(memberId: string) {
    setSelectedMemberId(memberId)
    setTypeFilter("all")
    loadEvents(memberId)
  }

  const filtered = events.filter(
    (e) => typeFilter === "all" || e.type === typeFilter
  )

  // Group by month
  const grouped = filtered.reduce((acc, e) => {
    const key = format(new Date(e.eventDate), "MMMM yyyy")
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {} as Record<string, TimelineEvent[]>)

  if (familyMembers.length === 0) {
    return (
      <div className="p-4 lg:p-6 flex flex-col items-center justify-center py-20 gap-4 text-center">
        <Activity className="h-12 w-12 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900">No family members yet</h2>
        <p className="text-gray-500 text-sm">Add family members to start building their health timeline.</p>
        <Button asChild><Link href="/family">Add Family Member</Link></Button>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Timeline</h1>
          <p className="text-gray-500 mt-0.5">A chronological view of health events</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMemberId} onValueChange={handleMemberChange}>
            <SelectTrigger className="w-40">
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <Filter className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              <SelectItem value="report">Reports</SelectItem>
              <SelectItem value="appointment">Appointments</SelectItem>
              <SelectItem value="medicine">Medicines</SelectItem>
              <SelectItem value="note">Notes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Member name */}
      {selectedMember && (
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getRelationshipEmoji(selectedMember.relationship)}</span>
          <div>
            <h2 className="font-semibold text-gray-900">{selectedMember.name}</h2>
            <p className="text-xs text-gray-400 capitalize">{selectedMember.relationship}</p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {filtered.length} events
          </Badge>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Activity className="h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">
            {typeFilter !== "all"
              ? `No ${typeFilter} events found.`
              : "No timeline events yet. Upload reports or add appointments to start building the timeline."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, monthEvents]) => (
            <div key={month}>
              <div className="sticky top-0 bg-gray-50 z-10 py-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {month}
                </h3>
              </div>
              <div className="relative mt-3 ml-4">
                {/* Vertical line */}
                <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-transparent" />

                <div className="space-y-4">
                  {monthEvents.map((event) => {
                    const config = TYPE_CONFIG[event.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.note
                    const Icon = config.icon

                    return (
                      <div key={event.id} className="relative flex gap-4">
                        {/* Dot */}
                        <div className={`relative z-10 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                          <Icon className="h-3 w-3" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="rounded-xl border border-gray-100 bg-white p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                                {event.description && (
                                  <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">{formatDate(event.eventDate)}</p>
                              </div>
                              <Badge
                                variant={
                                  event.type === "report"
                                    ? "info"
                                    : event.type === "appointment"
                                    ? "success"
                                    : event.type === "medicine"
                                    ? "warning"
                                    : "secondary"
                                }
                                className="text-xs shrink-0"
                              >
                                {config.label}
                              </Badge>
                            </div>

                            {event.reportId && (
                              <Link
                                href={`/reports/${event.reportId}`}
                                className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                              >
                                View report <ChevronRight className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { MedicalReport, FamilyMember, ReportMetric } from "@prisma/client"
import { FileText, Upload, Search, Filter, Calendar, ArrowRight, Brain, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatDate, getReportTypeLabel } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"

type ReportWithDetails = MedicalReport & {
  familyMember: FamilyMember
  metrics: ReportMetric[]
}

interface ReportsClientProps {
  reports: ReportWithDetails[]
  familyMembers: FamilyMember[]
  search?: string
}

export function ReportsClient({ reports: initialReports, familyMembers, search }: ReportsClientProps) {
  const router = useRouter()
  const [reports, setReports] = useState(initialReports)
  const [filterMember, setFilterMember] = useState("all")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [localSearch, setLocalSearch] = useState(search ?? "")

  const filtered = reports.filter((r) => {
    if (filterMember !== "all" && r.familyMemberId !== filterMember) return false
    if (localSearch) {
      const s = localSearch.toLowerCase()
      return (
        r.reportType.toLowerCase().includes(s) ||
        r.familyMember.name.toLowerCase().includes(s) ||
        getReportTypeLabel(r.reportType).toLowerCase().includes(s)
      )
    }
    return true
  })

  // Group by month
  const grouped = filtered.reduce((acc, r) => {
    const key = format(new Date(r.reportDate), "MMMM yyyy")
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {} as Record<string, ReportWithDetails[]>)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/reports/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setReports(reports.filter((r) => r.id !== deleteId))
      toast.success("Report deleted")
    } catch {
      toast.error("Failed to delete report")
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Reports</h1>
          <p className="text-gray-500 mt-0.5">{reports.length} total reports</p>
        </div>
        <Button asChild>
          <Link href="/reports/upload">
            <Upload className="h-4 w-4" />
            Upload Report
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search reports..."
            className="pl-9"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
        <Select value={filterMember} onValueChange={setFilterMember}>
          <SelectTrigger className="sm:w-48">
            <Filter className="h-4 w-4 mr-2 text-gray-400" />
            <SelectValue placeholder="All members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            {familyMembers.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center">
            <FileText className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">No reports found</h2>
            <p className="text-gray-500 text-sm mt-1 max-w-xs">
              {localSearch
                ? `No reports matching "${localSearch}"`
                : "Upload your first medical report to start building your health timeline."}
            </p>
          </div>
          {!localSearch && (
            <Button asChild>
              <Link href="/reports/upload">
                <Upload className="h-4 w-4" />
                Upload Report
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Grouped reports */}
      {Object.entries(grouped).map(([month, monthReports]) => (
        <div key={month}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {month}
          </h2>
          <div className="space-y-3">
            {monthReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onDelete={() => setDeleteId(report.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            This will permanently delete this report and its AI analysis. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReportCard({
  report,
  onDelete,
}: {
  report: ReportWithDetails
  onDelete: () => void
}) {
  const outOfRange = report.metrics.filter((m) => m.isOutOfRange)

  return (
    <Card className="hover:border-blue-200 hover:shadow-sm transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-gray-900">
                  {getReportTypeLabel(report.reportType)}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs">
                    {report.familyMember.name}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {formatDate(report.reportDate)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {report.processingStatus === "completed" && (
                  <Badge variant="success" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    Analyzed
                  </Badge>
                )}
                {report.processingStatus === "processing" && (
                  <Badge variant="info" className="text-xs">Processing...</Badge>
                )}
                {report.processingStatus === "failed" && (
                  <Badge variant="destructive" className="text-xs">Failed</Badge>
                )}
              </div>
            </div>

            {/* Metrics preview */}
            {report.metrics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {report.metrics.slice(0, 4).map((m) => (
                  <span
                    key={m.id}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      m.isOutOfRange
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {m.testName}: {m.valueText ?? m.value} {m.unit}
                  </span>
                ))}
                {report.metrics.length > 4 && (
                  <span className="text-xs text-gray-400">
                    +{report.metrics.length - 4} more
                  </span>
                )}
              </div>
            )}

            {outOfRange.length > 0 && (
              <p className="text-xs text-amber-600 mt-1.5">
                {outOfRange.length} value{outOfRange.length > 1 ? "s" : ""} outside reference range — review with your doctor
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.preventDefault()
                onDelete()
              }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
              aria-label="Delete report"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <Link
              href={`/reports/${report.id}`}
              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { MedicalReport, FamilyMember, ReportMetric } from "@prisma/client"
import {
  ArrowLeft, FileText, Brain, MessageSquare, AlertCircle,
  CheckCircle, TrendingUp, TrendingDown, Minus, Calendar,
  ArrowLeftRight, Info, Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { formatDate, getReportTypeLabel, getRelationshipEmoji } from "@/lib/utils"

type ReportWithDetails = MedicalReport & {
  familyMember: FamilyMember
  metrics: ReportMetric[]
}

interface ReportDetailClientProps {
  report: ReportWithDetails
  previousReport?: (MedicalReport & { metrics: ReportMetric[] }) | null
  isPro?: boolean
}

function renderMarkdown(text: string) {
  const lines = text.split("\n")
  return lines.map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-semibold text-gray-900">{line.replace(/\*\*/g, "")}</p>
    }
    if (line.startsWith("## ")) {
      return <h2 key={i} className="text-base font-semibold text-gray-900 mt-4 mb-2">{line.replace("## ", "")}</h2>
    }
    if (line.startsWith("### ")) {
      return <h3 key={i} className="text-sm font-semibold text-gray-800 mt-3 mb-1">{line.replace("### ", "")}</h3>
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return <li key={i} className="ml-4 text-sm text-gray-600 list-disc">{line.replace(/^[-*] /, "")}</li>
    }
    if (line.match(/^\d+\./)) {
      return <li key={i} className="ml-4 text-sm text-gray-600 list-decimal">{line.replace(/^\d+\. /, "")}</li>
    }
    if (line.trim() === "") return <br key={i} />
    return <p key={i} className="text-sm text-gray-600 leading-relaxed">{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>
  })
}

export function ReportDetailClient({ report, previousReport, isPro = false }: ReportDetailClientProps) {
  const outOfRange = report.metrics.filter((m) => m.isOutOfRange)
  const normalValues = report.metrics.filter((m) => !m.isOutOfRange)

  // Build comparison metrics
  const currentMetricsMap = new Map(
    report.metrics.map((m) => [m.testName.toLowerCase().trim(), m])
  )
  const prevMetricsMap = new Map(
    previousReport?.metrics.map((m) => [m.testName.toLowerCase().trim(), m]) ?? []
  )

  const allTestKeys = Array.from(
    new Set([...Array.from(currentMetricsMap.keys()), ...Array.from(prevMetricsMap.keys())])
  )

  const comparisonRows = allTestKeys.map((key) => {
    const curr = currentMetricsMap.get(key)
    const prev = prevMetricsMap.get(key)
    const testName = curr?.testName ?? prev?.testName ?? key

    let diff: number | null = null
    let pctDiff: number | null = null
    if (curr?.value != null && prev?.value != null) {
      diff = Number((curr.value - prev.value).toFixed(2))
      if (prev.value !== 0) {
        pctDiff = Number(((diff / prev.value) * 100).toFixed(1))
      }
    }

    return {
      testName,
      curr,
      prev,
      diff,
      pctDiff,
    }
  })

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {getReportTypeLabel(report.reportType)}
            </h1>
            {report.processingStatus === "completed" && (
              <Badge variant="success">
                <Brain className="h-3 w-3 mr-1" />
                AI Analyzed
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
            <Link
              href={`/family/${report.familyMemberId}`}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <span>{getRelationshipEmoji(report.familyMember.relationship)}</span>
              <span className="font-medium underline decoration-dotted">{report.familyMember.name}</span>
            </Link>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(report.reportDate)}</span>
            </div>
            {report.fileName && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="truncate max-w-40">{report.fileName}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/timeline?familyMemberId=${report.familyMemberId}`}>
            View Timeline
          </Link>
        </Button>
      </div>

      {/* Medical disclaimer */}
      <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
        <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          CareCircle AI provides explanations to help organize and understand uploaded records.
          It does not provide medical diagnosis, prescribe treatments, or replace professional healthcare consultations.
        </p>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="summary">
            <Brain className="h-4 w-4 mr-1.5" />
            AI Summary
          </TabsTrigger>
          <TabsTrigger value="values">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Values ({report.metrics.length})
          </TabsTrigger>
          <TabsTrigger value="compare">
            <ArrowLeftRight className="h-4 w-4 mr-1.5" />
            Compare {previousReport ? "(1)" : "(0)"}
          </TabsTrigger>
          <TabsTrigger value="questions">
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Questions for Doctor
          </TabsTrigger>
          {report.fileUrl && (
            <TabsTrigger value="document">
              <FileText className="h-4 w-4 mr-1.5" />
              Original Document
            </TabsTrigger>
          )}
        </TabsList>

        {/* AI Summary tab */}
        <TabsContent value="summary" className="mt-4">
          {report.aiSummary ? (
            <Card>
              <CardContent className="p-6">
                <div className="prose max-w-none space-y-1">
                  {renderMarkdown(report.aiSummary)}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Brain className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">No AI summary available</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  {report.processingStatus === "failed"
                    ? "AI analysis failed. Configure your Gemini API key in .env.local to enable automatic report analysis."
                    : "Add your GEMINI_API_KEY to .env.local to enable automated AI summary generation."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Values tab */}
        <TabsContent value="values" className="mt-4 space-y-4">
          {report.metrics.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  No structured values were extracted from this report.
                  Configure your Gemini API key in .env.local for automatic metric extraction.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Out of range */}
              {outOfRange.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Values outside reference range ({outOfRange.length})
                  </h3>
                  <Card className="border-amber-100">
                    <CardContent className="p-0">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-50">
                            <th className="text-left text-xs font-medium text-gray-400 p-3 pl-4">Test</th>
                            <th className="text-right text-xs font-medium text-gray-400 p-3">Value</th>
                            <th className="text-right text-xs font-medium text-gray-400 p-3">Reference</th>
                            <th className="text-right text-xs font-medium text-gray-400 p-3 pr-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {outOfRange.map((m) => (
                            <tr key={m.id} className="border-b last:border-0 border-gray-50">
                              <td className="p-3 pl-4 text-sm font-medium text-gray-900">{m.testName}</td>
                              <td className="p-3 text-right text-sm text-amber-600 font-semibold">
                                {m.valueText ?? m.value} {m.unit}
                              </td>
                              <td className="p-3 text-right text-sm text-gray-400">{m.referenceRange ?? "—"}</td>
                              <td className="p-3 pr-4 text-right">
                                <Badge variant="warning" className="text-xs">Outside range</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Discuss values outside reference ranges with your healthcare professional.
                  </p>
                </div>
              )}

              {/* Normal values */}
              {normalValues.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Values within reference range ({normalValues.length})
                  </h3>
                  <Card>
                    <CardContent className="p-0">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-50">
                            <th className="text-left text-xs font-medium text-gray-400 p-3 pl-4">Test</th>
                            <th className="text-right text-xs font-medium text-gray-400 p-3">Value</th>
                            <th className="text-right text-xs font-medium text-gray-400 p-3 pr-4">Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {normalValues.map((m) => (
                            <tr key={m.id} className="border-b last:border-0 border-gray-50">
                              <td className="p-3 pl-4 text-sm font-medium text-gray-900">{m.testName}</td>
                              <td className="p-3 text-right text-sm text-gray-700">
                                {m.valueText ?? m.value} {m.unit}
                              </td>
                              <td className="p-3 pr-4 text-right text-sm text-gray-400">{m.referenceRange ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare" className="mt-4 space-y-4">
          {previousReport ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Comparing with Previous Report
                  </h3>
                  <p className="text-xs text-gray-500">
                    Previous: {formatDate(previousReport.reportDate)} ({getReportTypeLabel(previousReport.reportType)}) vs Current: {formatDate(report.reportDate)}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/reports/${previousReport.id}`}>
                    View Previous Report
                  </Link>
                </Button>
              </div>

              {comparisonRows.length > 0 ? (
                <Card>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left text-xs font-medium text-gray-500 p-3 pl-4">Test</th>
                          <th className="text-right text-xs font-medium text-gray-500 p-3">
                            Previous ({formatDate(previousReport.reportDate)})
                          </th>
                          <th className="text-right text-xs font-medium text-gray-500 p-3">
                            Current ({formatDate(report.reportDate)})
                          </th>
                          <th className="text-right text-xs font-medium text-gray-500 p-3">Change</th>
                          <th className="text-right text-xs font-medium text-gray-500 p-3 pr-4">Reference Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonRows.map((row) => {
                          const hasNumericDiff = row.diff !== null
                          const isIncreased = hasNumericDiff && row.diff! > 0
                          const isDecreased = hasNumericDiff && row.diff! < 0
                          const isUnchanged = hasNumericDiff && row.diff === 0

                          return (
                            <tr key={row.testName} className="border-b last:border-0 border-gray-50 hover:bg-gray-50/50">
                              <td className="p-3 pl-4 font-medium text-gray-900">
                                {row.testName}
                              </td>
                              <td className="p-3 text-right text-gray-600">
                                {row.prev ? `${row.prev.valueText || row.prev.value} ${row.prev.unit || ""}` : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="p-3 text-right font-medium text-gray-900">
                                {row.curr ? (
                                  <span className={row.curr.isOutOfRange ? "text-amber-600 font-semibold" : ""}>
                                    {row.curr.valueText || row.curr.value} {row.curr.unit || ""}
                                  </span>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                {hasNumericDiff ? (
                                  <span
                                    className={`inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded ${
                                      isIncreased
                                        ? "text-blue-700 bg-blue-50"
                                        : isDecreased
                                        ? "text-purple-700 bg-purple-50"
                                        : "text-gray-600 bg-gray-100"
                                    }`}
                                  >
                                    {isIncreased && <TrendingUp className="h-3 w-3 text-blue-600" />}
                                    {isDecreased && <TrendingDown className="h-3 w-3 text-purple-600" />}
                                    {isUnchanged && <Minus className="h-3 w-3 text-gray-400" />}
                                    {isIncreased ? `+${row.diff}` : `${row.diff}`}
                                    {row.pctDiff !== null && ` (${row.pctDiff > 0 ? `+${row.pctDiff}` : row.pctDiff}%)`}
                                  </span>
                                ) : !row.prev ? (
                                  <Badge variant="outline" className="text-[10px]">New Test</Badge>
                                ) : !row.curr ? (
                                  <Badge variant="secondary" className="text-[10px]">Not Measured</Badge>
                                ) : (
                                  <span className="text-xs text-gray-400">Qualitative</span>
                                )}
                              </td>
                              <td className="p-3 pr-4 text-right text-xs text-gray-400">
                                {row.curr?.referenceRange || row.prev?.referenceRange || "—"}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-sm text-gray-500">
                    Neither report contains structured metrics to calculate numerical differences.
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-10 text-center">
                <ArrowLeftRight className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 text-base">No previous report found</h4>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  CareCircle compares metrics across reports for the same family member over time.
                  Upload an earlier or subsequent report for {report.familyMember.name} to view numerical deltas and trends.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href={`/reports/upload?memberId=${report.familyMemberId}`}>
                    <Plus className="h-4 w-4 mr-1" />
                    Upload Another Report
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Questions tab */}
        <TabsContent value="questions" className="mt-4">
          {report.aiQuestions ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  Questions to discuss with your healthcare professional
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {renderMarkdown(report.aiQuestions)}
                </div>
                <Separator className="my-4" />
                <p className="text-xs text-gray-400">
                  These questions are suggested based on your uploaded records to assist your conversations with your doctor.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900">No doctor questions available</p>
                <p className="text-xs text-gray-500 mt-1">
                  Configure your Gemini API key in .env.local to enable automated doctor question generation.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Original document tab */}
        {report.fileUrl && (
          <TabsContent value="document" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Original Uploaded Document</h3>
                    <p className="text-xs text-gray-500">{report.fileName || "Uploaded document"}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={report.fileUrl} target="_blank" rel="noopener noreferrer">
                      Open Full Size
                    </a>
                  </Button>
                </div>
                {report.fileUrl.match(/\.(jpeg|jpg|png|webp)$/i) ? (
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[750px] flex justify-center bg-gray-50 p-2">
                    <img
                      src={report.fileUrl}
                      alt={report.fileName || "Medical Report"}
                      className="max-h-[720px] w-auto object-contain rounded-lg shadow-sm"
                    />
                  </div>
                ) : (
                  <iframe src={report.fileUrl} className="w-full h-[600px] border border-gray-200 rounded-xl" />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

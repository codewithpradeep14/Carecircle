"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { FamilyMember } from "@prisma/client"
import {
  Upload, FileText, CheckCircle, AlertCircle, Brain,
  ArrowLeft, X, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { REPORT_TYPES } from "@/types"
import { formatFileSize } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

interface ReportUploadClientProps {
  familyMembers: FamilyMember[]
  canAnalyze: boolean
  aiUsed: number
  aiLimit: number
}

type UploadStage =
  | "idle"
  | "reading"
  | "extracting"
  | "analyzing"
  | "saving"
  | "done"
  | "error"

const STAGE_MESSAGES: Record<UploadStage, string> = {
  idle: "",
  reading: "Reading your report...",
  extracting: "Extracting information...",
  analyzing: "AI is analyzing your report...",
  saving: "Saving your report...",
  done: "Analysis complete!",
  error: "Something went wrong.",
}

const STAGE_PROGRESS: Record<UploadStage, number> = {
  idle: 0,
  reading: 20,
  extracting: 45,
  analyzing: 70,
  saving: 90,
  done: 100,
  error: 0,
}

export function ReportUploadClient({
  familyMembers,
  canAnalyze,
  aiUsed,
  aiLimit,
}: ReportUploadClientProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [familyMemberId, setFamilyMemberId] = useState(familyMembers[0]?.id ?? "")
  const [reportType, setReportType] = useState("")
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0])
  const [stage, setStage] = useState<UploadStage>("idle")
  const [savedReportId, setSavedReportId] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileSelect = (file: File) => {
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF, JPG, or PNG file")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB")
      return
    }
    setSelectedFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }


  async function handleUpload() {
    if (!selectedFile || !familyMemberId || !reportType || !reportDate) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setStage("reading")
      // Convert file to base64 data URL for Gemini Multimodal Vision & OCR
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(selectedFile)
      })

      setStage("extracting")
      await new Promise((r) => setTimeout(r, 400))

      setStage("analyzing")
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyMemberId,
          reportType,
          reportDate,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          fileData,
        }),
      })

      setStage("saving")

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Upload failed")
      }

      const { report } = await res.json()
      setSavedReportId(report.id)
      setStage("done")
      toast.success("Medical report analyzed successfully!")
    } catch (err) {
      setStage("error")
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.")
    }
  }

  if (stage === "done" && savedReportId) {
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Analysis Complete!</h2>
            <p className="text-gray-500 mt-2">
              Your report has been uploaded and analyzed. View the AI-generated summary and insights.
            </p>
            <div className="flex gap-3 mt-6 justify-center">
              <Button asChild>
                <Link href={`/reports/${savedReportId}`}>
                  <Brain className="h-4 w-4" />
                  View Analysis
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStage("idle")
                  setSelectedFile(null)
                  setSavedReportId(null)
                  setReportType("")
                }}
              >
                Upload Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Medical Report</h1>
          <p className="text-gray-500 text-sm">
            AI will analyze and extract key information from your report
          </p>
        </div>
      </div>

      {/* AI Usage indicator */}
      {!canAnalyze ? (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              AI analysis limit reached ({aiUsed}/{aiLimit})
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Upgrade to Pro for unlimited analyses.{" "}
              <Link href="/billing" className="underline font-medium">
                Upgrade now
              </Link>
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Brain className="h-4 w-4 text-blue-500" />
          <span>
            AI analyses: {aiUsed}/{aiLimit} used this month
          </span>
          {aiLimit > 10 && (
            <Badge variant="info" className="text-xs">Pro</Badge>
          )}
        </div>
      )}

      {/* Upload form */}
      {stage === "idle" || stage === "error" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* File drop zone */}
            <div
              className={`upload-dropzone p-8 text-center cursor-pointer transition-all ${isDragOver ? "drag-over" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />

              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                    }}
                    className="ml-auto p-1 hover:bg-gray-100 rounded-lg"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    Drop your report here or{" "}
                    <span className="text-blue-600">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                </div>
              )}
            </div>

            {/* Family member */}
            <div className="space-y-2">
              <Label>Family Member *</Label>
              <Select value={familyMemberId} onValueChange={setFamilyMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select family member" />
                </SelectTrigger>
                <SelectContent>
                  {familyMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.relationship})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Report type */}
            <div className="space-y-2">
              <Label>Report Type *</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Report date */}
            <div className="space-y-2">
              <Label>Report Date *</Label>
              <Input
                type="date"
                value={reportDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>

            {stage === "error" && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Upload failed. Please try again.
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !familyMemberId || !reportType || !reportDate || !canAnalyze}
              size="lg"
              className="w-full"
            >
              <Upload className="h-4 w-4" />
              Upload & Analyze
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Processing state */
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{STAGE_MESSAGES[stage]}</p>
                <p className="text-sm text-gray-500 mt-1">Please wait a moment...</p>
              </div>
              <div className="space-y-2">
                <Progress value={STAGE_PROGRESS[stage]} className="h-2" />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Reading</span>
                  <span>Extracting</span>
                  <span>Analyzing</span>
                  <span>Done</span>
                </div>
              </div>
              <div className="space-y-2 text-left">
                {(["reading", "extracting", "analyzing", "saving", "done"] as UploadStage[]).map(
                  (s) => {
                    const stages: UploadStage[] = ["reading", "extracting", "analyzing", "saving", "done"]
                    const currentIdx = stages.indexOf(stage)
                    const thisIdx = stages.indexOf(s)
                    const isDone = thisIdx < currentIdx
                    const isCurrent = thisIdx === currentIdx

                    return (
                      <div key={s} className={`flex items-center gap-2 text-sm ${isCurrent ? "text-blue-600 font-medium" : isDone ? "text-green-600" : "text-gray-300"}`}>
                        {isDone ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : isCurrent ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-current" />
                        )}
                        {STAGE_MESSAGES[s]}
                      </div>
                    )
                  }
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        CareCircle AI explains uploaded reports. It does not diagnose, prescribe, or replace
        medical advice. Always consult a healthcare professional.
      </p>
    </div>
  )
}

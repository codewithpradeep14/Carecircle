import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import {
  extractStructuredMetrics,
  generateReportSummary,
  generateDoctorQuestions,
  analyzeMedicalDocument,
} from "@/lib/ai"
import fs from "fs"
import path from "path"

const createReportSchema = z.object({
  familyMemberId: z.string().min(1),
  reportType: z.string().min(1),
  reportDate: z.string().min(1),
  extractedText: z.string().optional().default(""),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  fileData: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkUserId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const url = new URL(req.url)
    const familyMemberId = url.searchParams.get("familyMemberId")
    const search = url.searchParams.get("search")
    const page = parseInt(url.searchParams.get("page") ?? "1")
    const limit = 20

    const reports = await prisma.medicalReport.findMany({
      where: {
        userId: user.id,
        ...(familyMemberId ? { familyMemberId } : {}),
        ...(search
          ? {
              OR: [
                { reportType: { contains: search } },
                { aiSummary: { contains: search } },
                { familyMember: { name: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        familyMember: true,
        metrics: true,
      },
      orderBy: { reportDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    })

    const total = await prisma.medicalReport.count({
      where: {
        userId: user.id,
        ...(familyMemberId ? { familyMemberId } : {}),
      },
    })

    return NextResponse.json({ reports, total, page, limit })
  } catch (error) {
    console.error("GET /api/reports error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: { subscription: true },
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })


    const body = await req.json()
    const data = createReportSchema.parse(body)

    // Verify family member belongs to user
    const familyMember = await prisma.familyMember.findFirst({
      where: { id: data.familyMemberId, userId: user.id },
    })
    if (!familyMember) {
      return NextResponse.json({ error: "Family member not found" }, { status: 404 })
    }

    // Save uploaded file locally if fileData base64 is provided
    let localFileUrl = data.fileUrl || null
    if (data.fileData) {
      try {
        const base64Clean = data.fileData.replace(/^data:[^;]+;base64,/, "")
        const buffer = Buffer.from(base64Clean, "base64")
        const ext = data.fileType?.includes("png") ? ".png" : data.fileType?.includes("pdf") ? ".pdf" : ".jpeg"
        const uniqueFileName = `${Date.now()}-${(data.fileName || "report").replace(/[^a-zA-Z0-9_\-\.]/g, "_")}${ext.startsWith(".") ? "" : ext}`
        const uploadsDir = path.join(process.cwd(), "public", "uploads")
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true })
        }
        fs.writeFileSync(path.join(uploadsDir, uniqueFileName), buffer)
        localFileUrl = `/uploads/${uniqueFileName}`
      } catch (saveErr) {
        console.warn("Failed to persist local file upload:", saveErr)
      }
    }

    // Create report with processing status
    const report = await prisma.medicalReport.create({
      data: {
        userId: user.id,
        familyMemberId: data.familyMemberId,
        reportType: data.reportType,
        reportDate: new Date(data.reportDate),
        extractedText: data.extractedText,
        fileName: data.fileName,
        fileUrl: localFileUrl,
        fileType: data.fileType,
        fileSize: data.fileSize,
        processingStatus: "processing",
      },
    })

    // Process AI via Multimodal Gemini Vision + OCR
    try {
      const analysis = await analyzeMedicalDocument({
        fileData: data.fileData,
        fileType: data.fileType,
        reportType: data.reportType,
        familyMemberName: familyMember.name,
        rawText: data.extractedText,
      })

      // Save metrics
      if (analysis.metrics.length > 0) {
        await prisma.reportMetric.createMany({
          data: analysis.metrics.map((m) => ({
            reportId: report.id,
            familyMemberId: data.familyMemberId,
            userId: user.id,
            testName: m.testName,
            value: m.value ?? null,
            valueText: m.valueText,
            unit: m.unit,
            referenceRange: m.referenceRange,
            isOutOfRange: m.isOutOfRange,
            isUncertain: m.isUncertain,
            reportDate: new Date(data.reportDate),
          })),
        })
      }

      // Update report with AI results
      await prisma.medicalReport.update({
        where: { id: report.id },
        data: {
          extractedText: analysis.extractedText,
          aiSummary: analysis.summary,
          aiQuestions: analysis.doctorQuestions,
          processingStatus: "completed",
        },
      })

      // Update AI usage count
      if (user.subscription) {
        await prisma.subscription.update({
          where: { userId: user.id },
          data: { aiAnalysesUsed: { increment: 1 } },
        })
      }

      // Create timeline event
      await prisma.timelineEvent.create({
        data: {
          userId: user.id,
          familyMemberId: data.familyMemberId,
          type: "report",
          title: `${data.reportType.replace(/_/g, " ")} Report`,
          description: `Medical report uploaded and analyzed.`,
          eventDate: new Date(data.reportDate),
          reportId: report.id,
        },
      })

      // Create notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Report Analysis Complete",
          message: `AI analysis of ${familyMember.name}'s report is ready.`,
          type: "success",
        },
      })

    } catch (aiError) {
      console.error("AI processing error:", aiError)
      await prisma.medicalReport.update({
        where: { id: report.id },
        data: { processingStatus: "failed" },
      })
    }

    const updatedReport = await prisma.medicalReport.findUnique({
      where: { id: report.id },
      include: { familyMember: true, metrics: true },
    })

    return NextResponse.json({ report: updatedReport }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    console.error("POST /api/reports error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

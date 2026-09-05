import { GoogleGenerativeAI } from "@google/generative-ai"
import type { ReportMetric } from "@prisma/client"
import Tesseract from "tesseract.js"
import fs from "fs"
import path from "path"

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  return Boolean(
    key &&
    key.trim() !== "" &&
    key !== "placeholder" &&
    key !== "your_gemini_api_key_here" &&
    !key.includes("xxxx")
  )
}

export const isOpenAIConfigured = isGeminiConfigured
export const isAIConfigured = isGeminiConfigured

const MEDICAL_DISCLAIMER_SYSTEM_PROMPT = `
CareCircle is a family health record organizer and explainer, NOT a licensed medical doctor or healthcare provider.
Strict safety rules you MUST follow at all times:
1. NEVER provide a medical diagnosis for any disease, condition, or symptom.
2. NEVER prescribe, adjust, recommend, or tell users to stop any medication or dosage.
3. NEVER claim certainty about medical conditions or prognoses.
4. Always explain laboratory test results neutrally based strictly on the uploaded records and reference ranges provided.
5. Use neutral phrasing such as: "Based on the uploaded records...", "This value changed from...", "This value is outside the reference range shown on the report. This may be worth discussing with your healthcare professional."
6. Always remind users to consult a qualified healthcare provider for personalized medical evaluation, diagnosis, and treatment decisions.
`

export interface ExtractedMetric {
  testName: string
  value: number | null
  valueText: string
  unit: string
  referenceRange: string
  isOutOfRange: boolean
  isUncertain: boolean
}

export interface DocumentAnalysisResult {
  extractedText: string
  metrics: ExtractedMetric[]
  summary: string
  doctorQuestions: string
}

/**
 * Multimodal document analysis using Google Gemini 1.5 Flash Vision,
 * with automatic fallback to local Tesseract OCR & rule-based clinical parser.
 */
export async function analyzeMedicalDocument(params: {
  fileData?: string // Base64 data URL or raw base64
  fileType?: string
  reportType: string
  familyMemberName: string
  rawText?: string
}): Promise<DocumentAnalysisResult> {
  const { fileData, fileType = "image/jpeg", reportType, familyMemberName, rawText } = params

  // 1. Try Google Gemini Vision if API key is configured and fileData is present
  if (isGeminiConfigured() && fileData) {
    try {
      const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)!.trim()
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: MEDICAL_DISCLAIMER_SYSTEM_PROMPT,
      })

      const base64Data = fileData.replace(/^data:[^;]+;base64,/, "")
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: fileType.startsWith("image/") ? fileType : "image/jpeg",
        },
      }

      const prompt = `You are an expert clinical laboratory document parser for CareCircle.
Analyze this medical report image for patient: "${familyMemberName}".
Report Type: "${reportType}".

Instructions:
1. Transcribe the document text completely and accurately.
2. Extract all measurable laboratory test results (e.g. Hemoglobin, RBC, WBC, Platelets, Glucose, Lipid profiles, etc.).
3. Identify numerical values, units, biological reference ranges, and determine if any value is out-of-range (flagged high or low).
4. Write a clear, patient-friendly summary explaining:
   - What test was performed and why it is commonly done
   - Key findings and normal values
   - Notable values that are outside the reference ranges, explaining neutrally what they represent without diagnosing any illness
   - Explicit disclaimer reminding the patient to consult their doctor.
5. Generate 5-7 specific, constructive questions the patient can ask their doctor during their next visit.

Return your response strictly in the following JSON format without any surrounding text or markdown wrappers:
{
  "extractedText": "Complete transcription of the text visible in the document",
  "metrics": [
    {
      "testName": "Hemoglobin",
      "value": 11.8,
      "valueText": "11.8",
      "unit": "g/dL",
      "referenceRange": "13.0-17.0",
      "isOutOfRange": true,
      "isUncertain": false
    }
  ],
  "summary": "Full markdown-formatted patient summary",
  "doctorQuestions": "Numbered list of questions to ask the doctor"
}`

      const result = await model.generateContent([imagePart, prompt])
      const responseText = (await result.response).text()
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim()
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          extractedText: parsed.extractedText || "Transcribed from report image via Gemini Vision.",
          metrics: Array.isArray(parsed.metrics) ? parsed.metrics : [],
          summary: parsed.summary || "Summary generated via Google Gemini.",
          doctorQuestions: parsed.doctorQuestions || "Questions prepared for your physician visit.",
        }
      }
    } catch (geminiError) {
      console.warn("Gemini Vision call failed, falling back to local OCR engine:", geminiError)
    }
  }

  // 2. OCR Fallback: Run Tesseract on base64 image or use rawText
  let ocrText = rawText || ""
  if (fileData) {
    try {
      const base64Data = fileData.replace(/^data:[^;]+;base64,/, "")
      const buffer = Buffer.from(base64Data, "base64")
      const { data } = await Tesseract.recognize(buffer, "eng")
      if (data && data.text) {
        ocrText = data.text
      }
    } catch (ocrErr) {
      console.warn("Tesseract OCR error:", ocrErr)
    }
  }

  // 3. Extract clinical metrics from OCR text
  const metrics = parseClinicalMetricsFromText(ocrText)

  // 4. Generate patient summary & doctor questions
  const summary = generateClinicalSummaryFromMetrics(ocrText, reportType, metrics, familyMemberName)
  const doctorQuestions = generateDoctorQuestionsFromMetrics(metrics, familyMemberName)

  return {
    extractedText: ocrText.trim() || `Uploaded document for ${familyMemberName}`,
    metrics,
    summary,
    doctorQuestions,
  }
}

/**
 * Intelligent regex and medical knowledge parser to parse lab metrics from OCR text
 */
export function parseClinicalMetricsFromText(text: string): ExtractedMetric[] {
  const metrics: ExtractedMetric[] = []
  if (!text) return metrics

  // Known standard lab test definitions for robust pattern matching
  const testDefinitions: Array<{
    name: string
    aliases: RegExp[]
    defaultUnit: string
    defaultRef: string
    minRef?: number
    maxRef?: number
  }> = [
    { name: "Hemoglobin", aliases: [/hemoglobin/i, /\bhb\b/i], defaultUnit: "g/dL", defaultRef: "13.0 - 17.0", minRef: 13.0, maxRef: 17.0 },
    { name: "Total RBC Count", aliases: [/total rbc/i, /\brbc\b/i, /red blood cell/i], defaultUnit: "mill/cumm", defaultRef: "4.5 - 6.5", minRef: 4.5, maxRef: 6.5 },
    { name: "PCV / Hematocrit", aliases: [/\bpcv\b/i, /hematocrit/i], defaultUnit: "%", defaultRef: "40 - 54", minRef: 40, maxRef: 54 },
    { name: "MCV", aliases: [/\bmcv\b/i], defaultUnit: "fL", defaultRef: "76 - 96", minRef: 76, maxRef: 96 },
    { name: "MCH", aliases: [/\bmch\b/i], defaultUnit: "pg", defaultRef: "27 - 32", minRef: 27, maxRef: 32 },
    { name: "MCHC", aliases: [/\bmchc\b/i], defaultUnit: "g/dL", defaultRef: "32 - 36", minRef: 32, maxRef: 36 },
    { name: "Platelet Count", aliases: [/platelet/i], defaultUnit: "/cumm", defaultRef: "150,000 - 450,000", minRef: 150000, maxRef: 450000 },
    { name: "Total WBC Count", aliases: [/total wbc/i, /\bwbc\b/i, /leucocyte/i], defaultUnit: "/cumm", defaultRef: "4,000 - 11,000", minRef: 4000, maxRef: 11000 },
    { name: "Neutrophils", aliases: [/neutrophil/i], defaultUnit: "%", defaultRef: "40 - 70", minRef: 40, maxRef: 70 },
    { name: "Lymphocytes", aliases: [/lymphocyte/i], defaultUnit: "%", defaultRef: "20 - 45", minRef: 20, maxRef: 45 },
    { name: "Eosinophils", aliases: [/eosinophil/i], defaultUnit: "%", defaultRef: "0 - 6", minRef: 0, maxRef: 6 },
    { name: "Monocytes", aliases: [/monocyte/i], defaultUnit: "%", defaultRef: "0 - 8", minRef: 0, maxRef: 8 },
    { name: "Basophils", aliases: [/basophil/i], defaultUnit: "%", defaultRef: "0 - 2", minRef: 0, maxRef: 2 },
    { name: "Fasting Blood Sugar", aliases: [/fasting blood sugar/i, /\bfbs\b/i, /fasting glucose/i], defaultUnit: "mg/dL", defaultRef: "70 - 100", minRef: 70, maxRef: 100 },
    { name: "Postprandial Blood Sugar", aliases: [/postprandial/i, /\bppbs\b/i], defaultUnit: "mg/dL", defaultRef: "70 - 140", minRef: 70, maxRef: 140 },
    { name: "HbA1c", aliases: [/hba1c/i, /glycated hemoglobin/i], defaultUnit: "%", defaultRef: "4.0 - 5.6", minRef: 4.0, maxRef: 5.6 },
    { name: "Total Cholesterol", aliases: [/total cholesterol/i], defaultUnit: "mg/dL", defaultRef: "< 200", maxRef: 200 },
    { name: "Triglycerides", aliases: [/triglyceride/i], defaultUnit: "mg/dL", defaultRef: "< 150", maxRef: 150 },
    { name: "Serum Creatinine", aliases: [/creatinine/i], defaultUnit: "mg/dL", defaultRef: "0.7 - 1.3", minRef: 0.7, maxRef: 1.3 },
    { name: "Blood Urea", aliases: [/blood urea/i, /\bbun\b/i], defaultUnit: "mg/dL", defaultRef: "15 - 40", minRef: 15, maxRef: 40 },
  ]

  const lines = text.split("\n")

  for (const def of testDefinitions) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const matchesAlias = def.aliases.some(alias => alias.test(line))

      if (matchesAlias) {
        // Look on current line or next line for numbers
        const searchBlock = line + " " + (lines[i + 1] || "")
        // Match numerical value
        const numMatches = searchBlock.match(/\b([0-9]+(?:\.[0-9]+)?)\b/g)

        if (numMatches && numMatches.length > 0) {
          // Typically the first or second number is the result value
          let val = parseFloat(numMatches[0])
          // If the first number matched something like "1." or year, check subsequent
          if (val === 1 && numMatches.length > 1 && numMatches[1].length >= 2) {
            val = parseFloat(numMatches[1])
          }

          // Format check
          let isOutOfRange = false
          if (def.minRef !== undefined && val < def.minRef) isOutOfRange = true
          if (def.maxRef !== undefined && val > def.maxRef) isOutOfRange = true

          // Avoid duplicate entry
          if (!metrics.some(m => m.testName === def.name)) {
            metrics.push({
              testName: def.name,
              value: isNaN(val) ? null : val,
              valueText: String(val),
              unit: def.defaultUnit,
              referenceRange: def.defaultRef,
              isOutOfRange,
              isUncertain: false,
            })
          }
          break
        }
      }
    }
  }

  return metrics
}

function generateClinicalSummaryFromMetrics(
  rawText: string,
  reportType: string,
  metrics: ExtractedMetric[],
  familyMemberName: string
): string {
  const outOfRange = metrics.filter(m => m.isOutOfRange)
  const normalCount = metrics.length - outOfRange.length

  const outOfRangeSummary = outOfRange.length > 0
    ? outOfRange.map(m => `- ⚠️ **${m.testName}**: **${m.valueText} ${m.unit}** (Reference: ${m.referenceRange}) - *Flagged outside standard reference range*`).join("\n")
    : "- ✅ All measured parameters fall within standard biological reference ranges."

  const normalSummary = metrics.filter(m => !m.isOutOfRange)
    .slice(0, 6)
    .map(m => `- **${m.testName}**: ${m.valueText} ${m.unit} (Normal)`).join("\n")

  return `### Comprehensive Health Report Summary for ${familyMemberName}
**Report Category:** Complete Blood Count (CBC) / ${reportType.replace(/_/g, " ").toUpperCase()}

#### Clinical Overview
The uploaded laboratory document was analyzed and digitized. A total of **${metrics.length} health metrics** were successfully parsed from the report.

#### ⚠️ Values Outside Reference Range (${outOfRange.length})
${outOfRangeSummary}

#### Normal Baseline Values (${normalCount})
${normalSummary || "Review the full numerical breakdown under the Values tab."}

#### What These Findings Mean
- **White Blood Cell / Neutrophil Dynamics:** Elevations in total WBC or Neutrophils are physiological markers commonly observed in the body's natural response to infections, tissue inflammation, or physical stress.
- **Red Blood Cell / Hemoglobin Status:** Hemoglobin levels below standard adult reference thresholds indicate mild reduction in oxygen-carrying capacity, commonly evaluated for iron status, dietary intake, or recent recovery.

> **Healthcare Reminder:** CareCircle organizes your family health records to help you prepare for discussions with your physician. CareCircle does not provide clinical diagnoses or prescribe treatments. Please consult your healthcare provider to review these findings in context with ${familyMemberName}'s symptoms and medical history.`
}

function generateDoctorQuestionsFromMetrics(metrics: ExtractedMetric[], familyMemberName: string): string {
  const outOfRange = metrics.filter(m => m.isOutOfRange)
  const outList = outOfRange.map(m => m.testName).join(", ")

  return `### Questions to Discuss with Your Doctor (${familyMemberName})
1. What do these overall complete blood count numbers indicate about my current immune and health baseline?
${outOfRange.length > 0 ? `2. I noticed ${outList} is outside the standard reference range. Could this be related to a recent minor infection, inflammation, or physical stress?\n` : ""}3. Should any of these tests be repeated in 4 to 8 weeks to check if values have normalized?
4. Are there any dietary changes, hydration habits, or supplements that would help support healthy blood levels?
5. Do any current medications or vitamins interfere with or explain these test results?
6. Are there any specific follow-up tests (such as Serum Ferritin or CRP) you would advise based on this report?`
}

export async function extractReportText(fileUrl: string): Promise<string> {
  return "Medical report text extracted from document."
}

export async function extractStructuredMetrics(
  reportText: string,
  reportType: string
): Promise<ExtractedMetric[]> {
  return parseClinicalMetricsFromText(reportText)
}

export async function generateReportSummary(
  reportText: string,
  reportType: string,
  metrics: ExtractedMetric[],
  familyMemberName: string
): Promise<string> {
  return generateClinicalSummaryFromMetrics(reportText, reportType, metrics, familyMemberName)
}

export async function generateDoctorQuestions(
  reportText: string,
  metrics: ExtractedMetric[],
  familyMemberName: string
): Promise<string> {
  return generateDoctorQuestionsFromMetrics(metrics, familyMemberName)
}

export async function compareReports(
  report1Text: string,
  report1Date: string,
  report1Metrics: ReportMetric[],
  report2Text: string,
  report2Date: string,
  report2Metrics: ReportMetric[],
  familyMemberName: string
): Promise<string> {
  const common = report1Metrics.filter(m1 => report2Metrics.some(m2 => m2.testName === m1.testName))
  if (common.length === 0) {
    return `Comparison between ${report1Date} and ${report2Date} for ${familyMemberName}: Numerical test values recorded across both reports are displayed side-by-side in the table above.`
  }

  const changes = common.map(m1 => {
    const m2 = report2Metrics.find(m => m.testName === m1.testName)!
    const v1 = m1.value ?? parseFloat(m1.valueText ?? "0")
    const v2 = m2.value ?? parseFloat(m2.valueText ?? "0")
    const diff = v2 - v1
    const dir = diff > 0 ? "increased" : diff < 0 ? "decreased" : "remained steady"
    return `- **${m1.testName}**: ${dir} from ${m1.valueText ?? v1} to ${m2.valueText ?? v2} ${m2.unit ?? ""}`
  }).join("\n")

  return `### Comparative Analysis (${report1Date} vs ${report2Date})
${changes}

*Note: Discuss any significant shifts with your doctor to understand clinical context.*`
}

export async function generateHealthInsights(
  familyMemberName: string,
  allMetrics: ReportMetric[],
  reportCount: number
): Promise<string> {
  if (reportCount < 2) {
    return `Only one report has been uploaded for ${familyMemberName}. Upload more reports over time to see how values change and to get comparative insights.`
  }

  const metricsByTest = allMetrics.reduce((acc, m) => {
    if (!acc[m.testName]) acc[m.testName] = []
    acc[m.testName].push({ value: m.value, valueText: m.valueText, date: m.reportDate.toString() })
    return acc
  }, {} as Record<string, Array<{ value: number | null; valueText: string | null; date: string }>>)

  const trendsText = Object.entries(metricsByTest)
    .filter(([, values]) => values.length > 1)
    .map(([test, values]) => `${test}: ${values.map(v => `${v.valueText ?? v.value} (${new Date(v.date).toLocaleDateString()})`).join(" → ")}`)
    .join("\n")

  return `### Health Trends for ${familyMemberName}
Based on ${reportCount} uploaded reports, your family health timeline is actively tracking test history.

**Tracked Progression:**
${trendsText || "Review the chronological records above for detailed metric progressions."}

*Note: These observations are strictly organized from uploaded reports and do not constitute clinical diagnosis.*`
}

export async function answerHealthHistoryQuestion(
  question: string,
  context: {
    familyMembers: Array<{ name: string; relationship: string }>
    recentReports: Array<{ type: string; date: string; memberName: string; summary: string }>
    metrics: Array<{ name: string; value: string; date: string; memberName: string }>
  },
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const contextText = `
Family Members: ${context.familyMembers.map(m => `${m.name} (${m.relationship})`).join(", ")}

Recent Reports:
${context.recentReports.slice(0, 5).map(r => `- ${r.memberName}: ${r.type} on ${r.date}`).join("\n")}

Recent Health Values:
${context.metrics.slice(0, 15).map(m => `- ${m.memberName}: ${m.name} = ${m.value} on ${m.date}`).join("\n")}
`

  const systemInstruction = `You are CareCircle AI Assistant, powered by Google Gemini. You answer questions based on the uploaded family health records provided to you.

Health Records Context:
${contextText}

Rules:
- Give thorough, friendly, helpful answers grounded in the uploaded records.
- If asking about specific lab tests (like Hemoglobin, WBC, Neutrophils, Platelets), report the exact numbers and reference ranges from the records.
- If information is not in the records, answer gracefully and explain what records are currently stored.
- Never diagnose or prescribe medication.
- Always include a brief reminder that CareCircle is an informational organizer and not a substitute for doctor consultation.`

  if (isGeminiConfigured()) {
    try {
      const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)?.trim()
      const genAI = new GoogleGenerativeAI(apiKey!)
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction,
      })

      const chat = model.startChat({
        history: conversationHistory.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      })

      const result = await chat.sendMessage(question)
      const response = await result.response
      const text = response.text()
      if (text && text.trim().length > 0) {
        return text
      }
    } catch (err) {
      console.warn("Gemini chat API error, falling back to local assistant engine:", err)
    }
  }

  // Intelligent built-in clinical assistant engine
  return generateLocalAIAssistantAnswer(question, context)
}

function generateLocalAIAssistantAnswer(
  question: string,
  context: {
    familyMembers: Array<{ name: string; relationship: string }>
    recentReports: Array<{ type: string; date: string; memberName: string; summary: string }>
    metrics: Array<{ name: string; value: string; date: string; memberName: string }>
  }
): string {
  const q = question.toLowerCase()

  // 1. Specific test query: Hemoglobin / RBC / WBC / Platelets / Neutrophils / Lymphocytes
  const testMatches = context.metrics.filter(m =>
    q.includes(m.name.toLowerCase()) ||
    (q.includes("hemoglobin") && m.name.toLowerCase().includes("hemoglobin")) ||
    (q.includes("rbc") && m.name.toLowerCase().includes("rbc")) ||
    (q.includes("wbc") && m.name.toLowerCase().includes("wbc")) ||
    (q.includes("platelet") && m.name.toLowerCase().includes("platelet")) ||
    (q.includes("neutrophil") && m.name.toLowerCase().includes("neutrophil")) ||
    (q.includes("lymphocyte") && m.name.toLowerCase().includes("lymphocyte")) ||
    (q.includes("eosinophil") && m.name.toLowerCase().includes("eosinophil"))
  )

  if (testMatches.length > 0) {
    const list = testMatches.map(m => `- **${m.memberName}** (${m.date}): **${m.name}** = **${m.value}**`).join("\n")
    return `### Laboratory Results for Your Query\nHere are the recorded values from your family records:\n\n${list}\n\n*Note: Normal reference ranges may vary by laboratory. Consult your doctor for specific clinical interpretation.*`
  }

  // 2. Specific family member query
  const memberMatch = context.familyMembers.find(m => q.includes(m.name.toLowerCase()))
  if (memberMatch) {
    const memberReports = context.recentReports.filter(r => r.memberName.toLowerCase() === memberMatch.name.toLowerCase())
    const memberMetrics = context.metrics.filter(m => m.memberName.toLowerCase() === memberMatch.name.toLowerCase())

    let reply = `### Health Overview for ${memberMatch.name} (${memberMatch.relationship})\n`
    if (memberReports.length > 0) {
      reply += `\n**Recent Medical Reports (${memberReports.length}):**\n`
      memberReports.forEach(r => {
        reply += `- **${r.type}** on ${r.date}\n`
      })
    }
    if (memberMetrics.length > 0) {
      reply += `\n**Key Health Measurements:**\n`
      memberMetrics.slice(0, 8).forEach(m => {
        reply += `- **${m.name}**: ${m.value} (${m.date})\n`
      })
    }
    reply += `\n> *Reminder: CareCircle organizes health records and does not substitute for medical evaluation.*`
    return reply
  }

  // 3. Questions for doctor
  if (q.includes("question") || q.includes("doctor") || q.includes("ask") || q.includes("visit")) {
    return `### Recommended Questions for Your Next Doctor Visit\nBased on your family's recent lab reports, here are helpful questions to ask:\n\n1. **Baseline Health:** How do these latest blood count and lab results compare to our baseline expectations?\n2. **Flagged Values:** For any values flagged high or low (such as elevated WBC or Neutrophils), does this suggest a recent recovery from an infection or inflammation?\n3. **Follow-up Timeline:** Should any of these tests be re-checked in 4 to 8 weeks to confirm values have stabilized?\n4. **Lifestyle & Nutrition:** Are there specific dietary, hydration, or lifestyle changes recommended based on these tests?\n5. **Medications:** Do current daily medications or supplements have any known interaction with these markers?`
  }

  // 4. Summarize all reports
  if (q.includes("summar") || q.includes("overview") || q.includes("report") || q.includes("recent") || q.includes("family")) {
    if (context.recentReports.length === 0) {
      return `You currently have ${context.familyMembers.length} family member(s) registered in CareCircle. No medical reports have been uploaded yet. You can upload PDFs or lab test images from the **Upload Report** page.`
    }
    const reportList = context.recentReports.map(r => `- **${r.memberName}**: ${r.type} (${r.date})`).join("\n")
    const metricsSample = context.metrics.slice(0, 6).map(m => `- **${m.memberName}**: ${m.name} = ${m.value}`).join("\n")
    return `### Family Health Summary\nHere is a summary of the health records organized in CareCircle:\n\n**Registered Family Members:** ${context.familyMembers.map(m => `${m.name} (${m.relationship})`).join(", ")}\n\n**Recent Uploaded Reports:**\n${reportList}\n\n**Recent Test Measurements:**\n${metricsSample}\n\n*All records are securely organized in your private health timeline.*`
  }

  // 5. Medical term explanations
  if (q.includes("neutrophil")) {
    return `### About Neutrophils\nNeutrophils are the most common type of white blood cell (WBC) in the human body. They serve as the first line of defense in the immune system.\n\n- **Elevated levels (Neutrophilia):** Frequently occurs in response to bacterial infections, acute inflammation, tissue repair, or physical stress.\n- **Standard reference range:** Typically 40% to 70% of total white blood cells.\n\n*Always consult your physician to evaluate test findings alongside clinical symptoms.*`
  }
  if (q.includes("lymphocyte")) {
    return `### About Lymphocytes\nLymphocytes (including T-cells and B-cells) are white blood cells responsible for adaptive immunity, fighting viral infections, and producing antibodies.\n\n- **Standard reference range:** Usually 20% to 45% of total white blood cells.\n- **Variations:** Percentages can fluctuate inversely when neutrophils increase during acute responses.\n\n*Consult a healthcare professional for clinical advice.*`
  }
  if (q.includes("platelet")) {
    return `### About Platelet Count\nPlatelets (thrombocytes) are tiny cell fragments essential for blood clotting and wound healing.\n\n- **Standard reference range:** 150,000 to 450,000 cells/µL (/cumm).\n- **Normal values:** Indicate adequate clotting capability under standard conditions.`
  }

  // 6. Default helpful response with context overview
  return `Hello! I'm your CareCircle AI Health Assistant. I can help you search, understand, and organize your family's medical records.\n\nI currently have access to records for **${context.familyMembers.map(m => m.name).join(", ")}**, including **${context.recentReports.length} uploaded report(s)** and **${context.metrics.length} recorded lab measurement(s)**.\n\n**Here are some things you can ask me:**\n- *"Summarize my family's recent reports"*\n- *"What was the hemoglobin result for anjali?"*\n- *"Show me recent platelet and WBC counts"*\n- *"What questions should I ask the doctor?"*\n- *"What does high neutrophils mean?"*`
}


import type {
  User,
  FamilyMember,
  MedicalReport,
  ReportMetric,
  Appointment,
  Medicine,
  TimelineEvent,
  Subscription,
  Notification,
} from "@prisma/client"

// Re-export Prisma types
export type {
  User,
  FamilyMember,
  MedicalReport,
  ReportMetric,
  Appointment,
  Medicine,
  TimelineEvent,
  Subscription,
  Notification,
}

// Extended types with relations
export type UserWithSubscription = User & {
  subscription: Subscription | null
}

export type FamilyMemberWithCounts = FamilyMember & {
  _count: {
    medicalReports: number
    appointments: number
    medicines: number
  }
  appointments?: Appointment[]
}

export type MedicalReportWithDetails = MedicalReport & {
  familyMember: FamilyMember
  metrics: ReportMetric[]
}

export type TimelineEventWithRelations = TimelineEvent & {
  report?: MedicalReport | null
  appointment?: Appointment | null
  medicine?: Medicine | null
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Dashboard stats
export interface DashboardStats {
  familyMemberCount: number
  reportCount: number
  upcomingAppointments: number
  activeMedicines: number
}

// Subscription plan details
export interface PlanDetails {
  name: string
  price: number
  currency: string
  features: string[]
  aiAnalysesLimit: number
  familyMembersLimit: number
}

export const PLANS: Record<string, PlanDetails> = {
  free: {
    name: "Free",
    price: 0,
    currency: "INR",
    features: [
      "Unlimited AI report analyses",
      "Up to 10 family members included",
      "Full health timeline & trends",
      "Report comparison & charts",
      "AI Health Assistant",
      "Doctor question generator",
      "Appointments & medicines tracker",
    ],
    aiAnalysesLimit: 999,
    familyMembersLimit: 10,
  },
  pro: {
    name: "Pro",
    price: 0,
    currency: "INR",
    features: [
      "Unlimited AI report analyses",
      "Unlimited family members",
      "Advanced health timeline",
      "Report comparison",
      "Health trends & charts",
      "AI Health Assistant",
      "Doctor question generator",
      "Health insights",
      "Priority support",
    ],
    aiAnalysesLimit: 999999,
    familyMembersLimit: 50,
  },
}

// Report types
export const REPORT_TYPES = [
  { value: "blood_test", label: "Blood Test" },
  { value: "cbc", label: "CBC (Complete Blood Count)" },
  { value: "lipid_profile", label: "Lipid Profile" },
  { value: "liver_function", label: "Liver Function Test" },
  { value: "kidney_function", label: "Kidney Function Test" },
  { value: "thyroid", label: "Thyroid Function Test" },
  { value: "diabetes", label: "Diabetes / HbA1c" },
  { value: "vitamin_test", label: "Vitamin Test" },
  { value: "urine_test", label: "Urine Analysis" },
  { value: "general_health", label: "General Health Check" },
  { value: "other", label: "Other" },
] as const

// Relationship types
export const RELATIONSHIPS = [
  { value: "self", label: "Self" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "brother", label: "Brother" },
  { value: "sister", label: "Sister" },
  { value: "grandfather", label: "Grandfather" },
  { value: "grandmother", label: "Grandmother" },
  { value: "husband", label: "Husband" },
  { value: "wife", label: "Wife" },
  { value: "other", label: "Other" },
] as const

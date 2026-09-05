import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isValid } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  if (!isValid(d)) return "—"
  return format(d, "dd MMM yyyy")
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  if (!isValid(d)) return "—"
  return format(d, "dd MMM yyyy, hh:mm a")
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  if (!isValid(d)) return "—"
  return formatDistanceToNow(d, { addSuffix: true })
}

export function calculateAge(dateOfBirth: Date | string | null | undefined): number | null {
  if (!dateOfBirth) return null
  const d = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth
  if (!isValid(d)) return null
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const monthDiff = today.getMonth() - d.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
    age--
  }
  return age
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getRelationshipEmoji(relationship: string): string {
  const map: Record<string, string> = {
    father: "👨",
    mother: "👩",
    son: "👦",
    daughter: "👧",
    brother: "👦",
    sister: "👧",
    grandfather: "👴",
    grandmother: "👵",
    husband: "👨",
    wife: "👩",
    self: "🙋",
    other: "👤",
  }
  return map[relationship.toLowerCase()] ?? "👤"
}

export function getReportTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    blood_test: "Blood Test",
    cbc: "CBC",
    lipid_profile: "Lipid Profile",
    liver_function: "Liver Function",
    kidney_function: "Kidney Function",
    thyroid: "Thyroid",
    diabetes: "Diabetes",
    vitamin_test: "Vitamin Test",
    urine_test: "Urine Test",
    general_health: "General Health Check",
    other: "Other",
  }
  return labels[type] ?? type
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + "..."
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

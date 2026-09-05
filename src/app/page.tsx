import Link from "next/link"
import { Heart, CheckCircle, ArrowRight, Shield, Brain, TrendingUp, Users, FileText, Clock, Star, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function LandingPage() {
  const { userId } = await auth()
  if (userId) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Heart className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">CareCircle</span>
          </Link>

          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="#features" className="hover:text-gray-900 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</Link>
            <Link href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Badge variant="info" className="mb-6 inline-flex items-center gap-1.5">
            <Star className="h-3 w-3" />
            Your family&apos;s private health memory
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Your family&apos;s health,
            <span className="text-blue-600"> organized</span>
            <br />
            in one circle.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Securely organize your family&apos;s medical records, understand health information
            more easily, and see how health records change over time.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
            <Button asChild size="xl">
              <Link href="/sign-up">
                Create Your CareCircle
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
            {["Free to start", "No credit card required", "Private & secure"].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {item}
              </div>
            ))}
          </div>

          {/* Dashboard preview */}
          <div className="mt-16 rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden max-w-4xl mx-auto">
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 text-center text-xs text-gray-400 font-mono">
                carecircle.app/dashboard
              </div>
            </div>
            <div className="p-6 text-left">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-bold text-gray-900">Good morning 👋</p>
                  <p className="text-sm text-gray-500">Here&apos;s your family&apos;s health overview.</p>
                </div>
                <Badge variant="info">⭐ Pro</Badge>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Family Members", value: "3", color: "blue" },
                  { label: "Total Reports", value: "12", color: "indigo" },
                  { label: "Upcoming Appts", value: "2", color: "green" },
                  { label: "Active Medicines", value: "4", color: "amber" },
                ].map((card) => (
                  <div key={card.label} className="rounded-lg border border-gray-100 p-3">
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                <p className="font-semibold text-sm">🧠 AI Health Insight</p>
                <p className="text-xs text-blue-100 mt-1">
                  Three blood reports have been uploaded for Father. Some recorded measurements changed
                  between the earliest and latest reports. Consider discussing these changes with your
                  healthcare professional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Sound familiar?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {[
              { emoji: "📱", problem: "Reports scattered across phones and WhatsApp" },
              { emoji: "📄", problem: "PDFs lost in email, paper reports in drawers" },
              { emoji: "🤔", problem: "Can't understand medical terminology" },
              { emoji: "📊", problem: "No way to compare reports over time" },
              { emoji: "🏥", problem: "Different doctors, different hospitals" },
              { emoji: "❓", problem: "Don't know what questions to ask the doctor" },
            ].map((item) => (
              <div key={item.problem} className="flex items-start gap-3 rounded-xl bg-white p-4 border border-gray-100 text-left">
                <span className="text-2xl">{item.emoji}</span>
                <p className="text-sm text-gray-600">{item.problem}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-lg font-semibold text-gray-900">
            CareCircle puts everything in one organized, private place.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How CareCircle works</h2>
            <p className="text-gray-500 mt-3">From scattered records to organized health memory in minutes.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Create Family Profiles",
                description: "Add each family member — Father, Mother, yourself — with their own health profile.",
                icon: Users,
                color: "bg-blue-100 text-blue-600",
              },
              {
                step: "2",
                title: "Upload Reports",
                description: "Upload PDFs, images of medical reports. CareCircle extracts and organizes the information.",
                icon: FileText,
                color: "bg-indigo-100 text-indigo-600",
              },
              {
                step: "3",
                title: "AI Explains & Compares",
                description: "Get simple explanations of reports. See how values changed between the last test and this one.",
                icon: Brain,
                color: "bg-purple-100 text-purple-600",
              },
              {
                step: "4",
                title: "Track Health Over Time",
                description: "A private health timeline shows appointments, medicines, and how records evolve.",
                icon: TrendingUp,
                color: "bg-green-100 text-green-600",
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="text-center">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${item.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-xs font-bold text-gray-400 mb-1">STEP {item.step}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Built for real families
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "🔄",
                title: "Report Comparison",
                description: "Compare two reports side-by-side. See which values changed, increased, or decreased.",
              },
              {
                icon: "📈",
                title: "Health Trends",
                description: "Visualize how hemoglobin, glucose, cholesterol, and other values change over time.",
              },
              {
                icon: "💬",
                title: "Doctor Questions",
                description: "AI generates specific questions you can discuss with your healthcare professional based on your reports.",
              },
              {
                icon: "📅",
                title: "Appointment Tracker",
                description: "Keep all doctor appointments organized with reminders about upcoming visits.",
              },
              {
                icon: "💊",
                title: "Medicine Tracker",
                description: "Track all active medications for each family member with dosage and frequency.",
              },
              {
                icon: "🔒",
                title: "Completely Private",
                description: "Your health data is private. No data sharing, no ads, no selling your information.",
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl bg-white border border-gray-100 p-6">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / All Features Included */}
      <section id="pricing" className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="success" className="mb-3">100% Free & Unlocked</Badge>
            <h2 className="text-3xl font-bold text-gray-900">All features included. Zero cost.</h2>
            <p className="text-gray-500 mt-3">Every tool you need to care for your entire family, completely free.</p>
          </div>
          <div className="max-w-2xl mx-auto rounded-3xl border-2 border-blue-600 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blue-400/30">
              <div>
                <h3 className="text-2xl font-bold text-white">Family Plan</h3>
                <p className="text-blue-100 text-sm mt-1">Full access for your entire household</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-4xl font-extrabold text-white">₹0</span>
                <span className="text-blue-200 text-sm ml-1 font-medium">/ forever</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {[
                "10+ Family member profiles",
                "Unlimited AI report analyses",
                "AI Health Assistant chat",
                "Side-by-side report comparisons",
                "Health trends & lab charts",
                "AI health insights & summaries",
                "Medicine & dosage tracker",
                "Doctor appointment reminders",
                "Original document photo storage",
                "Private, encrypted & secure",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-blue-50">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-blue-400/30">
              <Button asChild size="xl" className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-lg">
                <Link href="/sign-up">
                  Get Started Free Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Medical disclaimer */}
      <section className="py-8 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              <strong>Medical Disclaimer:</strong> CareCircle is designed to help organize and explain health
              information in simpler language. It is not a doctor and does not provide medical diagnosis or treatment.
              CareCircle AI should not be used to make medical decisions. Always consult a qualified healthcare
              professional for medical decisions.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-600 to-indigo-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Start organizing your family&apos;s health today.
          </h2>
          <p className="text-blue-200 mt-4 text-lg">
            Free to start. No credit card required.
          </p>
          <Button asChild size="xl" className="mt-8 bg-white text-blue-600 hover:bg-blue-50 font-semibold">
            <Link href="/sign-up">
              Create Your CareCircle
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                <Heart className="h-3.5 w-3.5 text-white fill-white" />
              </div>
              <span className="font-bold text-white">CareCircle</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2026 CareCircle. Not a medical device.
            </p>
            <div className="flex gap-4 text-sm text-gray-400">
              <Link href="/sign-in" className="hover:text-white transition-colors">Sign In</Link>
              <Link href="/sign-up" className="hover:text-white transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

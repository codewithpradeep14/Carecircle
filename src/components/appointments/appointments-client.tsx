"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Appointment, FamilyMember } from "@prisma/client"
import { Calendar, Plus, Trash2, Clock, MapPin, User, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, getRelationshipEmoji } from "@/lib/utils"
import { toast } from "sonner"
import { format, isPast } from "date-fns"

type AppointmentWithMember = Appointment & { familyMember: FamilyMember }

interface AppointmentsClientProps {
  appointments: AppointmentWithMember[]
  familyMembers: FamilyMember[]
}

export function AppointmentsClient({ appointments: init, familyMembers }: AppointmentsClientProps) {
  const router = useRouter()
  const [appointments, setAppointments] = useState(init)
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    familyMemberId: familyMembers[0]?.id ?? "",
    doctorName: "",
    specialty: "",
    date: "",
    time: "",
    location: "",
    notes: "",
  })

  const upcoming = appointments.filter((a) => !isPast(new Date(a.date)) && a.status === "upcoming")
  const past = appointments.filter((a) => isPast(new Date(a.date)) || a.status !== "upcoming")

  async function handleAdd() {
    if (!form.doctorName || !form.date || !form.familyMemberId) {
      toast.error("Please fill in required fields")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to add appointment")
      const { appointment } = await res.json()
      toast.success("Appointment added")
      setShowAdd(false)
      setForm({ familyMemberId: familyMembers[0]?.id ?? "", doctorName: "", specialty: "", date: "", time: "", location: "", notes: "" })
      router.refresh()
    } catch {
      toast.error("Failed to add appointment")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await fetch(`/api/appointments/${deleteId}`, { method: "DELETE" })
      setAppointments(appointments.filter((a) => a.id !== deleteId))
      toast.success("Appointment deleted")
    } catch {
      toast.error("Failed to delete")
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-0.5">{upcoming.length} upcoming</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Appointment
        </Button>
      </div>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-green-50 flex items-center justify-center">
            <Calendar className="h-8 w-8 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">No appointments yet</h2>
            <p className="text-gray-500 text-sm mt-1">Add your doctor appointments to keep track of your healthcare schedule.</p>
          </div>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            Add Appointment
          </Button>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} onDelete={() => setDeleteId(a.id)} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Past</h2>
              <div className="space-y-3 opacity-60">
                {past.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} onDelete={() => setDeleteId(a.id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Appointment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Family Member *</Label>
              <Select value={form.familyMemberId} onValueChange={(v) => setForm({ ...form, familyMemberId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {familyMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Doctor Name *</Label>
                <Input placeholder="Dr. Name" value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Input placeholder="e.g. Cardiology" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="Hospital / Clinic name" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Any notes or preparation needed..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={loading || !form.doctorName || !form.date}>
              {loading ? "Adding..." : "Add Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Appointment?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">This will permanently delete this appointment.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AppointmentCard({ appointment: a, onDelete }: { appointment: AppointmentWithMember; onDelete: () => void }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-gray-900">Dr. {a.doctorName}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  {a.specialty && <span className="text-xs text-blue-600">{a.specialty}</span>}
                  <Badge variant="secondary" className="text-xs">{a.familyMember.name}</Badge>
                </div>
              </div>
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(a.date)}
              </div>
              {a.time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {a.time}
                </div>
              )}
              {a.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {a.location}
                </div>
              )}
            </div>
            {a.notes && <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{a.notes}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

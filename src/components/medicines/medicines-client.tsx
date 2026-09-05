"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Medicine, FamilyMember } from "@prisma/client"
import { Pill, Plus, Trash2, Clock, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

type MedicineWithMember = Medicine & { familyMember: FamilyMember }

interface MedicinesClientProps {
  medicines: MedicineWithMember[]
  familyMembers: FamilyMember[]
}

export function MedicinesClient({ medicines: init, familyMembers }: MedicinesClientProps) {
  const router = useRouter()
  const [medicines, setMedicines] = useState(init)
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    familyMemberId: familyMembers[0]?.id ?? "",
    name: "",
    dosage: "",
    frequency: "",
    startDate: "",
    endDate: "",
    notes: "",
  })

  const active = medicines.filter((m) => m.isActive)
  const inactive = medicines.filter((m) => !m.isActive)

  // Group active by family member
  const byMember = active.reduce((acc, m) => {
    const key = m.familyMember.name
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {} as Record<string, MedicineWithMember[]>)

  async function handleAdd() {
    if (!form.name || !form.familyMemberId) {
      toast.error("Please fill in medicine name and family member")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to add medicine")
      toast.success("Medicine added")
      setShowAdd(false)
      setForm({ familyMemberId: familyMembers[0]?.id ?? "", name: "", dosage: "", frequency: "", startDate: "", endDate: "", notes: "" })
      router.refresh()
    } catch {
      toast.error("Failed to add medicine")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await fetch(`/api/medicines/${deleteId}`, { method: "DELETE" })
      setMedicines(medicines.filter((m) => m.id !== deleteId))
      toast.success("Medicine removed")
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
          <h1 className="text-2xl font-bold text-gray-900">Medicines</h1>
          <p className="text-gray-500 mt-0.5">{active.length} active medicines</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Medicine
        </Button>
      </div>

      {medicines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Pill className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">No medicines tracked</h2>
            <p className="text-gray-500 text-sm mt-1">Add medicines to keep track of current medications for your family.</p>
          </div>
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" />Add Medicine</Button>
        </div>
      ) : (
        <>
          {Object.entries(byMember).map(([memberName, meds]) => (
            <div key={memberName}>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700 font-bold">
                  {memberName[0]}
                </span>
                {memberName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {meds.map((m) => (
                  <MedicineCard key={m.id} medicine={m} onDelete={() => setDeleteId(m.id)} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Medicine</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Family Member *</Label>
              <Select value={form.familyMemberId} onValueChange={(v) => setForm({ ...form, familyMemberId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {familyMembers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Medicine Name *</Label>
              <Input placeholder="e.g. Metformin" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Dosage</Label>
                <Input placeholder="e.g. 500mg" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Input placeholder="e.g. Twice daily" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Any notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={loading || !form.name}>{loading ? "Adding..." : "Add Medicine"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Medicine?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">This will remove this medicine from the tracker.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MedicineCard({ medicine: m, onDelete }: { medicine: MedicineWithMember; onDelete: () => void }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💊</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-gray-900 truncate">{m.name}</h3>
              <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {(m.dosage || m.frequency) && (
              <div className="flex flex-wrap gap-2 mt-1">
                {m.dosage && <Badge variant="secondary" className="text-xs">{m.dosage}</Badge>}
                {m.frequency && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {m.frequency}
                  </div>
                )}
              </div>
            )}
            {m.startDate && (
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <Calendar className="h-3 w-3" />
                Since {formatDate(m.startDate)}
                {m.endDate && ` — Until ${formatDate(m.endDate)}`}
              </div>
            )}
            {m.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{m.notes}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

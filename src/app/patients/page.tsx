"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { patients as allPatients, inventory } from "@/lib/data"
import type { Patient } from "@/lib/types"
import { PlusCircle, UserPlus, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"

export default function PatientsPage() {
  const [patients, setPatients] = React.useState<Patient[]>(allPatients);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast()
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [newPatientName, setNewPatientName] = React.useState("");
  const [selectedMeds, setSelectedMeds] = React.useState<string[]>([]);
  const [medSearch, setMedSearch] = React.useState("");


  const handleAddPatient = () => {
    if (!newPatientName.trim()) {
        toast({ title: "خطأ", description: "الرجاء إدخال اسم المريض.", variant: "destructive"});
        return;
    }

    const newPatient: Patient = {
        id: `PAT${(patients.length + 1).toString().padStart(3, '0')}`,
        name: newPatientName,
        medications: selectedMeds.map(medId => {
            const med = inventory.find(m => m.id === medId)!;
            return { medicationId: med.id, name: med.name };
        })
    };

    setPatients(prev => [newPatient, ...prev]);
    toast({ title: "نجاح", description: `تمت إضافة المريض ${newPatient.name} بنجاح.` });
    
    // Reset form and close dialog
    setNewPatientName("");
    setSelectedMeds([]);
    setMedSearch("");
    setIsDialogOpen(false);
  }

  const handleMedToggle = (medId: string) => {
    setSelectedMeds(prev => prev.includes(medId) ? prev.filter(id => id !== medId) : [...prev, medId]);
  }

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredMeds = inventory.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase()));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>أصدقاء الصيدلية</CardTitle>
                <CardDescription>
                إدارة ملفات المرضى وتتبع أدويتهم المعتادة.
                </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button><UserPlus className="me-2"/> إضافة مريض جديد</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>إضافة مريض جديد</DialogTitle>
                        <DialogDescription>
                            أدخل تفاصيل المريض واختر أدويته المعتادة.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="patient-name" className="text-right">اسم المريض</Label>
                            <Input id="patient-name" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} className="col-span-3" placeholder="مثال: محمد عبدالله" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="meds" className="text-right pt-2">الأدوية المعتادة</Label>
                            <div className="col-span-3 border rounded-md p-2 space-y-2">
                                <Input placeholder="ابحث عن دواء لإضافته..." value={medSearch} onChange={e => setMedSearch(e.target.value)} />
                                <ScrollArea className="h-[200px]">
                                <div className="space-y-2 p-2">
                                  {filteredMeds.map(med => (
                                      <div key={med.id} className="flex items-center space-x-2 space-x-reverse">
                                          <Checkbox id={`med-${med.id}`} checked={selectedMeds.includes(med.id)} onCheckedChange={() => handleMedToggle(med.id)} />
                                          <Label htmlFor={`med-${med.id}`} className="flex-1 cursor-pointer">{med.name}</Label>
                                      </div>
                                  ))}
                                </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                           <Button variant="outline">إلغاء</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleAddPatient}>إضافة المريض</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        <div className="pt-4">
          <Input 
            placeholder="ابحث عن مريض بالاسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredPatients.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.map((patient) => (
              <Card key={patient.id}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="text-primary"/>
                        {patient.name}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <h4 className="font-semibold mb-2">الأدوية المعتادة:</h4>
                    {patient.medications.length > 0 ? (
                        <ul className="list-disc pe-4 space-y-1 text-sm text-muted-foreground">
                            {patient.medications.map(med => (
                                <li key={med.medicationId}>{med.name}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">لا توجد أدوية مسجلة.</p>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
            <div className="text-center py-16 text-muted-foreground">
                <p>لم يتم العثور على مرضى. حاول تغيير مصطلح البحث أو أضف مريضًا جديدًا.</p>
            </div>
        )}
      </CardContent>
    </Card>
  )
}

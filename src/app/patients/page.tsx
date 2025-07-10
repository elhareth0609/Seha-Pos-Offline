
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { patients as fallbackPatients, inventory as fallbackInventory, trash as fallbackTrash } from "@/lib/data"
import type { Patient, Medication, TrashItem } from "@/lib/types"
import { PlusCircle, UserPlus, Users, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

export default function PatientsPage() {
  const [patients, setPatients] = useLocalStorage<Patient[]>('patients', fallbackPatients);
  const [inventory, setInventory] = useLocalStorage<Medication[]>('inventory', fallbackInventory);
  const [trash, setTrash] = useLocalStorage<TrashItem[]>('trash', fallbackTrash);
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newPatientName, setNewPatientName] = React.useState("");
  const [newPatientNotes, setNewPatientNotes] = React.useState("");
  const [selectedMeds, setSelectedMeds] = React.useState<string[]>([]);
  const [medSearch, setMedSearch] = React.useState("");
  
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const resetAddDialog = () => {
    setNewPatientName("");
    setNewPatientNotes("");
    setSelectedMeds([]);
    setMedSearch("");
    setIsAddDialogOpen(false);
  }

  const handleAddPatient = () => {
    if (!newPatientName.trim()) {
        toast({ title: "خطأ", description: "الرجاء إدخال اسم المريض.", variant: "destructive"});
        return;
    }

    const newPatient: Patient = {
        id: `PAT${(patients.length + 1).toString().padStart(3, '0')}`,
        name: newPatientName,
        notes: newPatientNotes,
        medications: selectedMeds.map(medId => {
            const med = inventory.find(m => m.id === medId)!;
            return { medicationId: med.id, name: med.tradeName, saleUnit: med.saleUnit };
        })
    };
    
    setPatients(prev => [newPatient, ...prev]);
    toast({ title: "نجاح", description: `تمت إضافة المريض ${newPatient.name} بنجاح.` });
    resetAddDialog();
  }

  const openEditDialog = (patient: Patient) => {
    setEditingPatient(patient);
    setSelectedMeds(patient.medications.map(m => m.medicationId));
    setIsEditDialogOpen(true);
  }

  const handleEditPatient = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editingPatient) return;

      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const notes = formData.get("notes") as string;
      
      const updatedPatient: Patient = { 
        ...editingPatient, 
        name, 
        notes,
        medications: selectedMeds.map(medId => {
            const med = inventory.find(m => m.id === medId)!;
            return { medicationId: med.id, name: med.tradeName, saleUnit: med.saleUnit };
        })
      };
      
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
      toast({ title: "تم تحديث بيانات المريض بنجاح."});
      setIsEditDialogOpen(false);
      setEditingPatient(null);
      setSelectedMeds([]);
  }

  const handleDeletePatient = (patient: Patient) => {
      const newTrashItem: TrashItem = {
        id: `TRASH-${Date.now()}`,
        deletedAt: new Date().toISOString(),
        itemType: 'patient',
        data: patient,
      };
      setTrash(prev => [newTrashItem, ...prev]);
      setPatients(prev => prev.filter(p => p.id !== patient.id));
      toast({ title: "تم نقل المريض إلى سلة المحذوفات."});
  }


  const handleMedToggle = (medId: string) => {
    setSelectedMeds(prev => prev.includes(medId) ? prev.filter(id => id !== medId) : [...prev, medId]);
  }

  const filteredPatients = patients.filter(p => p.name.toLowerCase().startsWith(searchTerm.toLowerCase()));
  const filteredMeds = inventory.filter(m => m.tradeName && m.tradeName.toLowerCase().startsWith(medSearch.toLowerCase()));

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
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="success"><UserPlus className="me-2"/> إضافة مريض جديد</Button>
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
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="patient-notes" className="text-right">ملاحظات</Label>
                            <Textarea id="patient-notes" value={newPatientNotes} onChange={(e) => setNewPatientNotes(e.target.value)} className="col-span-3" placeholder="ملاحظات حول المريض..." />
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
                                          <Label htmlFor={`med-${med.id}`} className="flex-1 cursor-pointer">{med.tradeName} {med.saleUnit && `(${med.saleUnit})`}</Label>
                                      </div>
                                  ))}
                                </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                           <Button variant="outline" onClick={resetAddDialog}>إلغاء</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleAddPatient} variant="success">إضافة المريض</Button>
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
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>المعرف</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الأدوية المعتادة</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                 {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                     <TableRow key={patient.id}>
                        <TableCell>{patient.id}</TableCell>
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell>
                            {patient.medications.length > 0 ? patient.medications.map(m => `${m.name}${m.saleUnit ? ` (${m.saleUnit})` : ''}`).join(', ') : 'لا يوجد'}
                        </TableCell>
                        <TableCell>{patient.notes || 'لا يوجد'}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                                    <DropdownMenuItem onSelect={() => openEditDialog(patient)}>
                                        <Pencil className="me-2 h-4 w-4"/>
                                        تعديل
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button className="text-destructive relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground">
                                                <Trash2 className="me-2 h-4 w-4"/>
                                                حذف
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>هل أنت متأكد من حذف {patient.name}؟</DialogTitle>
                                                <DialogDescription>
                                                    سيتم نقل هذا المريض إلى سلة المحذوفات.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                                <Button variant="destructive" onClick={() => handleDeletePatient(patient)}>نعم، قم بالحذف</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                     </TableRow>
                 )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            لم يتم العثور على مرضى. حاول تغيير مصطلح البحث أو أضف مريضًا جديدًا.
                        </TableCell>
                    </TableRow>
                 )}
            </TableBody>
        </Table>
      </CardContent>
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>تعديل بيانات المريض</DialogTitle>
                </DialogHeader>
                {editingPatient && (
                    <form onSubmit={handleEditPatient} className="space-y-4 pt-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-patient-name" className="text-right">اسم المريض</Label>
                            <Input id="edit-patient-name" name="name" defaultValue={editingPatient.name} required className="col-span-3"/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-patient-notes" className="text-right">ملاحظات</Label>
                            <Textarea id="edit-patient-notes" name="notes" defaultValue={editingPatient.notes} className="col-span-3"/>
                        </div>
                         <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="edit-meds" className="text-right pt-2">الأدوية المعتادة</Label>
                            <div className="col-span-3 border rounded-md p-2 space-y-2">
                                <Input placeholder="ابحث عن دواء لإضافته..." value={medSearch} onChange={e => setMedSearch(e.target.value)} />
                                <ScrollArea className="h-[200px]">
                                <div className="space-y-2 p-2">
                                  {filteredMeds.map(med => (
                                      <div key={`edit-${med.id}`} className="flex items-center space-x-2 space-x-reverse">
                                          <Checkbox id={`edit-med-${med.id}`} checked={selectedMeds.includes(med.id)} onCheckedChange={() => handleMedToggle(med.id)} />
                                          <Label htmlFor={`edit-med-${med.id}`} className="flex-1 cursor-pointer">{med.tradeName} {med.saleUnit && `(${med.saleUnit})`}</Label>
                                      </div>
                                  ))}
                                </div>
                                </ScrollArea>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline" type="button">إلغاء</Button></DialogClose>
                            <Button type="submit" variant="success">حفظ التغييرات</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    </Card>
  )
}

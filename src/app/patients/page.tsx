
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
import type { Patient } from "@/lib/types"
import { UserPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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
import { useAuth } from "@/hooks/use-auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

export default function PatientsPage() {
  const { addPatient, updatePatient, deletePatient, getPaginatedPatients } = useAuth();
  
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newPatientName, setNewPatientName] = React.useState("");
  const [newPatientPhone, setNewPatientPhone] = React.useState("");
  
  const [addNameError, setAddNameError] = React.useState("");
  const [addPhoneError, setAddPhoneError] = React.useState("");
  
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  
  const [editNameError, setEditNameError] = React.useState("");
  const [editPhoneError, setEditPhoneError] = React.useState("");
  

  const fetchData = React.useCallback(async (page: number, limit: number, search: string) => {
    setLoading(true);
    try {
      const data = await getPaginatedPatients(page, limit, search);
      setPatients(data.data);
      setTotalPages(data.last_page);
      setCurrentPage(data.current_page);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    } finally {
      setLoading(false);
    }
  }, [getPaginatedPatients]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
        fetchData(currentPage, perPage, searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [currentPage, perPage, searchTerm, fetchData]);


  const resetAddDialog = () => {
    setNewPatientName("");
    setNewPatientPhone("");
    setAddNameError("");
    setAddPhoneError("");
    setIsAddDialogOpen(false);
  }
  
  const validateAddForm = () => {
    let isValid = true;
    setAddNameError("");
    setAddPhoneError("");
    
    if (!newPatientName.trim()) {
      setAddNameError("الاسم مطلوب");
      isValid = false;
    } else if (newPatientName.trim().length < 2) {
      setAddNameError("الاسم يجب أن يكون حرفين على الأقل");
      isValid = false;
    }
    
    if (newPatientPhone.trim() && !/^[0-9+\- ]+$/.test(newPatientPhone)) {
        setAddPhoneError("رقم الهاتف يجب أن يحتوي على أرقام فقط");
        isValid = false;
    }
    
    return isValid;
  }
  
  const handleAddPatient = async () => {
    if (!validateAddForm()) return;
    
    const success = await addPatient(newPatientName, newPatientPhone);
    if (success) {
      fetchData(1, perPage, ""); // Refresh data
      resetAddDialog();
    }
  }
  
  const openEditDialog = (patient: Patient) => {
    setEditingPatient(patient);
    setEditNameError("");
    setEditPhoneError("");
    setIsEditDialogOpen(true);
  }
  
  const validateEditForm = (name: string, phone: string) => {
    let isValid = true;
    setEditNameError("");
    setEditPhoneError("");
    
    if (!name.trim()) {
      setEditNameError("الاسم مطلوب");
      isValid = false;
    } else if (name.trim().length < 2) {
      setEditNameError("الاسم يجب أن يكون حرفين على الأقل");
      isValid = false;
    }
    
    if (phone.trim() && !/^[0-9+\- ]+$/.test(phone)) {
      setEditPhoneError("رقم الهاتف يجب أن يحتوي على أرقام فقط");
      isValid = false;
    }
    
    return isValid;
  }
  
  const handleEditPatient = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editingPatient) return;
      
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const phone = formData.get("phone") as string;
      
      if (!validateEditForm(name, phone)) return;
      
      const success = await updatePatient(editingPatient.id, { name, phone });
      
      if(success) {
        fetchData(currentPage, perPage, searchTerm); // Refresh current page
        setIsEditDialogOpen(false);
        setEditingPatient(null);
      }
  }
  
  const handleDeletePatient = async (patientId: string) => {
      const success = await deletePatient(patientId);
      if(success) fetchData(currentPage, perPage, searchTerm);
  }
  
    const handlePhoneInput = (value: string) => {
        // Remove all non-digit characters except + and -
        return value.replace(/[^\d+-]/g, '');
    };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>أصدقاء الصيدلية</CardTitle>
                <CardDescription>
                إدارة ملفات المرضى (الزبائن الدائمين).
                </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="success"><UserPlus className="me-2"/> إضافة صديق جديد</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>إضافة صديق جديد</DialogTitle>
                        <DialogDescription>
                            أدخل تفاصيل المريض لحفظها في سجلاتك.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="patient-name" className="text-right">الاسم</Label>
                            <div className="col-span-3">
                                <Input 
                                    id="patient-name" 
                                    type="text" 
                                    value={newPatientName} 
                                    onChange={(e) => setNewPatientName(e.target.value)} 
                                    className={addNameError ? "border-destructive" : ""} 
                                    placeholder="مثال: محمد عبدالله" 
                                    required 
                                />
                                {addNameError && <p className="text-sm text-destructive mt-1">{addNameError}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="patient-phone" className="text-right">رقم الهاتف</Label>
                            <div className="col-span-3">
                                <Input 
                                    id="patient-phone" 
                                    type="tel" 
                                    value={newPatientPhone} 
                                    onChange={(e) => setNewPatientPhone(e.target.value)} 
                                    className={addPhoneError ? "border-destructive" : ""} 
                                    placeholder="اختياري" 
                                />
                                {addPhoneError && <p className="text-sm text-destructive mt-1">{addPhoneError}</p>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" onClick={resetAddDialog}>إلغاء</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleAddPatient} variant="success">إضافة</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        <div className="pt-4 flex flex-wrap gap-2">
          <Input 
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
           <div className="flex items-center gap-2">
              <Label htmlFor="per-page" className="shrink-0">لكل صفحة:</Label>
              <Select value={String(perPage)} onValueChange={(val) => setPerPage(Number(val))}>
                <SelectTrigger id="per-page" className="w-20 h-9">
                  <SelectValue placeholder={perPage} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>المعرف</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                 {loading ? Array.from({length: perPage}).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                 )) : patients.length > 0 ? patients.map((patient) => (
                     <TableRow key={patient.id}>
                        <TableCell>{patient.id}</TableCell>
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{patient.phone || 'لا يوجد'}</TableCell>
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
                                                    سيتم حذف هذا المريض نهائياً. لا يمكن التراجع عن هذا الإجراء.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                                <Button variant="destructive" onClick={() => handleDeletePatient(patient.id)}>نعم، قم بالحذف</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                     </TableRow>
                 )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            لم يتم العثور على مرضى. حاول تغيير مصطلح البحث أو أضف مريضًا جديدًا.
                        </TableCell>
                    </TableRow>
                 )}
            </TableBody>
        </Table>
        </div>
         <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-muted-foreground">
                  الصفحة {currentPage} من {totalPages}
              </span>
              <div className="flex gap-2">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1 || loading}
                  >
                      السابق
                  </Button>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || loading}
                  >
                      التالي
                  </Button>
              </div>
          </div>
      </CardContent>
       <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
                setEditingPatient(null);
                setEditNameError("");
                setEditPhoneError("");
            }
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>تعديل بيانات المريض</DialogTitle>
                </DialogHeader>
                {editingPatient && (
                    <form onSubmit={handleEditPatient} className="space-y-4 pt-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-patient-name" className="text-right">الاسم</Label>
                            <div className="col-span-3">
                                <Input 
                                    id="edit-patient-name" 
                                    name="name" 
                                    defaultValue={editingPatient.name} 
                                    required 
                                    className={editNameError ? "border-destructive" : ""} 
                                />
                                {editNameError && <p className="text-sm text-destructive mt-1">{editNameError}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-patient-phone" className="text-right">رقم الهاتف</Label>
                            <div className="col-span-3">
                                <Input 
                                    id="edit-patient-phone" 
                                    name="phone" 
                                    type="tel" 
                                    defaultValue={editingPatient.phone || ''} 
                                    onChange={(e) => {
                                        const input = e.target as HTMLInputElement;
                                        input.value = handlePhoneInput(input.value);
                                        const event = new Event('input', { bubbles: true });
                                        input.dispatchEvent(event);
                                    }}

                                    className={editPhoneError ? "border-destructive" : ""} 
                                />
                                {editPhoneError && <p className="text-sm text-destructive mt-1">{editPhoneError}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                            <Button type="submit" variant="success">حفظ التغييرات</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    </Card>
  )
}
    


"use client"
import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import type { Patient, Sale, PatientPayment } from "@/lib/types"
import { UserPlus, MoreHorizontal, Pencil, Trash2, Wallet, FileText, ChevronDown } from "lucide-react"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/hooks/use-auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

type StatementItem = {
    date: string;
    type: 'فاتورة' | 'دفعة';
    details: string;
    debit: number; // For sales
    credit: number; // For payments
    balance: number;
};


export default function PatientsPage() {
  const { addPatient, updatePatient, deletePatient, getPaginatedPatients, scopedData, addPatientPayment } = useAuth();
  
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();
  
  const { sales: [sales], payments: [allPayments] } = scopedData;

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newPatientName, setNewPatientName] = React.useState("");
  const [newPatientPhone, setNewPatientPhone] = React.useState("");
  
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const [isStatementOpen, setIsStatementOpen] = React.useState(false);
  const [statementData, setStatementData] = React.useState<{ patient: Patient | null; items: StatementItem[] }>({ patient: null, items: [] });
  const [selectedPatientForPayment, setSelectedPatientForPayment] = React.useState<Patient | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  
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
    setIsAddDialogOpen(false);
  }
  
  const handleAddPatient = async () => {
    if (!newPatientName.trim()) {
        toast({ variant: 'destructive', title: "الاسم مطلوب" });
        return;
    }
    const success = await addPatient(newPatientName, newPatientPhone);
    if (success) {
      fetchData(1, perPage, ""); // Refresh data
      resetAddDialog();
    }
  }
  
  const openEditDialog = (patient: Patient) => {
    setEditingPatient(patient);
    setIsEditDialogOpen(true);
  }
  
  const handleEditPatient = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editingPatient) return;
      
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const phone = formData.get("phone") as string;
      
       if (!name.trim()) {
            toast({ variant: 'destructive', title: "الاسم مطلوب" });
            return;
        }
      
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

  const handleAddPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPatientForPayment) return;

    const formData = new FormData(event.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const notes = formData.get('notes') as string;

    const success = await addPatientPayment(selectedPatientForPayment.id, amount, notes);
    if (success) {
        setIsPaymentDialogOpen(false);
        setSelectedPatientForPayment(null);
    }
  }
  
  const patientDebts = React.useMemo(() => {
    const debts: { [patientId: string]: number } = {};
    if (!sales || !allPayments || !allPayments.patientPayments) {
        return debts;
    }

    sales.forEach(sale => {
        if (sale.patient_id && sale.payment_method === 'credit') {
            debts[sale.patient_id] = (debts[sale.patient_id] || 0) + sale.total;
        }
    });

    allPayments.patientPayments.forEach(payment => {
        if (debts[payment.patient_id]) {
            debts[payment.patient_id] -= payment.amount;
        }
    });
    return debts;
  }, [sales, allPayments]);

  const handleShowStatement = (patient: Patient) => {
        const patientSales = sales
            .filter(s => s.patient_id === patient.id && s.payment_method === 'credit')
            .map(s => ({ date: s.date, type: 'فاتورة' as const, details: `فاتورة #${s.id}`, debit: s.total, credit: 0 }));

        const patientPayments = (allPayments.patientPayments || [])
            .filter(p => p.patient_id === patient.id)
            .map(p => ({ date: p.date, type: 'دفعة' as const, details: `دفعة نقدية ${p.notes ? `(${p.notes})` : ''}`, debit: 0, credit: p.amount }));
        
        const allTransactions = [...patientSales, ...patientPayments]
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningBalance = 0;
        const statementItems = allTransactions.map(t => {
            runningBalance += t.debit - t.credit;
            return { ...t, balance: runningBalance };
        });

        setStatementData({ patient, items: statementItems.reverse() });
        setIsStatementOpen(true);
    };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>أصدقاء الصيدلية</CardTitle>
                <CardDescription>
                إدارة ملفات المرضى (الزبائن الدائمين) وديونهم.
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
                        <div className="space-y-2">
                            <Label htmlFor="patient-name">الاسم</Label>
                             <Input 
                                id="patient-name" 
                                type="text" 
                                value={newPatientName} 
                                onChange={(e) => setNewPatientName(e.target.value)} 
                                placeholder="مثال: محمد عبدالله" 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="patient-phone">رقم الهاتف</Label>
                            <Input 
                                id="patient-phone" 
                                type="tel" 
                                value={newPatientPhone} 
                                onChange={(e) => setNewPatientPhone(e.target.value)} 
                                placeholder="اختياري" 
                            />
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
                    <TableHead>الاسم</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>إجمالي الدين</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                 {loading ? Array.from({length: perPage}).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                    </TableRow>
                 )) : patients.length > 0 ? patients.map((patient) => (
                     <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{patient.phone || 'لا يوجد'}</TableCell>
                        <TableCell className="font-mono font-semibold text-destructive">{(patientDebts[patient.id] || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-left">
                            <div className="flex justify-end gap-1">
                                <Button variant="outline" size="sm" onClick={() => handleShowStatement(patient)}><FileText className="me-2 h-3 w-3"/>كشف حساب</Button>
                                <Button variant="success" size="sm" onClick={() => { setSelectedPatientForPayment(patient); setIsPaymentDialogOpen(true); }}><Wallet className="me-2 h-3 w-3"/>تسديد</Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => openEditDialog(patient)}>
                                            <Pencil className="me-2 h-4 w-4"/>
                                            تعديل
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button className="text-destructive relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground">
                                                    <Trash2 className="me-2 h-4 w-4"/>
                                                    حذف
                                                </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <DialogTitle>هل أنت متأكد من حذف {patient.name}؟</DialogTitle>
                                                    <AlertDialogDescription>
                                                        سيتم حذف هذا المريض نهائياً. لا يمكن التراجع عن هذا الإجراء.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                                    <Button variant="destructive" onClick={() => handleDeletePatient(patient.id)}>نعم، قم بالحذف</Button>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
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
    </Card>
    
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>تعديل بيانات المريض</DialogTitle>
            </DialogHeader>
            {editingPatient && (
                <form onSubmit={handleEditPatient} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-patient-name">الاسم</Label>
                        <Input id="edit-patient-name" name="name" defaultValue={editingPatient.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-patient-phone">رقم الهاتف</Label>
                        <Input id="edit-patient-phone" name="phone" type="tel" defaultValue={editingPatient.phone || ''} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                        <Button type="submit" variant="success">حفظ التغييرات</Button>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
    </Dialog>
     <Dialog open={isStatementOpen} onOpenChange={setIsStatementOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>كشف حساب: {statementData.patient?.name}</DialogTitle>
                <DialogDescription>عرض تفصيلي لجميع الحركات المالية للمريض.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] mt-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>البيان</TableHead>
                            <TableHead>مدين (عليه)</TableHead>
                            <TableHead>دائن (له)</TableHead>
                            <TableHead>الرصيد</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {statementData.items.map((item, index) => (
                          <TableRow key={index}>
                                <TableCell className="text-xs">{new Date(item.date).toLocaleDateString('ar-EG')}</TableCell>
                                <TableCell>{item.details}</TableCell>
                                <TableCell className="font-mono text-red-600">{item.debit > 0 ? item.debit.toLocaleString() : '-'}</TableCell>
                                <TableCell className="font-mono text-green-600">{item.credit > 0 ? item.credit.toLocaleString() : '-'}</TableCell>
                                <TableCell className="font-mono text-md">{item.balance.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
             <DialogFooter>
                <DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>تسجيل دفعة من: {selectedPatientForPayment?.name}</DialogTitle>
                <DialogDescription>أدخل المبلغ الذي دفعه المريض. سيتم خصم هذا المبلغ من دينه.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ المدفوع</Label>
                    <Input id="amount" name="amount" type="number" step="1" required autoFocus />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                    <Input id="notes" name="notes" placeholder="مثال: دفعة من حساب شهر يوليو" />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                    <Button type="submit" variant="success">حفظ الدفعة</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
    </>
  )
}

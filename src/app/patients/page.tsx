
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
import type { Patient, Sale } from "@/lib/types"
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
    AlertDialogTrigger,
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
  const {  getPaginatedPatients, scopedData } = useAuth();
  
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();
  
  const { sales: [sales] } = scopedData;

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
  
 
  const openEditDialog = (patient: Patient) => {
    setEditingPatient(patient);
    setIsEditDialogOpen(true);
  }
  
  const patientDebts = React.useMemo(() => {
    const debts: { [patientId: string]: number } = {};
    if (!sales) {
        return debts;
    }

    sales.forEach(sale => {
        if (sale.patient_id && sale.payment_method === 'credit') {
            debts[sale.patient_id] = (debts[sale.patient_id] || 0) + Number(sale.total);
        }
    });


    return debts;
  }, [sales]);

  const handleShowStatement = (patient: Patient) => {
        const patientSales = sales
            .filter(s => s.patient_id === patient.id && s.payment_method === 'credit')
            .map(s => ({ date: s.date, type: 'فاتورة' as const, details: `فاتورة #${s.id}`, debit: s.total, credit: 0 }));

        
        const allTransactions = [...patientSales]
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
                </TableRow>
            </TableHeader>
            <TableBody>
                 {loading ? Array.from({length: perPage}).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    </TableRow>
                 )) : patients.length > 0 ? patients.map((patient) => (
                     <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{patient.phone || 'لا يوجد'}</TableCell>
                     </TableRow>
                 )) : (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
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
                                <TableCell className="text-xs text-right">{new Date(item.date).toLocaleDateString('en-US')}</TableCell>
                                <TableCell className="text-right">{item.details}</TableCell>
                                <TableCell className="font-mono text-red-600 text-right">{item.debit > 0 ? item.debit.toLocaleString() : '-'}</TableCell>
                                <TableCell className="font-mono text-green-600 text-right">{item.credit > 0 ? item.credit.toLocaleString() : '-'}</TableCell>
                                <TableCell className="font-mono text-md text-right">{item.balance.toLocaleString()}</TableCell>
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
    </>
  )
}

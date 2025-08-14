
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
import { useAuth } from "@/hooks/use-auth"
import type { Supplier, PurchaseOrder, ReturnOrder, SupplierPayment } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { DollarSign, FileText, Truck, Undo2, Wallet, Scale, MoreHorizontal, Pencil, Trash2, PlusCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"


type StatementItem = {
    date: string;
    type: 'شراء' | 'استرجاع' | 'دفعة';
    details: string;
    debit: number;
    credit: number;
    balance: number;
};

export default function SuppliersPage() {
  const { scopedData, addSupplier, updateSupplier, deleteSupplier, addPayment } = useAuth();
  const [suppliers] = scopedData.suppliers;
  const [purchaseOrders] = scopedData.purchaseOrders;
  const [supplierReturns] = scopedData.supplierReturns;
  const [supplierPayments] = scopedData.payments;

  const [isClient, setIsClient] = React.useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null);
  const [isStatementOpen, setIsStatementOpen] = React.useState(false);
  const [statementData, setStatementData] = React.useState<{ supplier: Supplier | null; items: StatementItem[] }>({ supplier: null, items: [] });
  const [supplierSearchTerm, setSupplierSearchTerm] = React.useState("");
  const { toast } = useToast();

  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
  const handleAddSupplier = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("supplier_name") as string;
    const contact_person = formData.get("supplierContact") as string;
    
    const newSupplier = await addSupplier({ name, contact_person });
    if(newSupplier) {
        setIsAddDialogOpen(false);
    }
  };

  const handleUpdateSupplier = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingSupplier) return;

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const contact_person = formData.get('contact_person') as string;

    const success = await updateSupplier(editingSupplier.id, { name, contact_person });
    if(success) {
        setIsEditDialogOpen(false);
        setEditingSupplier(null);
    }
  }

  const handleDeleteSupplier = async (supplier: Supplier) => {
    await deleteSupplier(supplier.id);
  }

  const handleAddPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSupplier) return;

    const formData = new FormData(event.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const notes = formData.get('notes') as string;

    const success = await addPayment(selectedSupplier.id, amount, notes);

    if (success) {
        setIsPaymentDialogOpen(false);
        setSelectedSupplier(null);
    }
  }

  const handleShowStatement = (supplier: Supplier) => {
    const supplierPurchases = purchaseOrders.filter(po => po.supplier_id === supplier.id)
        .map(po => ({ date: po.date, type: 'شراء' as const, details: `فاتورة شراء #${po.id}`, debit: po.total_amount, credit: 0 }));

    const supplierReturnsData = supplierReturns.filter(ret => ret.supplier_id === supplier.id)
        .map(ret => ({ date: ret.date, type: 'استرجاع' as const, details: `إرجاع #${ret.id}`, debit: 0, credit: ret.total_amount }));

    const supplierPaymentsData = supplierPayments.filter(p => p.supplier_id === supplier.id)
        .map(p => ({ date: p.date, type: 'دفعة' as const, details: `دفعة نقدية ${p.notes ? `(${p.notes})` : ''}`, debit: 0, credit: p.amount }));

    const allTransactions = [...supplierPurchases, ...supplierReturnsData, ...supplierPaymentsData]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const statementItems = allTransactions.map(t => {
        runningBalance += t.debit - t.credit;
        return { ...t, balance: runningBalance };
    });
    
    setStatementData({ supplier, items: statementItems.reverse() });
    setIsStatementOpen(true);
  };


  const supplierAccounts = React.useMemo(() => {
    if (!isClient) return [];
    return suppliers.map(supplier => {
      const purchases = purchaseOrders.filter(po => po.supplier_id === supplier.id);
      const returns = supplierReturns.filter(ret => ret.supplier_id === supplier.id);
      const payments = supplierPayments.filter(p => p.supplier_id === supplier.id);

        const totalPurchases = purchases.reduce((acc, po) => {
            const total_amount = typeof po.total_amount === 'number' ? po.total_amount : parseFloat(String(po.total_amount || 0));
            return acc + (isNaN(total_amount) ? 0 : total_amount);
        }, 0);
    //   const totalPurchases = purchases.reduce((acc, po) => acc + po.total_amount, 0);
    //   const totalReturns = returns.reduce((acc, ret) => acc + ret.total_amount, 0);
        const totalReturns = returns.reduce((acc, ret) => {
            const total_amount = typeof ret.total_amount === 'number' ? ret.total_amount : parseFloat(String(ret.total_amount || 0));
            return acc + (isNaN(total_amount) ? 0 : total_amount);
        }, 0);
    //   const totalPayments = payments.reduce((acc, p) => acc + p.amount, 0);
      const totalPayments = payments.reduce((acc, p) => {
          const amount = typeof p.amount === 'number' ? p.amount : parseFloat(String(p.amount || 0));
          return acc + (isNaN(amount) ? 0 : amount);
      }, 0);

      const netDebt = totalPurchases - totalReturns - totalPayments;

      return {
        ...supplier,
        totalPurchases,
        totalReturns,
        totalPayments,
        netDebt,
      };
    });
  }, [suppliers, purchaseOrders, supplierReturns, supplierPayments, isClient]);
  
  const filteredSupplierAccounts = supplierAccounts.filter(s => s.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()));

  

  if (!isClient) {
      return (
          <div className="space-y-6">
              <div className="space-y-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-5 w-96" />
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                          <CardHeader>
                              <Skeleton className="h-6 w-40" />
                              <Skeleton className="h-4 w-48 mt-1" />
                          </CardHeader>
                          <CardContent className="space-y-4">
                              <Skeleton className="h-5 w-full" />
                              <Skeleton className="h-5 w-full" />
                              <Skeleton className="h-5 w-full" />
                              <Skeleton className="h-6 w-full mt-2" />
                          </CardContent>
                          <CardFooter>
                            <Skeleton className="h-10 w-full" />
                          </CardFooter>
                      </Card>
                  ))}
              </div>
          </div>
      )
  }

  return (
    <>
    <div className="space-y-6">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">الموردون والحسابات</h1>
                <p className="text-muted-foreground">
                    إدارة حسابات الموردين وتتبع الديون المستحقة والمدفوعات.
                </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="me-2 h-4 w-4" /> إضافة مورد جديد</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>إضافة مورد جديد</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddSupplier} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="supplier_name">اسم المورد</Label>
                            <Input id="supplier_name" name="supplier_name" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="supplierContact">الشخص المسؤول (اختياري)</Label>
                            <Input id="supplierContact" name="supplierContact" />
                        </div>
                        <DialogFooter className="pt-2">
                            <DialogClose asChild><Button variant="outline" type="button">إلغاء</Button></DialogClose>
                            <Button type="submit" variant="success">إضافة</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
        <div className="pb-4">
            <Input 
                placeholder="ابحث عن مورد..."
                value={supplierSearchTerm}
                onChange={(e) => setSupplierSearchTerm(e.target.value)}
                className="max-w-sm"
            />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSupplierAccounts.map(account => (
                <Card key={account.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                           <div>
                                <CardTitle>{account.id} - {account.name}</CardTitle>
                                <CardDescription>{account.contact_person || 'لا يوجد جهة اتصال'}</CardDescription>
                           </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => { setEditingSupplier(account); setIsEditDialogOpen(true); }}>
                                        <Pencil className="me-2 h-4 w-4" />
                                        تعديل
                                    </DropdownMenuItem>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive">
                                                <Trash2 className="me-2 h-4 w-4" />
                                                حذف
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>هل أنت متأكد من حذف {account.name}؟</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    سيتم حذف هذا المورد نهائياً.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteSupplier(account)} className="bg-destructive hover:bg-destructive/90">
                                                    نعم، قم بالحذف
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm flex-grow">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Truck className="h-4 w-4" /> إجمالي المشتريات:
                            </span>
                            <span className="font-mono font-medium">{account.totalPurchases.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Undo2 className="h-4 w-4 text-green-600" /> إجمالي الاسترجاع:
                            </span>
                            <span className="font-mono font-medium text-green-600">-{account.totalReturns.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-blue-600" /> إجمالي المدفوعات:
                            </span>
                            <span className="font-mono font-medium text-blue-600">-{account.totalPayments.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between items-center pt-2 border-t font-bold text-base">
                            <span className="flex items-center gap-2">
                                <Scale className="h-4 w-4" /> إجمالي الديون:
                            </span>
                            <span className="font-mono text-destructive">{account.netDebt.toLocaleString()}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" className="w-full" onClick={() => handleShowStatement(account)}>
                           <FileText className="me-2 h-4 w-4" /> كشف حساب
                        </Button>
                        <Button variant="success" onClick={() => { setSelectedSupplier(account); setIsPaymentDialogOpen(true); }} className="w-full">
                            <DollarSign className="me-2 h-4 w-4" />
                            تسديد دفعة
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </div>

    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>تسجيل دفعة للمورد: {selectedSupplier?.name}</DialogTitle>
                <DialogDescription>أدخل المبلغ المدفوع وأي ملاحظات. سيتم خصم هذا المبلغ من الدين المستحق للمورد.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ المدفوع</Label>
                    <Input id="amount" name="amount" type="number" step="1" required autoFocus />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                    <Textarea id="notes" name="notes" placeholder="مثال: دفعة من حساب شهر يوليو" />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                    <Button type="submit" variant="success">حفظ الدفعة</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>

    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>تعديل بيانات المورد</DialogTitle>
            </DialogHeader>
            {editingSupplier && (
                <form onSubmit={handleUpdateSupplier} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="edit-supplier-name">اسم المورد</Label>
                        <Input id="edit-supplier-name" name="name" defaultValue={editingSupplier.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-supplier-contact">الشخص المسؤول (اختياري)</Label>
                        <Input id="edit-supplier-contact" name="contact_person" defaultValue={editingSupplier.contact_person || ''} />
                    </div>
                    <DialogFooter className="pt-2">
                        <DialogClose asChild>
                            <Button variant="outline" type="button">إلغاء</Button>
                        </DialogClose>
                        <Button type="submit" variant="success">حفظ التغييرات</Button>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
    </Dialog>

    <Dialog open={isStatementOpen} onOpenChange={setIsStatementOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>كشف حساب المورد: {statementData.supplier?.name}</DialogTitle>
                <DialogDescription>
                    عرض تفصيلي لجميع الحركات المالية للمورد.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] mt-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>البيان</TableHead>
                            <TableHead>مدين (له)</TableHead>
                            <TableHead>دائن (عليه)</TableHead>
                            <TableHead>الرصيد</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {statementData.items.map((item, index) => (
                            <TableRow key={index} className="text-right">
                                <TableCell className="text-xs">{new Date(item.date).toLocaleDateString('ar-EG')}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{item.type}</div>
                                    <div className="text-xs text-muted-foreground">{item.details}</div>
                                </TableCell>
                                <TableCell className="font-mono text-red-600">{item.debit > 0 ? item.debit.toLocaleString() : '-'}</TableCell>
                                <TableCell className="font-mono text-green-600">{item.credit > 0 ? item.credit.toLocaleString() : '-'}</TableCell>
                                <TableCell className="font-mono font-semibold">{item.balance.toLocaleString()}</TableCell>
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


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
import type { Supplier, PurchaseOrder, ReturnOrder, SupplierPayment, TrashItem } from "@/lib/types"
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
  const { scopedData } = useAuth();
  const [suppliers, setSuppliers] = scopedData.suppliers;
  const [purchaseOrders] = scopedData.purchaseOrders;
  const [supplierReturns] = scopedData.supplierReturns;
  const [supplierPayments, setSupplierPayments] = scopedData.payments;
  const [trash, setTrash] = scopedData.trash;

  const [isClient, setIsClient] = React.useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null);
  const [isStatementOpen, setIsStatementOpen] = React.useState(false);
  const [statementData, setStatementData] = React.useState<{ supplier: Supplier | null, items: StatementItem[] }>({ supplier: null, items: [] });
  const { toast } = useToast();

  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
  const handleAddSupplier = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("supplierName") as string;
    const contact = formData.get("supplierContact") as string;
    if (!name) {
        toast({ variant: "destructive", title: "اسم المورد مطلوب" });
        return;
    }
    const newSupplier: Supplier = {
        id: `SUP${Date.now()}`,
        name,
        contactPerson: contact,
    };
    setSuppliers(prev => [newSupplier, ...prev]);

    setIsAddDialogOpen(false);
    toast({ title: "تمت إضافة المورد بنجاح" });
  };

  const handleUpdateSupplier = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingSupplier) return;

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const contactPerson = formData.get('contactPerson') as string;

    const updatedSupplier: Supplier = { ...editingSupplier, name, contactPerson };

    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    
    // setPurchaseOrders(prev => prev.map(po => po.supplierId === updatedSupplier.id ? { ...po, supplierName: updatedSupplier.name } : po));
    // setSupplierReturns(prev => prev.map(ret => ret.supplierId === updatedSupplier.id ? { ...ret, supplierName: updatedSupplier.name } : ret));

    toast({ title: "تم تحديث بيانات المورد" });
    setIsEditDialogOpen(false);
    setEditingSupplier(null);
  }

  const handleDeleteSupplier = (supplier: Supplier) => {
    const hasTransactions = 
        purchaseOrders.some(p => p.supplierId === supplier.id) ||
        supplierReturns.some(r => r.supplierId === supplier.id) ||
        supplierPayments.some(sp => sp.supplierId === supplier.id);

    if (hasTransactions) {
        toast({
            variant: "destructive",
            title: "لا يمكن حذف المورد",
            description: "هذا المورد لديه معاملات مسجلة (مشتريات، مرتجعات، دفعات). لا يمكن حذفه للحفاظ على السجلات المالية."
        });
        return;
    }

    const newTrashItem: TrashItem = {
      id: `TRASH-${Date.now()}`,
      deletedAt: new Date().toISOString(),
      itemType: 'supplier',
      data: supplier,
    };
    setTrash(prev => [newTrashItem, ...prev]);

    setSuppliers(prev => prev.filter(s => s.id !== supplier.id));
    toast({ title: "تم نقل المورد إلى سلة المحذوفات" });
  }

  const handleAddPayment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSupplier) return;

    const formData = new FormData(event.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const notes = formData.get('notes') as string;

    if (isNaN(amount) || amount <= 0) {
        toast({ variant: 'destructive', title: 'مبلغ غير صالح', description: "الرجاء إدخال مبلغ صحيح أكبر من صفر." });
        return;
    }

    const newPayment: SupplierPayment = {
        id: `PAY-${Date.now()}`,
        supplierId: selectedSupplier.id,
        amount,
        date: new Date().toISOString(),
        notes,
    };
    
    setSupplierPayments(prev => [newPayment, ...prev]);
    toast({ title: 'تم تسجيل الدفعة بنجاح!' });
    setIsPaymentDialogOpen(false);
    setSelectedSupplier(null);
  }

  const supplierAccounts = React.useMemo(() => {
    if (!isClient) return [];
    return suppliers.map(supplier => {
      const purchases = purchaseOrders.filter(po => po.supplierId === supplier.id && po.status === "Received");
      const returns = supplierReturns.filter(ret => ret.supplierId === supplier.id);
      const payments = supplierPayments.filter(p => p.supplierId === supplier.id);

      const totalPurchases = purchases.reduce((acc, po) => acc + po.totalAmount, 0);
      const totalReturns = returns.reduce((acc, ret) => acc + ret.totalAmount, 0);
      const totalPayments = payments.reduce((acc, p) => acc + p.amount, 0);

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
  
  const handleOpenStatement = (supplierAccount: typeof supplierAccounts[0]) => {
      const supplierPurchases = purchaseOrders.filter(po => po.supplierId === supplierAccount.id);
      const supplierReturnsData = supplierReturns.filter(ret => ret.supplierId === supplierAccount.id);
      const supplierPaymentsData = supplierPayments.filter(p => p.supplierId === supplierAccount.id);

      const allTransactions = [
          ...supplierPurchases.map(p => ({ ...p, transType: 'شراء' as const, amount: p.totalAmount, details: `فاتورة شراء #${p.id}` })),
          ...supplierReturnsData.map(r => ({ ...r, transType: 'استرجاع' as const, amount: r.totalAmount, details: `قائمة استرجاع #${r.id}` })),
          ...supplierPaymentsData.map(p => ({ ...p, transType: 'دفعة' as const, amount: p.amount, details: p.notes || `دفعة نقدية` }))
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let runningBalance = 0;
      const statementItems: StatementItem[] = allTransactions.map(trans => {
          let debit = 0;
          let credit = 0;

          if (trans.transType === 'شراء') {
              debit = trans.amount;
              runningBalance += trans.amount;
          } else {
              credit = trans.amount;
              runningBalance -= trans.amount;
          }
          
          return {
              date: trans.date,
              type: trans.transType,
              details: trans.details,
              debit,
              credit,
              balance: runningBalance
          };
      });

      setStatementData({ supplier: supplierAccount, items: statementItems.reverse() });
      setIsStatementOpen(true);
  }

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
                            <Label htmlFor="supplierName">اسم المورد</Label>
                            <Input id="supplierName" name="supplierName" required />
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {supplierAccounts.map(account => (
                <Card key={account.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                           <div>
                                <CardTitle>{account.name}</CardTitle>
                                <CardDescription>{account.contactPerson || 'لا يوجد جهة اتصال'}</CardDescription>
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
                                                    سيتم نقل هذا المورد إلى سلة المحذوفات.
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
                                <Scale className="h-4 w-4" /> صافي الدين المستحق:
                            </span>
                            <span className="font-mono text-destructive">{account.netDebt.toLocaleString()}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col sm:flex-row gap-2">
                        <Button onClick={() => handleOpenStatement(account)} variant="outline" className="w-full">
                           <FileText className="me-2 h-4 w-4" />
                           عرض الكشف
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
                        <Input id="edit-supplier-contact" name="contactPerson" defaultValue={editingSupplier.contactPerson} />
                    </div>
                    <DialogFooter className="pt-2">
                        <DialogClose asChild><Button variant="outline" type="button">إلغاء</Button></DialogClose>
                        <Button type="submit" variant="success">حفظ التغييرات</Button>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
    </Dialog>
    
    <Dialog open={isStatementOpen} onOpenChange={setIsStatementOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
            <DialogTitle>كشف حساب المورد: {statementData.supplier?.name}</DialogTitle>
            <DialogDescription>
                سجل كامل لجميع المعاملات المالية مع هذا المورد.
            </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] border rounded-md">
            <Table>
                <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                        <TableHead>التاريخ والوقت</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>التفاصيل</TableHead>
                        <TableHead className="text-destructive">مدين (علينا)</TableHead>
                        <TableHead className="text-green-600">دائن (لنا)</TableHead>
                        <TableHead>الرصيد</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {statementData.items.length > 0 ? statementData.items.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-mono">{new Date(item.date).toLocaleString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric' })}</TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>{item.details}</TableCell>
                            <TableCell className="font-mono text-destructive">{item.debit > 0 ? item.debit.toLocaleString() : '-'}</TableCell>
                            <TableCell className="font-mono text-green-600">{item.credit > 0 ? item.credit.toLocaleString() : '-'}</TableCell>
                            <TableCell className="font-mono font-semibold">{item.balance.toLocaleString()}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">
                                لا توجد معاملات لعرضها.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">إغلاق</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

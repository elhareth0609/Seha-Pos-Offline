
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
import type { Supplier, PurchaseOrder, ReturnOrder, SupplierPayment, PaginatedResponse, PurchaseOrderItem, ReturnOrderItem } from "@/lib/types"
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
import { DollarSign, FileText, Truck, Undo2, Wallet, Scale, MoreHorizontal, Pencil, Trash2, PlusCircle, ChevronDown } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PinDialog } from "@/components/auth/PinDialog"


type StatementItem = {
    date: string;
    type: 'شراء' | 'استرجاع' | 'دفعة';
    details: string;
    debit: number;
    credit: number;
    balance: number;
    id: string;
    items?: (PurchaseOrderItem | ReturnOrderItem)[];
};

export default function SuppliersPage() {
  const { 
    scopedData, 
    addSupplier, 
    updateSupplier, 
    deleteSupplier, 
    addPayment, 
    getPaginatedSuppliers,
    currentUser,
    verifyPin,
  } = useAuth();

  const [purchaseOrders] = scopedData.purchaseOrders;
  const [supplierReturns] = scopedData.supplierReturns;
  const [supplierPayments] = scopedData.payments;

  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(9);
  const [loading, setLoading] = React.useState(true);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null);
  const [isStatementOpen, setIsStatementOpen] = React.useState(false);
  const [statementData, setStatementData] = React.useState<{ supplier: Supplier | null; items: StatementItem[] }>({ supplier: null, items: [] });
  const [supplierSearchTerm, setSupplierSearchTerm] = React.useState("");
  const [expandedStatementRows, setExpandedStatementRows] = React.useState<Set<string>>(new Set());
  
  const [itemToDelete, setItemToDelete] = React.useState<Supplier | null>(null);
  const [isPinDialogOpen, setIsPinDialogOpen] = React.useState(false);

  const { toast } = useToast();

  const fetchData = React.useCallback(async (page: number, limit: number, search: string) => {
    setLoading(true);
    try {
        const data = await getPaginatedSuppliers(page, limit, search);
        setSuppliers(data.data);
        setTotalPages(data.last_page);
        setCurrentPage(data.current_page);
    } catch (error) {
        console.error("Failed to fetch suppliers", error);
    } finally {
        setLoading(false);
    }
  }, [getPaginatedSuppliers]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
        fetchData(currentPage, perPage, supplierSearchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [currentPage, perPage, supplierSearchTerm, fetchData]);
  
  
  const handleAddSupplier = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("supplier_name") as string;
    const contact_person = formData.get("supplierContact") as string;
    
    const newSupplier = await addSupplier({ name, contact_person });
    if(newSupplier) {
        fetchData(1, perPage, "");
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
        fetchData(currentPage, perPage, supplierSearchTerm);
        setIsEditDialogOpen(false);
        setEditingSupplier(null);
    }
  }

  const handleDeleteSupplier = async () => {
    if (!itemToDelete) return;
    if (currentUser?.require_pin_for_delete) {
        setIsPinDialogOpen(true);
    } else {
        await deleteSupplier(itemToDelete.id);
        fetchData(currentPage, perPage, supplierSearchTerm);
        setItemToDelete(null);
    }
  }

  const handlePinConfirmDelete = async (pin: string) => {
    if (!itemToDelete) return;
    const isValid = await verifyPin(pin);
    if (isValid) {
        setIsPinDialogOpen(false);
        await deleteSupplier(itemToDelete.id);
        fetchData(currentPage, perPage, supplierSearchTerm);
        setItemToDelete(null);
    } else {
        toast({ variant: 'destructive', title: "رمز PIN غير صحيح." });
    }
  };


  const handleAddPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSupplier) return;

    const formData = new FormData(event.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const notes = formData.get('notes') as string;

    const success = await addPayment(selectedSupplier.id, amount, notes);

    if (success) {
        fetchData(currentPage, perPage, supplierSearchTerm);
        setIsPaymentDialogOpen(false);
        setSelectedSupplier(null);
    }
  }

  const handleShowStatement = (supplier: Supplier) => {
    const supplierPurchases = purchaseOrders.filter(po => po.supplier_id === supplier.id)
        .map(po => ({ 
            id: po.id,
            date: po.date, 
            type: 'شراء' as const, 
            details: `فاتورة شراء #${po.id}`, 
            debit: po.total_amount, 
            credit: 0,
            items: po.items,
        }));

    const supplierReturnsData = supplierReturns.filter(ret => ret.supplier_id === supplier.id)
        .map(ret => ({ 
            id: ret.id,
            date: ret.date, 
            type: 'استرجاع' as const, 
            details: `إرجاع #${ret.id}`, 
            debit: 0, 
            credit: ret.total_amount,
            items: ret.items,
        }));

    const supplierPaymentsData = supplierPayments.filter(p => p.supplier_id === supplier.id)
        .map(p => ({ 
            id: p.id,
            date: p.date, 
            type: 'دفعة' as const, 
            details: `دفعة نقدية ${p.notes ? `(${p.notes})` : ''}`, 
            debit: 0, 
            credit: p.amount,
            items: [],
        }));

    const allTransactions = [...supplierPurchases, ...supplierReturnsData, ...supplierPaymentsData]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const statementItems = allTransactions.map(t => {
        runningBalance += t.debit - t.credit;
        return { ...t, balance: runningBalance };
    });
    
    setStatementData({ supplier, items: statementItems.reverse() });
    setExpandedStatementRows(new Set());
    setIsStatementOpen(true);
  };
  
  const toggleStatementRow = (id: string) => {
    setExpandedStatementRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const supplierAccounts = React.useMemo(() => {
    return suppliers.map(supplier => {
      const purchases = purchaseOrders.filter(po => po.supplier_id === supplier.id);
      const returns = supplierReturns.filter(ret => ret.supplier_id === supplier.id);
      const payments = supplierPayments.filter(p => p.supplier_id === supplier.id);

        const totalPurchases = purchases.reduce((acc, po) => {
            const total_amount = typeof po.total_amount === 'number' ? po.total_amount : parseFloat(String(po.total_amount || 0));
            return acc + (isNaN(total_amount) ? 0 : total_amount);
        }, 0);
        const totalReturns = returns.reduce((acc, ret) => {
            const total_amount = typeof ret.total_amount === 'number' ? ret.total_amount : parseFloat(String(ret.total_amount || 0));
            return acc + (isNaN(total_amount) ? 0 : total_amount);
        }, 0);
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
  }, [suppliers, purchaseOrders, supplierReturns, supplierPayments]);
  
  const filteredSupplierAccounts = supplierAccounts;


  if (loading && suppliers.length === 0) {
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
        <div className="pb-4 flex flex-wrap gap-2">
            <Input 
                placeholder="ابحث عن مورد..."
                value={supplierSearchTerm}
                onChange={(e) => setSupplierSearchTerm(e.target.value)}
                className="max-w-sm"
            />
            <div className="flex items-center gap-2">
                <Label htmlFor="per-page" className="shrink-0">لكل صفحة:</Label>
                <Select value={String(perPage)} onValueChange={(val) => setPerPage(Number(val))}>
                    <SelectTrigger id="per-page" className="w-20 h-9">
                    <SelectValue placeholder={perPage} />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="18">18</SelectItem>
                    <SelectItem value="45">45</SelectItem>
                    <SelectItem value="90">90</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSupplierAccounts.map(account => (
                <Card key={account.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                           <div>
                                <CardTitle>{account.name}</CardTitle>
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
                                            <button 
                                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive"
                                                onClick={() => setItemToDelete(account)}
                                            >
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
                                                <AlertDialogAction onClick={handleDeleteSupplier} className="bg-destructive hover:bg-destructive/90">
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
                          <React.Fragment key={item.id}>
                            <TableRow 
                                onClick={() => item.items && item.items.length > 0 && toggleStatementRow(item.id)}
                                className={cn(item.items && item.items.length > 0 && "cursor-pointer text-right")}
                            >
                                <TableCell className="text-xs">{new Date(item.date).toLocaleDateString('ar-EG')}</TableCell>
                                <TableCell className="flex justify-between items-center">
                                    <div className="font-medium flex items-center gap-2">
                                        {item.items && item.items.length > 0 && (
                                            <ChevronDown className={cn("h-4 w-4 transition-transform", expandedStatementRows.has(item.id) && "rotate-180")} />
                                        )}
                                        {item.type}
                                    </div>
                                    <div className="text-xs text-muted-foreground ps-6">{item.details}</div>
                                </TableCell>
                                <TableCell className="font-mono text-red-600">{item.debit > 0 ? item.debit.toLocaleString() : '-'}</TableCell>
                                <TableCell className="font-mono text-green-600">{item.credit > 0 ? item.credit.toLocaleString() : '-'}</TableCell>
                                <TableCell className="font-mono text-md">{item.balance.toLocaleString()}</TableCell>
                            </TableRow>
                            {expandedStatementRows.has(item.id) && item.items && item.items.length > 0 && (
                                <TableRow className="bg-muted/50 text-right">
                                    <TableCell colSpan={5} className="p-2">
                                        <div className="p-2">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>الصنف</TableHead>
                                                        <TableHead>الكمية</TableHead>
                                                        <TableHead>السعر</TableHead>
                                                        <TableHead>الإجمالي</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {item.items.map((subItem, subIndex) => (
                                                        <TableRow key={subIndex}>
                                                            <TableCell>{(subItem as any).name}</TableCell>
                                                            <TableCell>{subItem.quantity}</TableCell>
                                                            <TableCell className="font-mono">{subItem.purchase_price.toLocaleString()}</TableCell>
                                                            <TableCell className="font-mono">{(subItem.quantity * subItem.purchase_price).toLocaleString()}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
             <DialogFooter>
                <DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    <PinDialog 
        open={isPinDialogOpen}
        onOpenChange={setIsPinDialogOpen}
        onConfirm={handlePinConfirmDelete}
    />
</>
  )
}

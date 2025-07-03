
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
import { useLocalStorage } from "@/hooks/use-local-storage"
import {
  suppliers as fallbackSuppliers,
  purchaseOrders as fallbackPurchaseOrders,
  supplierReturns as fallbackSupplierReturns,
  supplierPayments as fallbackSupplierPayments
} from "@/lib/data"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { DollarSign } from "lucide-react"

export default function SuppliersPage() {
  const [suppliers] = useLocalStorage<Supplier[]>('suppliers', fallbackSuppliers);
  const [purchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', fallbackPurchaseOrders);
  const [supplierReturns] = useLocalStorage<ReturnOrder[]>('supplierReturns', fallbackSupplierReturns);
  const [supplierPayments, setSupplierPayments] = useLocalStorage<SupplierPayment[]>('supplierPayments', fallbackSupplierPayments);

  const [isClient, setIsClient] = React.useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsClient(true)
  }, [])

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
  }, [suppliers, purchaseOrders, supplierReturns, supplierPayments]);
  
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
                            <Skeleton className="h-10 w-32" />
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
        <div>
            <h1 className="text-3xl font-bold tracking-tight">الموردون والحسابات</h1>
            <p className="text-muted-foreground">
                إدارة حسابات الموردين وتتبع الديون المستحقة والمدفوعات.
            </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {supplierAccounts.map(account => (
                <Card key={account.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{account.name}</CardTitle>
                        <CardDescription>{account.contactPerson || 'لا يوجد جهة اتصال'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm flex-grow">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">إجمالي المشتريات:</span>
                            <span className="font-mono font-medium">{account.totalPurchases.toLocaleString('ar-IQ')} د.ع</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">إجمالي الاسترجاع:</span>
                            <span className="font-mono font-medium text-green-600">-{account.totalReturns.toLocaleString('ar-IQ')} د.ع</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">إجمالي المدفوعات:</span>
                            <span className="font-mono font-medium text-blue-600">-{account.totalPayments.toLocaleString('ar-IQ')} د.ع</span>
                        </div>
                         <div className="flex justify-between pt-2 border-t font-bold text-base">
                            <span>صافي الدين المستحق:</span>
                            <span className="font-mono text-destructive">{account.netDebt.toLocaleString('ar-IQ')} د.ع</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => { setSelectedSupplier(account); setIsPaymentDialogOpen(true); }} className="w-full">
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
                    <Label htmlFor="amount">المبلغ المدفوع (د.ع)</Label>
                    <Input id="amount" name="amount" type="number" step="1" required autoFocus />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                    <Textarea id="notes" name="notes" placeholder="مثال: دفعة من حساب شهر يوليو" />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                    <Button type="submit">حفظ الدفعة</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
    </>
  )
}

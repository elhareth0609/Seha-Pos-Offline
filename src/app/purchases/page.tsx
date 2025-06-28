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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { purchaseOrders as allPurchaseOrders, inventory, suppliers as allSuppliers, supplierReturns } from "@/lib/data"
import type { PurchaseOrder, Medication, Supplier, Return } from "@/lib/types"
import { PlusCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export default function PurchasesPage() {
  const { toast } = useToast()
  const [suppliers, setSuppliers] = React.useState<Supplier[]>(allSuppliers);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = React.useState(false);

  const handleAddPurchase = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const purchaseId = formData.get("purchaseId") as string;
    const supplierId = formData.get("supplierId") as string;
    const medicationName = formData.get("medicationName") as string;
    const quantity = parseInt(formData.get("quantity") as string, 10);
    const expirationDate = formData.get("expirationDate") as string;
    const purchasePrice = parseFloat(formData.get("purchasePrice") as string);
    const sellingPrice = parseFloat(formData.get("sellingPrice") as string);
    
    const supplier = suppliers.find(s => s.id === supplierId);

    if (!purchaseId || !supplier || !medicationName || !quantity || !expirationDate || isNaN(purchasePrice) || isNaN(sellingPrice)) {
        toast({
            variant: "destructive",
            title: "حقول ناقصة",
            description: "الرجاء ملء جميع الحقول بشكل صحيح.",
        });
        return;
    }

    let medication = inventory.find(m => m.name.toLowerCase() === medicationName.toLowerCase());
    let medicationId: string;

    if (medication) {
      medication.stock += quantity;
      medication.price = sellingPrice;
      medication.purchasePrice = purchasePrice;
      medication.expirationDate = expirationDate;
      medication.supplierId = supplier.id;
      medication.supplierName = supplier.name;
      medicationId = medication.id;
    } else {
      medicationId = `MED${(inventory.length + 1).toString().padStart(3, '0')}`;
      const newMedication: Medication = {
          id: medicationId,
          name: medicationName,
          stock: quantity,
          reorderPoint: 20,
          category: "Uncategorized",
          supplierId: supplier.id,
          supplierName: supplier.name,
          price: sellingPrice,
          purchasePrice: purchasePrice,
          expirationDate: expirationDate,
      };
      inventory.unshift(newMedication);
    }
    
    let purchaseOrder = allPurchaseOrders.find(po => po.id === purchaseId);
    
    if (purchaseOrder) {
        purchaseOrder.items.push({
            medicationId: medicationId,
            name: medicationName,
            quantity: quantity,
        });
        purchaseOrder.supplierId = supplier.id;
        purchaseOrder.supplierName = supplier.name;
        purchaseOrder.date = new Date().toISOString().split("T")[0];
    } else {
        const newOrder: PurchaseOrder = {
          id: purchaseId,
          supplierId: supplier.id,
          supplierName: supplier.name,
          date: new Date().toISOString().split("T")[0],
          items: [{
            medicationId: medicationId,
            name: medicationName,
            quantity: quantity,
          }],
          status: "Received",
        };
        allPurchaseOrders.unshift(newOrder);
    }
    
    toast({
      title: "تم استلام البضاعة",
      description: `تمت إضافة ${quantity} من ${medicationName} إلى المخزون.`,
    });

    event.currentTarget.reset();
  };

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
        id: `SUP${(suppliers.length + 1).toString().padStart(3, '0')}`,
        name,
        contactPerson: contact,
    };
    setSuppliers(prev => [newSupplier, ...prev]);
    setIsAddSupplierOpen(false);
    toast({ title: "تمت إضافة المورد بنجاح" });
  };

  const handleReturnToSupplier = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const medicationId = formData.get("medicationId") as string;
      const quantity = parseInt(formData.get("quantity") as string, 10);
      const reason = formData.get("reason") as string;

      const medication = inventory.find(m => m.id === medicationId);

      if (!medication || !quantity || !reason) {
          toast({ variant: "destructive", title: "حقول ناقصة", description: "الرجاء ملء جميع الحقول" });
          return;
      }
      
      if(medication.stock < quantity) {
          toast({ variant: "destructive", title: "كمية غير كافية", description: `الرصيد المتوفر من ${medication.name} هو ${medication.stock} فقط.`});
          return;
      }

      medication.stock -= quantity;

      const newReturn: Return = {
        id: `S-RET${(supplierReturns.length + 1).toString().padStart(3, '0')}`,
        date: new Date().toISOString().split("T")[0],
        medicationId: medication.id,
        medicationName: medication.name,
        quantity: quantity,
        reason: reason,
        supplierId: medication.supplierId,
      };

      supplierReturns.unshift(newReturn);

      toast({ title: "تم تسجيل المرتجع", description: `تم إرجاع ${quantity} من ${medication.name} للمورد.`});
      event.currentTarget.reset();
  }
  
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
          <CardHeader>
            <CardTitle>استلام بضاعة جديدة</CardTitle>
            <CardDescription>
              استخدم هذا النموذج لتسجيل الأدوية المستلمة من الموردين.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleAddPurchase}>
                <div className="space-y-2">
                    <Label htmlFor="purchaseId">رقم قائمة الشراء</Label>
                    <Input id="purchaseId" name="purchaseId" type="text" placeholder="مثال: INV-2024-001" required />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="supplierId">المورد</Label>
                        <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                            <DialogTrigger asChild>
                                <Button variant="link" size="sm" className="p-0 h-auto"><PlusCircle className="me-1 h-3 w-3"/> إضافة مورد</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>إضافة مورد جديد</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddSupplier} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="supplierName">اسم المورد</Label>
                                        <Input id="supplierName" name="supplierName" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="supplierContact">الشخص المسؤول (اختياري)</Label>
                                        <Input id="supplierContact" name="supplierContact" />
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                        <Button type="submit">إضافة</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Select name="supplierId" required>
                        <SelectTrigger><SelectValue placeholder="اختر موردًا" /></SelectTrigger>
                        <SelectContent>
                            {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="medicationName">اسم الدواء</Label>
                    <Input id="medicationName" name="medicationName" type="text" placeholder="مثال: Paracetamol 500mg" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">الكمية</Label>
                        <Input id="quantity" name="quantity" type="number" placeholder="0" required min="1" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="expirationDate">تاريخ الانتهاء</Label>
                        <Input id="expirationDate" name="expirationDate" type="date" required />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="purchasePrice">سعر الشراء</Label>
                        <Input id="purchasePrice" name="purchasePrice" type="number" placeholder="0.00" required step="0.01" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sellingPrice">سعر البيع</Label>
                        <Input id="sellingPrice" name="sellingPrice" type="number" placeholder="0.00" required step="0.01" />
                    </div>
                </div>
              <Button type="submit" className="w-full">إضافة للمخزون</Button>
            </form>
          </CardContent>
      </Card>
      
      <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>إرجاع بضاعة للمورد</CardTitle>
                <CardDescription>
                استخدم هذا النموذج لإرجاع الأدوية (مثلاً التالفة أو قريبة الانتهاء) إلى المورد.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleReturnToSupplier}>
                    <div className="space-y-2">
                        <Label htmlFor="medicationId">الدواء المُراد إرجاعه</Label>
                        <Select name="medicationId" required>
                            <SelectTrigger><SelectValue placeholder="اختر دواء" /></SelectTrigger>
                            <SelectContent>
                                {inventory.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="return-quantity">الكمية المرتجعة</Label>
                        <Input id="return-quantity" name="quantity" type="number" placeholder="0" required min="1" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason">سبب الإرجاع</Label>
                        <Textarea id="reason" name="reason" placeholder="مثال: تالف، قريب الانتهاء" required />
                    </div>
                    <Button type="submit" variant="destructive" className="w-full">تسجيل المرتجع وخصم من المخزون</Button>
                </form>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}

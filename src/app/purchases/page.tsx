
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { 
    purchaseOrders as fallbackPurchaseOrders, 
    inventory as fallbackInventory, 
    suppliers as fallbackSuppliers, 
    supplierReturns as fallbackSupplierReturns 
} from "@/lib/data"
import type { PurchaseOrder, Medication, Supplier, Return, PurchaseOrderItem } from "@/lib/types"
import { PlusCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export default function PurchasesPage() {
  const { toast } = useToast()

  const [inventory, setInventory] = useLocalStorage<Medication[]>('inventory', fallbackInventory);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', fallbackSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', fallbackPurchaseOrders);
  const [supplierReturns, setSupplierReturns] = useLocalStorage<Return[]>('supplierReturns', fallbackSupplierReturns);

  const [isAddSupplierOpen, setIsAddSupplierOpen] = React.useState(false);

  const handleAddPurchase = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const purchaseId = formData.get("purchaseId") as string;
    const supplierId = formData.get("supplierId") as string;
    let medicationId = formData.get("medicationId") as string; // This is the barcode
    const medicationName = formData.get("medicationName") as string;
    const quantity = parseInt(formData.get("quantity") as string, 10);
    const expirationDate = formData.get("expirationDate") as string;
    const purchasePrice = parseFloat(formData.get("purchasePrice") as string);
    const sellingPrice = parseFloat(formData.get("sellingPrice") as string);
    
    const supplier = suppliers.find(s => s.id === supplierId);
    const itemTotal = purchasePrice * quantity;

    if (!purchaseId || !supplier || !medicationName || !quantity || !expirationDate || isNaN(purchasePrice) || isNaN(sellingPrice)) {
        toast({
            variant: "destructive",
            title: "حقول ناقصة",
            description: "الرجاء ملء جميع الحقول بشكل صحيح.",
        });
        return;
    }
    
    const isNewGenerated = !medicationId;
    if (isNewGenerated) {
        medicationId = Date.now().toString(); // Generate a unique ID
    }
    
    let newInventory = [...inventory];
    let medicationIndex = newInventory.findIndex(m => m.id === medicationId);

    if (medicationIndex !== -1) {
      // Medication exists, update it
      const existingMed = newInventory[medicationIndex];
      existingMed.stock += quantity;
      existingMed.price = sellingPrice;
      existingMed.purchasePrice = purchasePrice;
      existingMed.expirationDate = expirationDate;
      existingMed.supplierId = supplier.id;
      existingMed.supplierName = supplier.name;
      existingMed.name = medicationName; // Also update the name
      newInventory[medicationIndex] = existingMed;
      toast({
          title: "تم تحديث الرصيد",
          description: `تمت إضافة ${quantity} إلى رصيد ${medicationName}. الرصيد الجديد: ${existingMed.stock}`,
        });

    } else {
      // New medication, add it
      const newMedication: Medication = {
          id: medicationId,
          name: medicationName,
          stock: quantity,
          reorderPoint: 20, // default
          category: "Uncategorized", // default
          supplierId: supplier.id,
          supplierName: supplier.name,
          price: sellingPrice,
          purchasePrice: purchasePrice,
          expirationDate: expirationDate,
      };
      newInventory.unshift(newMedication);
      toast({
          title: "تم استلام البضاعة",
          description: `تمت إضافة ${quantity} من ${medicationName} إلى المخزون.`,
        });
    }

    setInventory(newInventory);
    
    let newPurchaseOrders = [...purchaseOrders];
    let purchaseOrderIndex = newPurchaseOrders.findIndex(po => po.id === purchaseId);
    
    const newPurchaseItem: PurchaseOrderItem = {
        medicationId: medicationId,
        name: medicationName,
        quantity: quantity,
        purchasePrice: purchasePrice,
    };

    if (purchaseOrderIndex > -1) {
        newPurchaseOrders[purchaseOrderIndex].items.push(newPurchaseItem);
        newPurchaseOrders[purchaseOrderIndex].totalAmount += itemTotal;
    } else {
        const newOrder: PurchaseOrder = {
          id: purchaseId,
          supplierId: supplier.id,
          supplierName: supplier.name,
          date: new Date().toISOString().split("T")[0],
          items: [newPurchaseItem],
          status: "Received",
          totalAmount: itemTotal,
        };
        newPurchaseOrders.unshift(newOrder);
    }

    setPurchaseOrders(newPurchaseOrders);
    
    form.reset();
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
    const newSuppliers = [newSupplier, ...suppliers];
    setSuppliers(newSuppliers);

    setIsAddSupplierOpen(false);
    toast({ title: "تمت إضافة المورد بنجاح" });
    (event.target as HTMLFormElement).reset();
  };

  const handleReturnToSupplier = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const medicationId = formData.get("medicationId") as string;
      const supplierId = formData.get("supplierId") as string;
      const purchaseId = formData.get("purchaseId") as string;
      const quantity = parseInt(formData.get("quantity") as string, 10);
      const reason = formData.get("reason") as string;

      const medicationIndex = inventory.findIndex(m => m.id === medicationId);
      const supplier = suppliers.find(s => s.id === supplierId);

      if (medicationIndex === -1 || !supplier || !quantity || !reason) {
          toast({ variant: "destructive", title: "حقول ناقصة", description: "الرجاء ملء جميع الحقول المطلوبة." });
          return;
      }
      
      const medication = inventory[medicationIndex];

      if(medication.stock < quantity) {
          toast({ variant: "destructive", title: "كمية غير كافية", description: `الرصيد المتوفر من ${medication.name} هو ${medication.stock} فقط.`});
          return;
      }
      
      const returnTotalAmount = quantity * medication.purchasePrice;
      
      const newInventory = [...inventory];
      newInventory[medicationIndex] = { ...medication, stock: medication.stock - quantity };
      setInventory(newInventory);

      const newReturn: Return = {
        id: `S-RET${(supplierReturns.length + 1).toString().padStart(3, '0')}`,
        date: new Date().toISOString().split("T")[0],
        medicationId: medication.id,
        medicationName: medication.name,
        quantity: quantity,
        reason: reason,
        supplierId: supplier.id,
        purchaseId: purchaseId || undefined,
        totalAmount: returnTotalAmount,
      };

      setSupplierReturns(prev => [newReturn, ...prev]);

      toast({ title: "تم تسجيل المرتجع", description: `تم إرجاع ${quantity} من ${medication.name} للمورد.`});
      event.currentTarget.reset();
  }
  
  return (
     <Tabs defaultValue="new-purchase" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="new-purchase">استلام بضاعة</TabsTrigger>
        <TabsTrigger value="purchase-history">سجل المشتريات</TabsTrigger>
        <TabsTrigger value="new-return">إرجاع للمورد</TabsTrigger>
        <TabsTrigger value="return-history">سجل المرتجعات</TabsTrigger>
      </TabsList>
      <TabsContent value="new-purchase">
        <Card>
          <CardHeader>
            <CardTitle>استلام بضاعة جديدة</CardTitle>
            <CardDescription>
              استخدم هذا النموذج لتسجيل الأدوية المستلمة من الموردين وتحديث المخزون.
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
                        <SelectTrigger id="supplierId"><SelectValue placeholder="اختر موردًا" /></SelectTrigger>
                        <SelectContent>
                            {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="medicationId">الباركود (المعرف) - يترك فارغاً للتوليد التلقائي</Label>
                    <Input id="medicationId" name="medicationId" type="text" placeholder="امسح الباركود أو أدخله يدويًا" />
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
      </TabsContent>
       <TabsContent value="purchase-history">
        <Card>
          <CardHeader>
            <CardTitle>سجل المشتريات</CardTitle>
            <CardDescription>قائمة بجميع طلبات الشراء المستلمة.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>رقم القائمة</TableHead>
                        <TableHead>المورد</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الإجمالي</TableHead>
                        <TableHead>الحالة</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchaseOrders.map(po => (
                        <TableRow key={po.id}>
                            <TableCell>{po.id}</TableCell>
                            <TableCell>{po.supplierName}</TableCell>
                            <TableCell>{new Date(po.date).toLocaleDateString('ar-EG')}</TableCell>
                            <TableCell className="font-mono">${po.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>{po.status}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="new-return">
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
                        <Label htmlFor="return-medicationId">الدواء المُراد إرجاعه</Label>
                        <Select name="medicationId" required>
                            <SelectTrigger id="return-medicationId"><SelectValue placeholder="اختر دواء" /></SelectTrigger>
                            <SelectContent>
                                {inventory.map(m => <SelectItem key={m.id} value={m.id}>{m.name} (سعر الشراء: ${m.purchasePrice.toFixed(2)})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="return-supplierId">المورد</Label>
                        <Select name="supplierId" required>
                            <SelectTrigger id="return-supplierId"><SelectValue placeholder="اختر موردًا" /></SelectTrigger>
                            <SelectContent>
                                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="return-purchaseId">رقم قائمة الشراء (اختياري)</Label>
                        <Input id="return-purchaseId" name="purchaseId" type="text" placeholder="مثال: INV-2024-001" />
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
      </TabsContent>
       <TabsContent value="return-history">
        <Card>
          <CardHeader>
            <CardTitle>سجل المرتجعات</CardTitle>
            <CardDescription>قائمة بجميع المرتجعات للموردين.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>معرف المرتجع</TableHead>
                        <TableHead>الدواء</TableHead>
                        <TableHead>الكمية</TableHead>
                        <TableHead>قيمة المرتجع</TableHead>
                        <TableHead>السبب</TableHead>
                        <TableHead>التاريخ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {supplierReturns.map(ret => (
                        <TableRow key={ret.id}>
                            <TableCell>{ret.id}</TableCell>
                            <TableCell>{ret.medicationName}</TableCell>
                            <TableCell>{ret.quantity}</TableCell>
                            <TableCell className="font-mono">${ret.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>{ret.reason}</TableCell>
                            <TableCell>{new Date(ret.date).toLocaleDateString('ar-EG')}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

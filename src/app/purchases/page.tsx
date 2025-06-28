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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { purchaseOrders as allPurchaseOrders, inventory } from "@/lib/data"
import type { PurchaseOrder, Medication } from "@/lib/types"

export default function PurchasesPage() {
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>(allPurchaseOrders);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast()

  const handleAddPurchase = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // Extract form data
    const purchaseId = formData.get("purchaseId") as string;
    const supplier = formData.get("supplier") as string;
    const medicationName = formData.get("medicationName") as string;
    const quantity = parseInt(formData.get("quantity") as string, 10);
    const expirationDate = formData.get("expirationDate") as string;
    const purchasePrice = parseFloat(formData.get("purchasePrice") as string);
    const sellingPrice = parseFloat(formData.get("sellingPrice") as string);
    
    if (!purchaseId || !supplier || !medicationName || !quantity || !expirationDate || isNaN(purchasePrice) || isNaN(sellingPrice)) {
        toast({
            variant: "destructive",
            title: "حقول ناقصة",
            description: "الرجاء ملء جميع الحقول بشكل صحيح.",
        });
        return;
    }

    // Find if medication exists, or create a new one
    let medication = inventory.find(m => m.name.toLowerCase() === medicationName.toLowerCase());
    let medicationId: string;

    if (medication) {
      // Update existing medication
      medication.stock += quantity;
      medication.price = sellingPrice;
      medication.purchasePrice = purchasePrice;
      medication.expirationDate = expirationDate;
      medication.supplier = supplier;
      medicationId = medication.id;
    } else {
      // Create new medication
      medicationId = `MED${(inventory.length + 1).toString().padStart(3, '0')}`;
      const newMedication: Medication = {
          id: medicationId,
          name: medicationName,
          stock: quantity,
          reorderPoint: 20, // Default reorder point
          category: "Uncategorized", // Default category
          supplier: supplier,
          price: sellingPrice,
          purchasePrice: purchasePrice,
          expirationDate: expirationDate,
      };
      inventory.unshift(newMedication);
    }
    
    // Find if purchase order exists, or create a new one
    let purchaseOrder = purchaseOrders.find(po => po.id === purchaseId);
    
    if (purchaseOrder) {
        // Add item to existing PO
        purchaseOrder.items.push({
            medicationId: medicationId,
            name: medicationName,
            quantity: quantity,
        });
        purchaseOrder.supplier = supplier; // Update supplier in case it's different
        purchaseOrder.date = new Date().toISOString().split("T")[0];
        setPurchaseOrders([...purchaseOrders]);
    } else {
        // Create new PO
        const newOrder: PurchaseOrder = {
          id: purchaseId,
          supplier: supplier,
          date: new Date().toISOString().split("T")[0],
          items: [{
            medicationId: medicationId,
            name: medicationName,
            quantity: quantity,
          }],
          status: "Received",
        };
        setPurchaseOrders(prevOrders => [newOrder, ...prevOrders]);
    }
    
    toast({
      title: "تمت إضافة المشتريات",
      description: `تمت إضافة ${quantity} من ${medicationName} إلى المخزون.`,
    });

    event.currentTarget.reset();
  };
  
  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case "Pending":
        return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">قيد الانتظار</Badge>;
      case "Received":
        return <Badge variant="secondary" className="bg-green-300 text-green-900">تم الاستلام</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">ملغي</Badge>;
    }
  }

  const filteredPurchaseOrders = purchaseOrders.filter(order => 
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>سجل المشتريات</CardTitle>
            <CardDescription>
              عرض جميع عمليات شراء واستلام المخزون.
            </CardDescription>
             <div className="pt-4">
              <Input 
                placeholder="ابحث برقم قائمة الشراء..."
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
                  <TableHead>رقم القائمة</TableHead>
                  <TableHead>المورد</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الأصناف</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>إضافة مشتريات للمخزون</CardTitle>
            <CardDescription>
              استخدم هذا النموذج لتسجيل الأدوية المستلمة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleAddPurchase}>
                <div className="space-y-2">
                    <Label htmlFor="purchaseId">رقم قائمة الشراء</Label>
                    <Input id="purchaseId" name="purchaseId" type="text" placeholder="مثال: INV-2024-001" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="supplier">اسم المورد / الشركة</Label>
                    <Input id="supplier" name="supplier" type="text" placeholder="مثال: Pharma Inc." required />
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
      </div>
    </div>
  )
}

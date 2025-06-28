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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { purchaseOrders as allPurchaseOrders, inventory } from "@/lib/data"
import type { PurchaseOrder } from "@/lib/types"

export default function PurchasesPage() {
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>(allPurchaseOrders);
  const { toast } = useToast()

  const handleReceiveStock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const medicationId = formData.get("medicationId") as string;
    const quantity = parseInt(formData.get("quantity") as string, 10);
    const supplier = formData.get("supplier") as string;

    if (!medicationId || !quantity || !supplier) {
        toast({
            variant: "destructive",
            title: "حقول ناقصة",
            description: "الرجاء ملء جميع الحقول.",
        });
        return;
    }
    
    // Find medication in global inventory and update stock
    const medicationIndex = inventory.findIndex(m => m.id === medicationId);
    if (medicationIndex === -1) {
        toast({
            variant: "destructive",
            title: "خطأ",
            description: "لم يتم العثور على الدواء المحدد.",
        });
        return;
    }
    
    inventory[medicationIndex].stock += quantity;
    const medicationName = inventory[medicationIndex].name;

    // Create a new purchase order record with status "Received"
    const newOrder: PurchaseOrder = {
      id: `PO${(purchaseOrders.length + 1).toString().padStart(3, '0')}`,
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
    
    toast({
      title: "تم استلام المخزون",
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

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>سجل المشتريات</CardTitle>
            <CardDescription>
              عرض جميع عمليات شراء واستلام المخزون.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>معرف الطلب</TableHead>
                  <TableHead>المورد</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الأصناف</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((order) => (
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
            <CardTitle>إضافة عملية شراء</CardTitle>
            <CardDescription>
              استخدم هذا النموذج لتسجيل الأدوية المستلمة وإضافتها إلى المخزون.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleReceiveStock}>
              <div className="space-y-2">
                <Label htmlFor="supplier">المورد</Label>
                <Select name="supplier" required>
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="اختر موردًا" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pharma Inc.">Pharma Inc.</SelectItem>
                    <SelectItem value="HealthCare Supplies">HealthCare Supplies</SelectItem>
                    <SelectItem value="Allergy Relief Co.">Allergy Relief Co.</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicationId">الدواء</Label>
                 <Select name="medicationId" required>
                  <SelectTrigger id="medicationId">
                    <SelectValue placeholder="اختر دواء" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map(med => (
                      <SelectItem key={med.id} value={med.id}>{med.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">الكمية</Label>
                <Input id="quantity" name="quantity" type="number" placeholder="أدخل الكمية" required min="1" />
              </div>

              <Button type="submit" className="w-full">إضافة للمخزون</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

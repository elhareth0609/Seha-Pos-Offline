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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { returns as allReturns, inventory } from "@/lib/data"
import type { Return } from "@/lib/types"

export default function ReturnsPage() {
  const [returns, setReturns] = React.useState<Return[]>(allReturns);
  const { toast } = useToast()

  const handleCreateReturn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const medicationId = formData.get("medicationId") as string;
    const medication = inventory.find(m => m.id === medicationId);

    if (!medication) {
        toast({
            title: "خطأ",
            description: "الدواء المحدد غير موجود.",
            variant: "destructive"
        })
        return;
    }

    const newReturn: Return = {
      id: `RET${(returns.length + 1).toString().padStart(3, '0')}`,
      date: new Date().toISOString().split("T")[0],
      medicationId: medication.id,
      medicationName: medication.name,
      quantity: parseInt(formData.get("quantity") as string, 10),
      reason: formData.get("reason") as string,
    };
    setReturns([newReturn, ...returns]);
    toast({
      title: "تمت معالجة المرتجع",
      description: `تم تسجيل المرتجع ${newReturn.id} بنجاح.`,
    });
    event.currentTarget.reset();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>سجل المرتجعات</CardTitle>
            <CardDescription>
              عرض وإدارة جميع مرتجعات العملاء.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>معرف المرتجع</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الدواء</TableHead>
                  <TableHead className="text-left">الكمية</TableHead>
                  <TableHead>السبب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell>{item.medicationName}</TableCell>
                    <TableCell className="text-left">{item.quantity}</TableCell>
                    <TableCell>{item.reason}</TableCell>
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
            <CardTitle>معالجة مرتجع</CardTitle>
            <CardDescription>
              املأ النموذج لتسجيل مرتجع عميل جديد.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateReturn}>
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
                <Input id="quantity" name="quantity" type="number" placeholder="أدخل الكمية" required min="1"/>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">سبب الإرجاع</Label>
                <Textarea id="reason" name="reason" placeholder="مثال: شراء خاطئ، رد فعل تحسسي" required />
              </div>

              <Button type="submit" className="w-full">معالجة المرتجع</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

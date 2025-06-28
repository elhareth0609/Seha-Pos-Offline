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
import { Input } from "@/components/ui/input"
import { inventory as allInventory } from "@/lib/data"
import type { Medication } from "@/lib/types"

export default function InventoryPage() {
  const [inventory, setInventory] = React.useState<Medication[]>(allInventory)
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    const filtered = allInventory.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setInventory(filtered)
  }, [searchTerm])
  
  const getStockStatus = (stock: number, reorderPoint: number) => {
    if (stock === 0) return <Badge variant="destructive">نفد من المخزون</Badge>
    if (stock < reorderPoint) return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">مخزون منخفض</Badge>
    return <Badge variant="secondary" className="bg-green-300 text-green-900">متوفر</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>المخزون</CardTitle>
        <CardDescription>
          إدارة وتتبع مخزون الأدوية الخاص بك.
        </CardDescription>
        <div className="pt-4">
          <Input 
            placeholder="ابحث بالاسم أو المعرف..."
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
              <TableHead>المعرف</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الفئة</TableHead>
              <TableHead>المورد</TableHead>
              <TableHead className="text-left">المخزون</TableHead>
              <TableHead className="text-left">نقطة إعادة الطلب</TableHead>
              <TableHead>تاريخ الانتهاء</TableHead>
              <TableHead className="text-left">سعر البيع</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.supplierName}</TableCell>
                <TableCell className="text-left">{item.stock}</TableCell>
                <TableCell className="text-left">{item.reorderPoint}</TableCell>
                <TableCell>{new Date(item.expirationDate).toLocaleDateString('ar-EG')}</TableCell>
                <TableCell className="text-left">${item.price.toFixed(2)}</TableCell>
                <TableCell>{getStockStatus(item.stock, item.reorderPoint)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

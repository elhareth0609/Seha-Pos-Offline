
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
import type { Medication, AppSettings } from "@/lib/types"
import { differenceInDays, parseISO } from 'date-fns'
import { formatStock } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

export default function ExpiringSoonPage() {
  const { scopedData } = useAuth();
  const [allInventory] = scopedData.inventory;
  const [settings] = scopedData.settings;
  const [expiringMedications, setExpiringMedications] = React.useState<Medication[]>([]);

  const expirationThreshold = settings.expirationThresholdDays || 90;

  React.useEffect(() => {
    const today = new Date();
    const filtered = (allInventory || []).filter((item) => {
        if (!item.expirationDate) return false;
        const expirationDate = parseISO(item.expirationDate);
        const daysUntilExpiration = differenceInDays(expirationDate, today);
        return daysUntilExpiration >= 0 && daysUntilExpiration <= expirationThreshold;
    }).sort((a, b) => differenceInDays(parseISO(a.expirationDate), today) - differenceInDays(parseISO(b.expirationDate), today));
    setExpiringMedications(filtered);
  }, [allInventory, expirationThreshold]);

  const getExpirationBadge = (expirationDate: string) => {
    const today = new Date();
    const expDate = parseISO(expirationDate);
    const daysLeft = differenceInDays(expDate, today);

    if (daysLeft < 0) {
        return <Badge variant="destructive">منتهي الصلاحية</Badge>
    }
    if (daysLeft <= 30) {
      return <Badge variant="destructive">ينتهي قريبًا جدًا</Badge>
    }
    if (daysLeft <= 90) {
      return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">ينتهي قريبًا</Badge>
    }
    return null;
  };

  const formatDaysLeft = (expirationDate: string) => {
      const today = new Date();
      const expDate = parseISO(expirationDate);
      const daysLeft = differenceInDays(expDate, today);
       if (daysLeft < 0) {
        return "منتهي";
      }
      return `${daysLeft} يوم`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>الأدوية التي قاربت على الانتهاء</CardTitle>
        <CardDescription>
          قائمة بالأدوية التي ستنتهي صلاحيتها خلال {expirationThreshold} يومًا القادمة.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>الكمية المتبقية</TableHead>
              <TableHead>تاريخ الانتهاء</TableHead>
              <TableHead>الأيام المتبقية</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expiringMedications.length > 0 ? expiringMedications.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.tradeName}</TableCell>
                <TableCell>{formatStock(item.stock, item.purchaseUnit, item.saleUnit, item.itemsPerPurchaseUnit)}</TableCell>
                <TableCell>{new Date(item.expirationDate).toLocaleDateString('ar-EG')}</TableCell>
                <TableCell>{formatDaysLeft(item.expirationDate)}</TableCell>
                <TableCell>{getExpirationBadge(item.expirationDate)}</TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        لا توجد أدوية ستنتهي صلاحيتها قريبًا.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

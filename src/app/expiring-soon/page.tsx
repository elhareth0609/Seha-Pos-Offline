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
import { inventory as allInventory } from "@/lib/data"
import type { Medication } from "@/lib/types"
import { differenceInDays, parseISO } from 'date-fns'

const EXPIRATION_THRESHOLD_DAYS = 90;

export default function ExpiringSoonPage() {
  const [expiringMedications, setExpiringMedications] = React.useState<Medication[]>([]);

  React.useEffect(() => {
    const today = new Date();
    const filtered = allInventory.filter((item) => {
        if (!item.expirationDate) return false;
        const expirationDate = parseISO(item.expirationDate);
        const daysUntilExpiration = differenceInDays(expirationDate, today);
        return daysUntilExpiration > 0 && daysUntilExpiration <= EXPIRATION_THRESHOLD_DAYS;
    }).sort((a, b) => differenceInDays(parseISO(a.expirationDate), today) - differenceInDays(parseISO(b.expirationDate), today));
    setExpiringMedications(filtered);
  }, []);

  const getExpirationBadge = (expirationDate: string) => {
    const today = new Date();
    const expDate = parseISO(expirationDate);
    const daysLeft = differenceInDays(expDate, today);

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
      return `${daysLeft} يوم`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>الأدوية التي قاربت على الانتهاء</CardTitle>
        <CardDescription>
          قائمة بالأدوية التي ستنتهي صلاحيتها خلال {EXPIRATION_THRESHOLD_DAYS} يومًا القادمة.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>المورد</TableHead>
              <TableHead>تاريخ الانتهاء</TableHead>
              <TableHead>الأيام المتبقية</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expiringMedications.length > 0 ? expiringMedications.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.supplier}</TableCell>
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

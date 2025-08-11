
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
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ExpiringSoonPage() {
  const { scopedData } = useAuth();
  const [allInventory] = scopedData.inventory;
  const [settings] = scopedData.settings;
  const [expiringMedications, setExpiringMedications] = React.useState<Medication[]>([]);
  const [expiredMedications, setExpiredMedications] = React.useState<Medication[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');

  const expirationThreshold = settings.expirationThresholdDays || 90;

  React.useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const filteredExpiring = (allInventory || [])
        .filter((item) => {
            if (!item.expiration_date) return false;
            const expiration_date = parseISO(item.expiration_date);
            const daysUntilExpiration = differenceInDays(expiration_date, today);
            return daysUntilExpiration >= 0 && daysUntilExpiration <= expirationThreshold;
        })
        .filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (item.barcode?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => differenceInDays(parseISO(a.expiration_date), today) - differenceInDays(parseISO(b.expiration_date), today));
    
    const filteredExpired = (allInventory || [])
        .filter((item) => {
            if (!item.expiration_date) return false;
            const expiration_date = parseISO(item.expiration_date);
            const daysUntilExpiration = differenceInDays(expiration_date, today);
            return daysUntilExpiration < 0;
        })
        .filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (item.barcode?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => differenceInDays(parseISO(b.expiration_date), today) - differenceInDays(parseISO(a.expiration_date), today));

    setExpiringMedications(filteredExpiring);
    setExpiredMedications(filteredExpired);

  }, [allInventory, expirationThreshold, searchTerm]);

  const getExpirationBadge = (expiration_date: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const expDate = parseISO(expiration_date);
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

  const formatDaysLeft = (expiration_date: string) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const expDate = parseISO(expiration_date);
      const daysLeft = differenceInDays(expDate, today);
       if (daysLeft < 0) {
        return `منتهي منذ ${Math.abs(daysLeft)} يوم`;
      }
      return `${daysLeft} يوم`;
  }
  
  const renderTable = (meds: Medication[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>الاسم (الباركود)</TableHead>
          <TableHead>الكمية المتبقية</TableHead>
          <TableHead>تاريخ الانتهاء</TableHead>
          <TableHead>الأيام المتبقية</TableHead>
          <TableHead>الحالة</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {meds.length > 0 ? meds.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground font-mono">{item.barcode}</div>
            </TableCell>
            <TableCell className="font-mono">{item.stock}</TableCell>
            <TableCell className="font-mono">{new Date(item.expiration_date).toLocaleDateString('ar-EG')}</TableCell>
            <TableCell className="font-mono">{formatDaysLeft(item.expiration_date)}</TableCell>
            <TableCell>{getExpirationBadge(item.expiration_date)}</TableCell>
          </TableRow>
        )) : (
            <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    لا توجد بيانات لعرضها.
                </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>الأدوية المنتهية وقريبة الانتهاء</CardTitle>
        <CardDescription>
          قائمة بالأدوية التي ستنتهي صلاحيتها خلال {expirationThreshold} يومًا القادمة أو التي انتهت بالفعل.
        </CardDescription>
        <div className="pt-4">
            <Input 
              placeholder="ابحث بالاسم أو الباركود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="expiring">
            <TabsList>
                <TabsTrigger value="expiring">قريب الانتهاء ({expiringMedications.length})</TabsTrigger>
                <TabsTrigger value="expired">منتهي الصلاحية ({expiredMedications.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="expiring">
                {renderTable(expiringMedications)}
            </TabsContent>
            <TabsContent value="expired">
                {renderTable(expiredMedications)}
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}


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
import type { Medication, PaginatedResponse } from "@/lib/types"
import { differenceInDays, parseISO, startOfToday } from 'date-fns'
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"

export default function ExpiringSoonPage() {
  const { getPaginatedExpiringSoon } = useAuth();
  
  const [expiringMedications, setExpiringMedications] = React.useState<Medication[]>([]);
  const [expiredMedications, setExpiredMedications] = React.useState<Medication[]>([]);

  const [expiringMedicationsLength, setExpiringMedicationsLength] = React.useState(0);
  const [expiredMedicationsLength, setExpiredMedicationsLength] = React.useState(0);

  const [expiringTotalPages, setExpiringTotalPages] = React.useState(1);
  const [expiringCurrentPage, setExpiringCurrentPage] = React.useState(1);
  const [expiredTotalPages, setExpiredTotalPages] = React.useState(1);
  const [expiredCurrentPage, setExpiredCurrentPage] = React.useState(1);
  
  const [perPage, setPerPage] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('expiring');


  const fetchData = React.useCallback(async (page: number, limit: number, search: string, type: 'expiring' | 'expired') => {
    setLoading(true);
    try {
        const {data, last_page, current_page, expiringMedicationsLength, expiredMedicationsLength} = await getPaginatedExpiringSoon(page, limit, search, type);
        setExpiringMedicationsLength(expiringMedicationsLength);
        setExpiredMedicationsLength(expiredMedicationsLength);
        if (type === 'expiring') {
            setExpiringMedications(data);
            setExpiringTotalPages(last_page);
            setExpiringCurrentPage(current_page);
        } else {
            setExpiredMedications(data);
            setExpiredTotalPages(last_page);
            setExpiredCurrentPage(current_page);
        }
    } catch (error) {
        console.error("Failed to fetch expiring medications", error);
    } finally {
        setLoading(false);
    }
  }, [getPaginatedExpiringSoon]);

  React.useEffect(() => {
    fetchData(1, perPage, searchTerm, activeTab as 'expiring' | 'expired');
  }, [perPage, searchTerm, activeTab, fetchData]);


  const getExpirationBadge = (expiration_date: string) => {
    const today = startOfToday();
    const expDate = parseISO(expiration_date);
    
    if (expDate < today) {
        return <Badge variant="destructive">منتهي الصلاحية</Badge>
    }

    const daysLeft = differenceInDays(expDate, today);
    if (daysLeft <= 30) {
      return <Badge variant="destructive">ينتهي قريبًا جدًا</Badge>
    }
    if (daysLeft <= 90) {
      return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">ينتهي قريبًا</Badge>
    }
    return null;
  };

  const formatDaysLeft = (expiration_date: string) => {
      const today = startOfToday();
      const expDate = parseISO(expiration_date);
      const daysLeft = differenceInDays(expDate, today);
       if (daysLeft < 0) {
        return `منتهي منذ ${Math.abs(daysLeft)} يوم`;
      }
      return `${daysLeft} يوم`;
  }
  
  const renderTable = (meds: Medication[], currentPage: number, totalPages: number, setPage: (page: number) => void) => (
    <div>
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
            {loading ? Array.from({ length: perPage }).map((_, i) => (
                <TableRow key={`skel-${i}`} className="text-right">
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                </TableRow>
            )) : meds.length > 0 ? meds.map((item) => (
              <TableRow key={item.id} className="text-right">
                <TableCell>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{item.barcodes?.join(', ')}</div>
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
         <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-muted-foreground">
                  الصفحة {currentPage} من {totalPages}
              </span>
              <div className="flex gap-2">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1 || loading}
                  >
                      السابق
                  </Button>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages || loading}
                  >
                      التالي
                  </Button>
              </div>
          </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>الأدوية المنتهية وقريبة الانتهاء</CardTitle>
        <CardDescription>
          قائمة بالأدوية التي انتهت صلاحيتها أو التي على وشك الانتهاء.
        </CardDescription>
        <div className="pt-4 flex flex-wrap gap-2">
            <Input 
              placeholder="ابحث بالاسم أو الباركود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
             <div className="flex items-center gap-2">
              <Label htmlFor="per-page" className="shrink-0">لكل صفحة:</Label>
              <Select value={String(perPage)} onValueChange={(val) => setPerPage(Number(val))}>
                <SelectTrigger id="per-page" className="w-20 h-9">
                  <SelectValue placeholder={perPage} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="expiring" onValueChange={setActiveTab}>
            <TabsList>
                <TabsTrigger value="expiring">قريب الانتهاء ({expiringMedicationsLength})</TabsTrigger>
                <TabsTrigger value="expired">منتهي الصلاحية ({expiredMedicationsLength})</TabsTrigger>
            </TabsList>
            <TabsContent value="expiring">
                {renderTable(expiringMedications, expiringCurrentPage, expiringTotalPages, (p) => fetchData(p, perPage, searchTerm, 'expiring'))}
            </TabsContent>
            <TabsContent value="expired">
                {renderTable(expiredMedications, expiredCurrentPage, expiredTotalPages, (p) => fetchData(p, perPage, searchTerm, 'expired'))}
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

    
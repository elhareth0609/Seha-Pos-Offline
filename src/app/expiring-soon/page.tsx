
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import type { Medication } from "@/lib/types"
import { differenceInDays, parseISO, startOfToday } from 'date-fns'
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { ShoppingBasket, Trash2 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export default function ExpiringSoonPage() {
  const { getPaginatedExpiringSoon, markAsDamaged, addToOrderRequestCart } = useAuth();
  
  const [expiringMedications, setExpiringMedications] = React.useState<Medication[]>([]);
  const [expiredMedications, setExpiredMedications] = React.useState<Medication[]>([]);
  const [damagedMedications, setDamagedMedications] = React.useState<Medication[]>([]);

  const [expiringMedicationsLength, setExpiringMedicationsLength] = React.useState(0);
  const [expiredMedicationsLength, setExpiredMedicationsLength] = React.useState(0);
  const [damagedMedicationsLength, setDamagedMedicationsLength] = React.useState(0);


  const [expiringTotalPages, setExpiringTotalPages] = React.useState(1);
  const [expiringCurrentPage, setExpiringCurrentPage] = React.useState(1);
  const [expiredTotalPages, setExpiredTotalPages] = React.useState(1);
  const [expiredCurrentPage, setExpiredCurrentPage] = React.useState(1);
  const [damagedTotalPages, setDamagedTotalPages] = React.useState(1);
  const [damagedCurrentPage, setDamagedCurrentPage] = React.useState(1);
  
  const [perPage, setPerPage] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('expiring');


  const fetchData = React.useCallback(async (page: number, limit: number, search: string, type: 'expiring' | 'expired' | 'damaged') => {
    setLoading(true);
    try {
        const result = await getPaginatedExpiringSoon(page, limit, search, type);
        setExpiringMedicationsLength(result.expiringMedicationsLength);
        setExpiredMedicationsLength(result.expiredMedicationsLength);
        setDamagedMedicationsLength(result.damagedMedicationsLength);

        switch(type) {
            case 'expiring':
                setExpiringMedications(result.data);
                setExpiringTotalPages(result.last_page);
                setExpiringCurrentPage(result.current_page);
                break;
            case 'expired':
                setExpiredMedications(result.data);
                setExpiredTotalPages(result.last_page);
                setExpiredCurrentPage(result.current_page);
                break;
            case 'damaged':
                setDamagedMedications(result.data);
                setDamagedTotalPages(result.last_page);
                setDamagedCurrentPage(result.current_page);
                break;
        }
    } catch (error) {
        console.error("Failed to fetch medications", error);
    } finally {
        setLoading(false);
    }
  }, [getPaginatedExpiringSoon]);

  React.useEffect(() => {
    fetchData(1, perPage, searchTerm, activeTab as 'expiring' | 'expired' | 'damaged');
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
  
  const handleMarkAsDamaged = async (medId: string) => {
      const success = await markAsDamaged(medId);
      if(success) {
          fetchData(1, perPage, searchTerm, 'expired');
          fetchData(1, perPage, '', 'damaged');
      }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>الأدوية المنتهية وقريبة الانتهاء والتالفة</CardTitle>
        <CardDescription>
          قائمة بالأدوية التي انتهت صلاحيتها أو على وشك الانتهاء، والأدوية التي تم إتلافها.
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
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="expiring">قريب الانتهاء ({expiringMedicationsLength})</TabsTrigger>
                <TabsTrigger value="expired">منتهي الصلاحية ({expiredMedicationsLength})</TabsTrigger>
                <TabsTrigger value="damaged">تالف ({damagedMedicationsLength})</TabsTrigger>
            </TabsList>
            <TabsContent value="expiring">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم (الباركود)</TableHead>
                      <TableHead>الكمية المتبقية</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                      <TableHead>الأيام المتبقية</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-left">الإجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? Array.from({ length: perPage }).map((_, i) => (
                        <TableRow key={`skel-expiring-${i}`} className="text-right">
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                    )) : expiringMedications.length > 0 ? expiringMedications.map((item) => (
                      <TableRow key={item.id} className="text-right">
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{item.barcodes?.join(', ')}</div>
                        </TableCell>
                        <TableCell className="font-mono">{item.stock}</TableCell>
                        <TableCell className="font-mono">{new Date(item.expiration_date).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell className="font-mono">{formatDaysLeft(item.expiration_date)}</TableCell>
                        <TableCell>{getExpirationBadge(item.expiration_date)}</TableCell>
                        <TableCell className="text-left">
                            <Button variant="ghost" size="icon" onClick={() => addToOrderRequestCart(item)}>
                                <ShoppingBasket className="h-5 w-5 text-blue-600"/>
                            </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                لا توجد بيانات لعرضها.
                            </TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
                 <div className="flex items-center justify-between pt-4">
                      <span className="text-sm text-muted-foreground">
                          الصفحة {expiringCurrentPage} من {expiringTotalPages}
                      </span>
                      <div className="flex gap-2">
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchData(Math.max(expiringCurrentPage - 1, 1), perPage, searchTerm, 'expiring')}
                              disabled={expiringCurrentPage === 1 || loading}
                          >
                              السابق
                          </Button>
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchData(Math.min(expiringCurrentPage + 1, expiringTotalPages), perPage, searchTerm, 'expiring')}
                              disabled={expiringCurrentPage === expiringTotalPages || loading}
                          >
                              التالي
                          </Button>
                      </div>
                  </div>
            </TabsContent>
            <TabsContent value="expired">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم (الباركود)</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-left">الإجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? Array.from({ length: perPage }).map((_, i) => (
                        <TableRow key={`skel-expired-${i}`} className="text-right">
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                             <TableCell><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
                        </TableRow>
                    )) : expiredMedications.length > 0 ? expiredMedications.map((item) => (
                      <TableRow key={item.id} className="text-right">
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{item.barcodes?.join(', ')}</div>
                        </TableCell>
                        <TableCell className="font-mono">{item.stock}</TableCell>
                        <TableCell className="font-mono">{new Date(item.expiration_date).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell>{getExpirationBadge(item.expiration_date)}</TableCell>
                        <TableCell className="text-left">
                            <div className="flex justify-end items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => addToOrderRequestCart(item)}>
                                    <ShoppingBasket className="h-5 w-5 text-blue-600"/>
                                </Button>
                               <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="me-2 h-4 w-4"/>
                                            نقل إلى التالف
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                سيتم نقل {item.name} (كمية: {item.stock}) إلى قائمة التالف وحذفه من المخزون. لا يمكن التراجع عن هذا الإجراء.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleMarkAsDamaged(item.id)} className={buttonVariants({ variant: "destructive" })}>
                                                نعم، قم بالنقل
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </TableCell>
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
                          الصفحة {expiredCurrentPage} من {expiredTotalPages}
                      </span>
                      <div className="flex gap-2">
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchData(Math.max(expiredCurrentPage - 1, 1), perPage, searchTerm, 'expired')}
                              disabled={expiredCurrentPage === 1 || loading}
                          >
                              السابق
                          </Button>
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchData(Math.min(expiredCurrentPage + 1, expiredTotalPages), perPage, searchTerm, 'expired')}
                              disabled={expiredCurrentPage === expiredTotalPages || loading}
                          >
                              التالي
                          </Button>
                      </div>
                  </div>
            </TabsContent>
            <TabsContent value="damaged">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم (الباركود)</TableHead>
                      <TableHead>الكمية المتلفة</TableHead>
                      <TableHead>سعر الشراء</TableHead>
                      <TableHead>إجمالي الخسارة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? Array.from({ length: perPage }).map((_, i) => (
                        <TableRow key={`skel-damaged-${i}`} className="text-right">
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        </TableRow>
                    )) : damagedMedications.length > 0 ? damagedMedications.map((item) => (
                      <TableRow key={item.id} className="text-right bg-destructive/10">
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{item.barcodes?.join(', ')}</div>
                        </TableCell>
                        <TableCell className="font-mono">{item.stock}</TableCell>
                        <TableCell className="font-mono">{item.purchase_price.toLocaleString()}</TableCell>
                        <TableCell className="font-mono font-semibold text-destructive">{(item.stock * item.purchase_price).toLocaleString()}</TableCell>
                      </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                لا توجد أدوية تالفة.
                            </TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between pt-4">
                      <span className="text-sm text-muted-foreground">
                          الصفحة {damagedCurrentPage} من {damagedTotalPages}
                      </span>
                      <div className="flex gap-2">
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchData(Math.max(damagedCurrentPage - 1, 1), perPage, searchTerm, 'damaged')}
                              disabled={damagedCurrentPage === 1 || loading}
                          >
                              السابق
                          </Button>
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchData(Math.min(damagedCurrentPage + 1, damagedTotalPages), perPage, searchTerm, 'damaged')}
                              disabled={damagedCurrentPage === damagedTotalPages || loading}
                          >
                              التالي
                          </Button>
                      </div>
                  </div>
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

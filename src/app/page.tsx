
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { inventory as fallbackInventory, sales as fallbackSales, appSettings as fallbackSettings } from "@/lib/data";
import type { Medication, Sale, AppSettings } from "@/lib/types";
import { DollarSign, Clock, TrendingDown, FileText, Calendar, CalendarDays, TrendingUp, PieChart } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { differenceInDays, parseISO, startOfToday, startOfWeek, startOfMonth, isWithinInterval } from 'date-fns';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [inventory] = useLocalStorage<Medication[]>('inventory', fallbackInventory);
  const [sales] = useLocalStorage<Sale[]>('sales', fallbackSales);
  const [settings] = useLocalStorage<AppSettings>('appSettings', fallbackSettings);
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const totalRevenue = sales.reduce((acc, sale) => acc + (sale.total || 0), 0);
  const totalProfit = sales.reduce((acc, sale) => acc + (sale.profit || 0) - (sale.discount || 0), 0);
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const lowStockItems = inventory.filter(
    (item) => item.stock < item.reorderPoint
  );
  
  const expirationThreshold = settings.expirationThresholdDays || 90;

  const expiringSoonItems = inventory.filter(item => {
    if (!item.expirationDate) return false;
    const daysLeft = differenceInDays(parseISO(item.expirationDate), new Date());
    return daysLeft > 0 && daysLeft <= expirationThreshold;
  }).sort((a,b) => differenceInDays(parseISO(a.expirationDate), new Date()) - differenceInDays(parseISO(b.expirationDate), new Date()));
  
  const topSellingMedications = React.useMemo(() => {
    const stats: { [medId: string]: { name: string; quantity: number } } = {};

    sales.forEach(sale => {
        sale.items.forEach(item => {
            if (item.isReturn) return; 

            if (!stats[item.medicationId]) {
                stats[item.medicationId] = {
                    name: item.name,
                    quantity: 0,
                };
            }
            stats[item.medicationId].quantity += item.quantity;
        });
    });

    const statsArray = Object.values(stats);
    return [...statsArray].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [sales]);

  const {
    totalSalesToday,
    salesTodayCount,
    totalSalesWeek,
    salesWeekCount,
    totalSalesMonth,
    salesMonthCount,
    totalInvoices
  } = React.useMemo(() => {
    const today = startOfToday();
    const weekStart = startOfWeek(today);
    const monthStart = startOfMonth(today);

    const salesToday = sales.filter(s => isWithinInterval(new Date(s.date), { start: today, end: new Date() }));
    const salesThisWeek = sales.filter(s => isWithinInterval(new Date(s.date), { start: weekStart, end: new Date() }));
    const salesThisMonth = sales.filter(s => isWithinInterval(new Date(s.date), { start: monthStart, end: new Date() }));

    return {
      totalSalesToday: salesToday.reduce((acc, sale) => acc + (sale.total || 0), 0),
      salesTodayCount: salesToday.length,
      totalSalesWeek: salesThisWeek.reduce((acc, sale) => acc + (sale.total || 0), 0),
      salesWeekCount: salesThisWeek.length,
      totalSalesMonth: salesThisMonth.reduce((acc, sale) => acc + (sale.total || 0), 0),
      salesMonthCount: salesThisMonth.length,
      totalInvoices: sales.length,
    };
  }, [sales]);

  if (!isClient) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-2/3" />
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-2/3" />
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-2/3" />
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-2/3" />
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          <Card><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          <Card><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          <Card><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue.toLocaleString('ar-IQ')} د.ع
            </div>
            <p className="text-xs text-muted-foreground">
              إجمالي الإيرادات المحققة من جميع المبيعات.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">هامش الربح</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profitMargin.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
             النسبة المئوية للربح من الإيرادات.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أصناف منخفضة المخزون</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              أصناف تحتاج لإعادة طلب
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أصناف قريبة الانتهاء</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringSoonItems.length}</div>
            <p className="text-xs text-muted-foreground">
              ستنتهي صلاحيتها خلال {expirationThreshold} يومًا
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مبيعات اليوم</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalSalesToday.toLocaleString('ar-IQ')} د.ع
              </div>
              <p className="text-xs text-muted-foreground">
                من {salesTodayCount} فاتورة
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مبيعات هذا الأسبوع</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalSalesWeek.toLocaleString('ar-IQ')} د.ع
              </div>
              <p className="text-xs text-muted-foreground">
                من {salesWeekCount} فاتورة
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مبيعات هذا الشهر</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalSalesMonth.toLocaleString('ar-IQ')} د.ع
              </div>
              <p className="text-xs text-muted-foreground">
                من {salesMonthCount} فاتورة
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي عدد الفواتير</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvoices}</div>
              <p className="text-xs text-muted-foreground">
                إجمالي الفواتير المسجلة
              </p>
            </CardContent>
          </Card>
      </div>


       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
              <CardHeader className="flex-row items-center justify-between">
                  <div>
                      <CardTitle>أصناف منخفضة المخزون</CardTitle>
                      <CardDescription>هذه الأصناف وصلت أو تجاوزت نقطة إعادة الطلب.</CardDescription>
                  </div>
                  <Link href="/inventory">
                      <Button variant="outline">عرض المخزون</Button>
                  </Link>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>الاسم</TableHead>
                              <TableHead>المخزون</TableHead>
                              <TableHead>نقطة الطلب</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {lowStockItems.length > 0 ? lowStockItems.slice(0,5).map(item => (
                              <TableRow key={item.id}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell><Badge variant="destructive">{item.stock}</Badge></TableCell>
                                  <TableCell>{item.reorderPoint}</TableCell>
                              </TableRow>
                          )) : (
                              <TableRow>
                                  <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">لا توجد أصناف منخفضة المخزون.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex-row items-center justify-between">
                  <div>
                      <CardTitle>أصناف قريبة الانتهاء</CardTitle>
                      <CardDescription>ستنتهي صلاحية هذه الأصناف خلال {expirationThreshold} يومًا.</CardDescription>
                  </div>
                   <Link href="/expiring-soon">
                      <Button variant="outline">عرض الكل</Button>
                  </Link>
              </CardHeader>
              <CardContent>
                   <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>الاسم</TableHead>
                              <TableHead>تاريخ الانتهاء</TableHead>
                              <TableHead>الأيام المتبقية</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {expiringSoonItems.length > 0 ? expiringSoonItems.slice(0,5).map(item => (
                              <TableRow key={item.id}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>{new Date(item.expirationDate).toLocaleDateString('ar-EG')}</TableCell>
                                  <TableCell><Badge variant="secondary" className="bg-yellow-400 text-yellow-900">{differenceInDays(parseISO(item.expirationDate), new Date())} يوم</Badge></TableCell>
                              </TableRow>
                          )) : (
                              <TableRow>
                                  <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">لا توجد أصناف قريبة الانتهاء.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>الأدوية الأكثر مبيعًا</CardTitle>
                <CardDescription>أفضل 5 أدوية مبيعًا حسب الكمية.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>الدواء</TableHead>
                          <TableHead className="text-left">الكمية المباعة</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {topSellingMedications.length > 0 ? topSellingMedications.map((item, index) => (
                          <TableRow key={index}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-left font-mono">{item.quantity}</TableCell>
                          </TableRow>
                      )) : (
                          <TableRow>
                              <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">
                                  لا توجد بيانات مبيعات لعرضها.
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

    

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Medication, Sale, AppSettings } from "@/lib/types";
import { DollarSign, Clock, TrendingDown, TrendingUp, PieChart, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { differenceInDays, parseISO, startOfToday, startOfWeek, startOfMonth, isWithinInterval, isToday, endOfMonth, endOfWeek, subMonths, startOfYear, endOfYear } from 'date-fns';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AdCarousel from "@/components/ui/ad-carousel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Dashboard() {
  const { scopedData } = useAuth();
  const [inventory] = scopedData.inventory;
  const [sales] = scopedData.sales;
  const [settings] = scopedData.settings;
  const [isClient, setIsClient] = React.useState(false);
  const [timeFilter, setTimeFilter] = React.useState<'today' | 'week' | 'month' | 'all'>('month');
  const [dateFrom, setDateFrom] = React.useState<string>(startOfMonth(new Date()).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = React.useState<string>(endOfMonth(new Date()).toISOString().split('T')[0]);


  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleTimeFilterChange = (value: string) => {
    const now = new Date();
    switch (value) {
        case 'today':
            setDateFrom(now.toISOString().split('T')[0]);
            setDateTo(now.toISOString().split('T')[0]);
            break;
        case 'week':
            setDateFrom(startOfWeek(now, { weekStartsOn: 6 }).toISOString().split('T')[0]);
            setDateTo(endOfWeek(now, { weekStartsOn: 6 }).toISOString().split('T')[0]);
            break;
        case 'month':
            setDateFrom(startOfMonth(now).toISOString().split('T')[0]);
            setDateTo(endOfMonth(now).toISOString().split('T')[0]);
            break;
        case 'last_month':
            const lastMonth = subMonths(now, 1);
            setDateFrom(startOfMonth(lastMonth).toISOString().split('T')[0]);
            setDateTo(endOfMonth(lastMonth).toISOString().split('T')[0]);
            break;
        case 'year':
            setDateFrom(startOfYear(now).toISOString().split('T')[0]);
            setDateTo(endOfYear(now).toISOString().split('T')[0]);
            break;
        default:
            setDateFrom("");
            setDateTo("");
    }
  }

  const totalRevenue = sales.reduce((acc, sale) => {
    const total = typeof sale.total === 'number' ? sale.total : parseFloat(String(sale.total || 0));
    return acc + (isNaN(total) ? 0 : total);
  }, 0);
  const totalProfit = sales.reduce((acc, sale) => {
      const  total = (typeof sale.profit === 'number' ? sale.profit : parseFloat(String(sale.profit || 0))) -
      (typeof sale.discount === 'number' ? sale.discount : parseFloat(String(sale.discount || 0)));
      return acc + (isNaN(total) ? 0 : total);
  }, 0);
  // const totalProfit = sales.reduce((acc, sale) => acc + (sale.profit || 0) - (sale.discount || 0), 0);
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const lowStockItems = inventory.filter(
    (item) => item.stock < item.reorder_point
  );

  const reorder_pointItems = inventory.filter(
    (item) => item.stock > 0 && item.stock <= item.reorder_point
  );
  
  const expirationThreshold = settings.expirationThresholdDays || 90;
  
  const today = startOfToday();

  const expiredItems = inventory.filter(item => {
    if (!item.expiration_date) return false;
    return parseISO(item.expiration_date) < today;
  });

  const expiringSoonItems = inventory.filter(item => {
    if (!item.expiration_date) return false;
    const expDate = parseISO(item.expiration_date);
    const daysLeft = differenceInDays(expDate, today);
    return daysLeft >= 0 && daysLeft <= expirationThreshold;
  }).sort((a,b) => differenceInDays(parseISO(a.expiration_date), today) - differenceInDays(parseISO(b.expiration_date), today));
  
  const topSellingMedications = React.useMemo(() => {
    const stats: { [medId: string]: { name: string; quantity: number } } = {};

    sales.forEach(sale => {
        (sale.items || []).forEach(item => {
            if (item.is_return) return; 

            if (!stats[item.medication_id]) {
                stats[item.medication_id] = {
                    name: item.name,
                    quantity: 0,
                };
            }
            stats[item.medication_id].quantity += item.quantity;
        });
    });

    const statsArray = Object.keys(stats).map(medId => ({
        medication_id: medId,
        name: stats[medId].name,
        quantity: stats[medId].quantity
    }));

    return statsArray.sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [sales]);

  const salesPerformance = React.useMemo(() => {
    if (!isClient) return { totalRevenue: 0, totalProfit: 0, profitMargin: 0, invoiceCount: 0 };
    
    let filteredSales = sales;

    if (dateFrom && dateTo) {
        const from = new Date(dateFrom);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filteredSales = sales.filter(sale => isWithinInterval(parseISO(sale.date), { start: from, end: to }));
    }

    const currentTotalRevenue = filteredSales.reduce((acc, sale) => {
        const total = typeof sale.total === 'number' ? sale.total : parseFloat(String(sale.total || 0));
        return acc + (isNaN(total) ? 0 : total);
    }, 0);
    const currentTotalProfit = filteredSales.reduce((acc, sale) => {
        const total = (typeof sale.profit === 'number' ? sale.profit : parseFloat(String(sale.profit || 0))) - (typeof sale.discount === 'number' ? sale.discount : parseFloat(String(sale.discount || 0)));
        return acc + (isNaN(total) ? 0 : total);
    }, 0);
    const currentProfitMargin = currentTotalRevenue > 0 ? (currentTotalProfit / currentTotalRevenue) * 100 : 0;
    const invoiceCount = filteredSales.length;

    return { totalRevenue: currentTotalRevenue, totalProfit: currentTotalProfit, profitMargin: currentProfitMargin, invoiceCount };
  }, [sales, dateFrom, dateTo, isClient]);


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
        <Card className="lg:col-span-4">
            <CardHeader className="flex-row items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-80" />
            </CardHeader>
            <CardContent className="grid gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </CardContent>
        </Card>
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
      <AdCarousel page="dashboard" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات (الكلي)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
                {totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              مجموع المبالغ النهائية لجميع الفواتير.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">هامش الربح (الكلي)</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
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
            <div className="text-2xl font-bold font-mono">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              أصناف نفدت أو على وشك النفاد
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تحتاج إعادة طلب</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{reorder_pointItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قريب الانتهاء</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{expiringSoonItems.length}</div>
          </CardContent>
        </Card>
      </div>

       <Card className="lg:col-span-4">
            <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>أداء المبيعات لفترة محددة</CardTitle>
                    <CardDescription>
                        اختر الفترة الزمنية لعرض إحصائيات المبيعات والأرباح.
                    </CardDescription>
                </div>
                 <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="grid grid-cols-2 gap-2 flex-grow">
                         <div className="space-y-1">
                            <Label htmlFor="date-from" className="text-xs">من</Label>
                            <Input id="date-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9"/>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="date-to" className="text-xs">إلى</Label>
                            <Input id="date-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9"/>
                        </div>
                    </div>
                     <div className="flex items-end">
                        <Tabs defaultValue="month" onValueChange={handleTimeFilterChange} dir="ltr">
                            <TabsList className="h-9">
                                <TabsTrigger value="today">اليوم</TabsTrigger>
                                <TabsTrigger value="week">أسبوع</TabsTrigger>
                                <TabsTrigger value="month">شهر</TabsTrigger>
                                <TabsTrigger value="last_month">آخر شهر</TabsTrigger>
                                <TabsTrigger value="year">سنة</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1.5 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">إجمالي المبيعات</span>
                        <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="text-3xl font-bold font-mono">
                          {salesPerformance.totalRevenue.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">من {salesPerformance.invoiceCount} فاتورة</p>
                </div>
                <div className="flex flex-col gap-1.5 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">صافي الربح</span>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-green-600 font-mono">
                        {salesPerformance.totalProfit.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">الربح بعد طرح تكلفة البضاعة والخصومات</p>
                </div>
                <div className="flex flex-col gap-1.5 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">هامش الربح</span>
                        <PieChart className="h-5 w-5" />
                    </div>
                    <div className="text-3xl font-bold font-mono">
                        {salesPerformance.profitMargin.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">نسبة الربح الصافي من الإيرادات</p>
                </div>
            </CardContent>
        </Card>


       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
              <CardHeader className="flex-row items-center justify-between">
                  <div>
                      <CardTitle>تحتاج إعادة طلب</CardTitle>
                  </div>
                  <Link href="/inventory">
                      <Button variant="outline">عرض المخزون</Button>
                  </Link>
              </CardHeader>
              <CardContent>
                   <ScrollArea className="h-64">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>الاسم</TableHead>
                                  <TableHead>المخزون</TableHead>
                                  <TableHead>نقطة الطلب</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {reorder_pointItems.length > 0 ? reorder_pointItems.map(item => (
                                  <TableRow key={item.id} className="text-right">
                                      <TableCell className="font-medium">{item.name}</TableCell>
                                      <TableCell>
                                        <Badge variant="destructive" className="font-mono">{item.stock}</Badge>
                                      </TableCell>
                                      <TableCell>
                                        <div className="font-medium">{item.reorder_point}</div>
                                      </TableCell>
                                  </TableRow>
                              )) : (
                                  <TableRow>
                                      <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">لا توجد أصناف.</TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </ScrollArea>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex-row items-center justify-between">
                  <div>
                      <CardTitle>قريب الانتهاء ومنتهي الصلاحية</CardTitle>
                  </div>
                  <Link href="/expiring-soon">
                      <Button variant="outline">عرض الكل</Button>
                  </Link>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-64">
                    <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-1/2">الاسم</TableHead>
                              <TableHead className="w-1/2">الحالة</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {expiredItems.length > 0 && expiredItems.map(item => (
                              <TableRow key={item.id}>
                                  <TableCell className="text-right">
                                      <div className="font-medium">{item.name}</div>
                                      <div className="text-xs text-muted-foreground font-mono">{item.barcodes?.join(', ')}</div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge variant="destructive">منتهي الصلاحية</Badge>
                                  </TableCell>
                              </TableRow>
                          ))}
                          {expiringSoonItems.length > 0 && expiringSoonItems.map(item => (
                              <TableRow key={item.id}>
                                  <TableCell className="text-right">
                                      <div className="font-medium">{item.name}</div>
                                      <div className="text-xs text-muted-foreground font-mono">{item.barcodes?.join(', ')}</div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 font-mono">{differenceInDays(parseISO(item.expiration_date), new Date())} يوم</Badge>
                                  </TableCell>
                              </TableRow>
                          ))}
                          {expiredItems.length === 0 && expiringSoonItems.length === 0 && (
                              <TableRow>
                                  <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">لا توجد أصناف.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>الأدوية الأكثر مبيعًا</CardTitle>
                <CardDescription>أفضل 5 أدوية مبيعًا حسب الكمية.</CardDescription>
            </CardHeader>
            <CardContent>
             <ScrollArea className="h-64">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead >الدواء</TableHead>
                          <TableHead>الكمية المباعة</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {topSellingMedications.length > 0 ? topSellingMedications.map((item) => (
                          <TableRow key={item.medication_id}>
                              <TableCell className="font-medium text-right">{item.name}</TableCell>
                              <TableCell className="font-mono text-right">{item.quantity}</TableCell>
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
              </ScrollArea>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}



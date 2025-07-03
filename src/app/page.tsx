
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
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { inventory as fallbackInventory, sales as fallbackSales, purchaseOrders as fallbackPurchaseOrders, supplierReturns as fallbackReturns, appSettings as fallbackSettings } from "@/lib/data";
import type { Medication, Sale, PurchaseOrder, Return, AppSettings } from "@/lib/types";
import { DollarSign, Package, Clock, TrendingDown, Landmark, ListFilter } from "lucide-react";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { differenceInDays, parseISO } from 'date-fns';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const [inventory, setInventory] = useLocalStorage<Medication[]>('inventory', fallbackInventory);
  const [sales, setSales] = useLocalStorage<Sale[]>('sales', fallbackSales);
  const [purchaseOrders, setPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', fallbackPurchaseOrders);
  const [supplierReturns, setSupplierReturns] = useLocalStorage<Return[]>('supplierReturns', fallbackReturns);
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', fallbackSettings);
  const [isClient, setIsClient] = React.useState(false);
  
  const [analysisType, setAnalysisType] = React.useState<'topSelling' | 'leastSelling' | 'mostProfitable'>('topSelling');

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const totalRevenue = sales.reduce((acc, sale) => acc + (sale.total || 0), 0);
  
  const totalPurchases = purchaseOrders.reduce((acc, po) => acc + (po.totalAmount || 0), 0);
  const totalReturns = supplierReturns.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
  const totalDebt = totalPurchases - totalReturns;

  const lowStockItems = inventory.filter(
    (item) => item.stock < item.reorderPoint
  );
  
  const expirationThreshold = settings.expirationThresholdDays || 90;

  const expiringSoonItems = inventory.filter(item => {
    if (!item.expirationDate) return false;
    const daysLeft = differenceInDays(parseISO(item.expirationDate), new Date());
    return daysLeft > 0 && daysLeft <= expirationThreshold;
  }).sort((a,b) => differenceInDays(parseISO(a.expirationDate), new Date()) - differenceInDays(parseISO(b.expirationDate), new Date()));

  const salesDataForChart = sales.map(sale => ({
    date: new Date(sale.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
    total: sale.total,
  })).slice(-10);
  
  const medicationAnalysis = React.useMemo(() => {
    const stats: { [medId: string]: { name: string; quantity: number; profit: number } } = {};

    sales.forEach(sale => {
        sale.items.forEach(item => {
            if (item.isReturn) return; 

            if (!stats[item.medicationId]) {
                stats[item.medicationId] = {
                    name: item.name,
                    quantity: 0,
                    profit: 0
                };
            }
            stats[item.medicationId].quantity += item.quantity;
            stats[item.medicationId].profit += (item.price - item.purchasePrice) * item.quantity;
        });
    });

    const statsArray = Object.values(stats);

    const topSelling = [...statsArray].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    const leastSelling = [...statsArray].sort((a, b) => a.quantity - b.quantity).slice(0, 5);
    const mostProfitable = [...statsArray].sort((a, b) => b.profit - a.profit).slice(0, 5);

    return { topSelling, leastSelling, mostProfitable };
  }, [sales]);


  const analysisLabels = {
    topSelling: 'الأكثر مبيعًا',
    leastSelling: 'الأقل مبيعًا',
    mostProfitable: 'الأكثر ربحًا',
  };

  const currentAnalysisData = medicationAnalysis[analysisType];


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
              <Landmark className="h-4 w-4 text-muted-foreground" />
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
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </CardHeader>
          <CardContent className="ps-2">
            <Skeleton className="h-[300px] w-full" />
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
              بناءً على إجمالي المبيعات
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الديون (للموردين)</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {totalDebt.toLocaleString('ar-IQ')} د.ع
            </div>
            <p className="text-xs text-muted-foreground">
              إجمالي المستحقات للموردين
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

      <Card>
        <CardHeader>
          <CardTitle>نظرة عامة على المبيعات</CardTitle>
          <CardDescription>نظرة على آخر 10 معاملات بيع.</CardDescription>
        </CardHeader>
        <CardContent className="ps-2">
            <ChartContainer
              config={{
                  total: { label: 'الإجمالي', color: 'hsl(var(--primary))' },
              }}
              className="h-[300px] w-full"
          >
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesDataForChart} layout="horizontal">
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} reversed={true} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value.toLocaleString('ar-IQ')}`} orientation="right" />
                        <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" formatter={(value) => `${Number(value).toLocaleString('ar-IQ')} د.ع`}/>} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

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
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>تحليلات الأدوية</CardTitle>
                <CardDescription>
                  نظرة على أداء الأدوية في المبيعات.
                </CardDescription>
              </div>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="ms-auto gap-1">
                          <ListFilter className="h-3.5 w-3.5" />
                          <span className="sr-only sm:not-sr-only">
                              {analysisLabels[analysisType]}
                          </span>
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuRadioGroup value={analysisType} onValueChange={(v) => setAnalysisType(v as any)}>
                          <DropdownMenuRadioItem value="topSelling">الأكثر مبيعًا</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="leastSelling">الأقل مبيعًا</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="mostProfitable">الأكثر ربحًا</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>الدواء</TableHead>
                          <TableHead className="text-left">
                              {analysisType === 'mostProfitable' ? 'إجمالي الربح' : 'الكمية المباعة'}
                          </TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {currentAnalysisData.length > 0 ? currentAnalysisData.map((item, index) => (
                          <TableRow key={index}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-left font-mono">
                                  {analysisType === 'mostProfitable' 
                                      ? `${item.profit.toLocaleString('ar-IQ')} د.ع` 
                                      : item.quantity}
                              </TableCell>
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

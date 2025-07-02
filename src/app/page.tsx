
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
import { inventory as fallbackInventory, sales as fallbackSales, purchaseOrders as fallbackPurchaseOrders, supplierReturns as fallbackReturns } from "@/lib/data";
import type { Medication, Sale, PurchaseOrder, Return } from "@/lib/types";
import { DollarSign, Package, Clock, TrendingDown, Landmark } from "lucide-react";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { differenceInDays, parseISO } from 'date-fns';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [inventory, setInventory] = useLocalStorage<Medication[]>('inventory', fallbackInventory);
  const [sales, setSales] = useLocalStorage<Sale[]>('sales', fallbackSales);
  const [purchaseOrders, setPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', fallbackPurchaseOrders);
  const [supplierReturns, setSupplierReturns] = useLocalStorage<Return[]>('supplierReturns', fallbackReturns);
  const [isClient, setIsClient] = React.useState(false);

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

  const expiringSoonItems = inventory.filter(item => {
    if (!item.expirationDate) return false;
    const daysLeft = differenceInDays(parseISO(item.expirationDate), new Date());
    return daysLeft > 0 && daysLeft <= 90;
  }).sort((a,b) => differenceInDays(parseISO(a.expirationDate), new Date()) - differenceInDays(parseISO(b.expirationDate), new Date()));

  const salesDataForChart = sales.map(sale => ({
    date: new Date(sale.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
    total: sale.total,
  })).slice(-10);

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
        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3 h-[380px]"><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-full w-full" /></CardContent></Card>
            <Card className="lg:col-span-2"><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
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
              ${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
              ${totalDebt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
              ستنتهي صلاحيتها خلال 90 يومًا
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
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
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} orientation="right" />
                         <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>المبيعات الأخيرة</CardTitle>
            <CardDescription>أحدث 5 معاملات بيع.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>معرف البيع</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="text-left">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.slice(0, 5).map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.id}</TableCell>
                    <TableCell>{new Date(sale.date).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell className="text-left">${sale.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 md:grid-cols-2">
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
                                  <TableCell colSpan={3} className="text-center">لا توجد أصناف منخفضة المخزون.</TableCell>
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
                      <CardDescription>ستنتهي صلاحية هذه الأصناف خلال 90 يومًا.</CardDescription>
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
                                  <TableCell colSpan={3} className="text-center">لا توجد أصناف قريبة الانتهاء.</TableCell>
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

    

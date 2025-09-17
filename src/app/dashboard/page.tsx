
"use client"
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Package, AlertTriangle, Users, Boxes, ShoppingCart, BarChart, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { subDays, differenceInDays, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AdCarousel from '@/components/ui/ad-carousel';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"


const DateRangeSelect = ({ value, onValueChange }: { value: string, onValueChange: (value: string) => void }) => (
    <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px]">
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="7">آخر 7 أيام</SelectItem>
            <SelectItem value="30">آخر 30 يوم</SelectItem>
            <SelectItem value="90">آخر 90 يوم</SelectItem>
        </SelectContent>
    </Select>
);


export default function DashboardPage() {
    const { scopedData, users } = useAuth();
    const { sales: [sales], inventory: [inventory] } = scopedData;
    const [loading, setLoading] = React.useState(true);
    const [statsDateRange, setStatsDateRange] = React.useState("30");
    const [staleItemsDateRange, setStaleItemsDateRange] = React.useState("30");


    React.useEffect(() => {
        if (sales && inventory) {
            setLoading(false);
        }
    }, [sales, inventory]);

    const filteredSales = React.useMemo(() => {
        const days = parseInt(statsDateRange);
        const cutoffDate = subDays(new Date(), days);
        return sales.filter(sale => new Date(sale.date) >= cutoffDate);
    }, [sales, statsDateRange]);

    const totalRevenue = filteredSales.reduce((acc, sale) => acc + (Number(sale.total) || 0), 0);
    const totalProfit = filteredSales.reduce((acc, sale) => acc + (Number(sale.profit) || 0) - (Number(sale.discount) || 0), 0);
    
    const salesByDay = React.useMemo(() => {
        const days = parseInt(statsDateRange);
        const salesMap = new Map<string, number>();
        for (let i = 0; i < days; i++) {
            const date = subDays(new Date(), i);
            const dateString = date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
            salesMap.set(dateString, 0);
        }
        filteredSales.forEach(sale => {
            const dateString = new Date(sale.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
            if (salesMap.has(dateString)) {
                salesMap.set(dateString, (salesMap.get(dateString) || 0) + sale.total);
            }
        });
        
        return Array.from(salesMap.entries()).map(([date, total]) => ({ date, total })).reverse();
    }, [filteredSales, statsDateRange]);


    const totalCustomers = filteredSales.length;

    const topSellingItems = React.useMemo(() => {
        const itemMap = new Map<string, { name: string, quantity: number, profit: number }>();
        filteredSales.forEach(sale => {
            sale.items.forEach(item => {
                if (!item.is_return) {
                    const existing = itemMap.get(item.medication_id) || { name: item.name, quantity: 0, profit: 0 };
                    existing.quantity += item.quantity;
                    existing.profit += (item.price - item.purchase_price) * item.quantity;
                    itemMap.set(item.medication_id, existing);
                }
            });
        });
        return Array.from(itemMap.values());
    }, [filteredSales]);
    
    const topByQuantity = [...topSellingItems].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    const topByProfit = [...topSellingItems].sort((a, b) => b.profit - a.profit).slice(0, 5);

    const expiringSoonCount = inventory.filter(item => {
        if (!item.expiration_date) return false;
        const daysLeft = differenceInDays(parseISO(item.expiration_date), new Date());
        return daysLeft > 0 && daysLeft <= (scopedData.settings[0].expirationThresholdDays || 90);
    }).length;

    const inventoryValue = inventory.reduce((acc, item) => acc + (item.purchase_price * item.stock), 0);
    const expiringSoonValue = inventory.filter(item => {
        if (!item.expiration_date) return false;
        const daysLeft = differenceInDays(parseISO(item.expiration_date), new Date());
        return daysLeft > 0 && daysLeft <= (scopedData.settings[0].expirationThresholdDays || 90);
    }).reduce((acc, item) => acc + (item.purchase_price * item.stock), 0);
    
    const expiringSoonPercentage = inventoryValue > 0 ? (expiringSoonValue / inventoryValue) * 100 : 0;
    
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    const dailyCustomers = sales.filter(sale => isSameDay(new Date(sale.date), new Date())).length;

    const staleItems = React.useMemo(() => {
        const soldItemIds = new Set(sales
            .filter(s => new Date(s.date) >= subDays(new Date(), parseInt(staleItemsDateRange)))
            .flatMap(s => s.items.map(i => i.medication_id))
        );
        return inventory
            .filter(item => !soldItemIds.has(item.id) && item.stock > 0)
            .sort((a, b) => (b.purchase_price * b.stock) - (a.purchase_price * a.stock))
            .slice(0, 10);
    }, [inventory, sales, staleItemsDateRange]);


    if (loading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                 <div className="grid gap-6 lg:grid-cols-3">
                    <Skeleton className="h-96 w-full lg:col-span-2" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-2xl font-bold">لوحة التحكم</h1>
                    <p className="text-muted-foreground">نظرة عامة على أداء الصيدلية.</p>
                </div>
                <div className="flex items-center gap-4">
                    <DateRangeSelect value={statsDateRange} onValueChange={setStatsDateRange} />
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">خلال آخر {statsDateRange} يوم</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-green-600">{totalProfit.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">بعد خصم الخصومات</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الزبائن</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{totalCustomers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">عدد الفواتير في الفترة المحددة</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">قريب الانتهاء</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{expiringSoonCount}</div>
                        <p className="text-xs text-muted-foreground">صنف على وشك الانتهاء</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">زبائن اليوم</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{dailyCustomers}</div>
                        <p className="text-xs text-muted-foreground">فاتورة تم إنشاؤها اليوم</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الأصناف</CardTitle>
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{inventory.length}</div>
                        <p className="text-xs text-muted-foreground">إجمالي عدد الأصناف في المخزون</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>أداء المبيعات</CardTitle>
                        <CardDescription>عرض بياني للمبيعات اليومية خلال الفترة المحددة.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={{}} className="h-72 w-full">
                            <RechartsBarChart data={salesByDay} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis tickFormatter={(value) => `${value / 1000}k`} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="total" fill="var(--color-primary)" radius={4} />
                            </RechartsBarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Tabs defaultValue="profit" className="w-full">
                    <Card>
                        <CardHeader>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="profit">الأكثر ربحًا</TabsTrigger>
                                <TabsTrigger value="quantity">الأكثر مبيعًا</TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        <TabsContent value="profit">
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>الدواء</TableHead><TableHead className="text-left">الربح</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {topByProfit.map(item => (
                                            <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell className="text-left font-mono">{item.profit.toLocaleString()}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </TabsContent>
                        <TabsContent value="quantity">
                            <CardContent>
                                 <Table>
                                    <TableHeader><TableRow><TableHead>الدواء</TableHead><TableHead className="text-left">الكمية</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {topByQuantity.map(item => (
                                            <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell className="text-left font-mono">{item.quantity}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </TabsContent>
                    </Card>
                </Tabs>
            </div>
            
             <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>الأصناف الراكدة</CardTitle>
                            <DateRangeSelect value={staleItemsDateRange} onValueChange={setStaleItemsDateRange} />
                        </div>
                        <CardDescription>
                            قائمة بالأدوية التي لم يتم بيعها خلال آخر {staleItemsDateRange} يوم.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader><TableRow><TableHead>الدواء</TableHead><TableHead className="text-left">الرصيد</TableHead><TableHead className="text-left">قيمة المخزون</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {staleItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell className="text-left font-mono">{item.stock}</TableCell>
                                        <TableCell className="text-left font-mono text-destructive">{(item.stock * item.purchase_price).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <div className="space-y-4">
                     <AdCarousel page="dashboard" />
                    <Card className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
                        <CardHeader>
                            <CardTitle>أدوات سريعة</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <Button variant="secondary" asChild><Link href="/sales"><ShoppingCart className="me-2"/> فاتورة جديدة</Link></Button>
                            <Button variant="secondary" asChild><Link href="/purchases"><Boxes className="me-2"/> استلام بضاعة</Link></Button>
                            <Button variant="secondary" asChild><Link href="/reports"><FileText className="me-2"/> مراجعة الفواتير</Link></Button>
                            <Button variant="secondary" asChild><Link href="/inventory"><BarChart className="me-2"/> عرض المخزون</Link></Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

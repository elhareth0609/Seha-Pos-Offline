
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Medication, Sale, AppSettings, Task } from "@/lib/types";
import { DollarSign, Clock, TrendingDown, TrendingUp, PieChart, AlertTriangle, Coins, ListChecks, ShoppingBasket, Package, Users, Warehouse, BrainCircuit, Sparkles, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { differenceInDays, parseISO, startOfToday, startOfWeek, startOfMonth, isWithinInterval, isToday, endOfMonth, endOfWeek, subMonths, startOfYear, endOfYear, addMonths } from 'date-fns';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AdCarousel from "@/components/ui/ad-carousel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

function ExpirationSuggestions() {
    const { scopedData, postExchangeItem } = useAuth();
    const { inventory: [inventory], sales: [sales], settings: [settings] } = scopedData;
    const { toast } = useToast();

    const [suggestions, setSuggestions] = React.useState<any[]>([]);
    const [offeredItems, setOfferedItems] = React.useState<Record<string, { quantity: string; price: string; }>>({});

    
    React.useEffect(() => {
        const analysisPeriodDays = 90;
        const cutoffDate = subMonths(new Date(), 3);

        const salesInPeriod = sales.filter(s => new Date(s.date) >= cutoffDate);
        const salesStats: { [medId: string]: number } = {};
        salesInPeriod.forEach(sale => {
            sale.items.forEach(item => {
                if (!item.is_return) {
                    salesStats[item.medication_id] = (salesStats[item.medication_id] || 0) + item.quantity;
                }
            });
        });

        const expiringSoon = inventory.filter(item => {
            if (!item.expiration_date) return false;
            const expDate = parseISO(item.expiration_date);
            const daysLeft = differenceInDays(expDate, startOfToday());
            return daysLeft >= 0 && daysLeft <= (settings.expirationThresholdDays || 180);
        });

        const newSuggestions = expiringSoon.map(med => {
            const monthlySales = (salesStats[med.id] || 0) / (analysisPeriodDays / 30);
            const monthsTillExpiry = differenceInDays(parseISO(med.expiration_date), startOfToday()) / 30;
            const projectedSales = Math.ceil(monthlySales * monthsTillExpiry);
            const surplus = med.stock - projectedSales;

            if (surplus > 0) {
                return {
                    med,
                    reason: `مخزون عالٍ (${med.stock}) مقارنة بالمبيعات (${monthlySales.toFixed(1)}/شهر)`,
                    surplus: Math.floor(surplus)
                };
            }
            return null;
        }).filter(s => s !== null && s.surplus > 0);

        setSuggestions(newSuggestions);
        
        // Initialize offeredItems with default values
        const initialOfferedItems: Record<string, { quantity: string; price: string; }> = {};
        newSuggestions.forEach((suggestion) => {
            if (suggestion) {
                const { med, surplus } = suggestion;
                initialOfferedItems[med.id] = {
                    quantity: String(surplus),
                    price: String(med.purchase_price)
                };
            }
        });
        setOfferedItems(initialOfferedItems);
    }, [inventory, sales, settings.expirationThresholdDays]); 


    const handleOfferChange = (medId: string, field: 'quantity' | 'price', value: string) => {
        setOfferedItems(prev => ({
            ...prev,
            [medId]: {
                ...prev[medId],
                [field]: value
            }
        }));
    };

    const handlePostOffer = async (med: Medication, surplus: number) => {
        console.log("Medication:", med);
        console.log("OfferedItems:", offeredItems);
        
        // Get values with proper fallbacks
        const offerData = offeredItems[med.id] || {};
        const quantityStr = offerData.quantity || String(surplus);
        const priceStr = offerData.price || String(med.purchase_price);
        
        console.log("Quantity string:", quantityStr, "Price string:", priceStr);
        
        // Parse with better error handling
        const quantity = parseInt(quantityStr, 10);
        const price = parseFloat(priceStr);
        
        console.log("Parsed quantity:", quantity, "Parsed price:", price); 
        // Validate quantity
        if (isNaN(quantity) || quantity <= 0 || quantity > surplus) {
            toast({ variant: 'destructive', title: "كمية غير صالحة", description: "الرجاء إدخال كمية صالحة وأكبر من صفر ولا تتجاوز الكمية المتاحة" });
            return;
        }
        
        // Validate price
        if (isNaN(price) || price <= 0) {
            toast({ variant: 'destructive', title: "سعر غير صالح", description: "الرجاء إدخال سعر صالح وأكبر من صفر" });
            return;
        }

        const newOfferData = {
            medicationName: med.name,
            scientificName: med.scientific_names?.join(', '),
            quantity: quantity,
            expirationDate: med.expiration_date,
            price: price,
            contactPhone: settings.pharmacyPhone || '',
            province: 'بغداد' // This should be dynamic later
        };

        const createdOffer = await postExchangeItem(newOfferData);
        if (createdOffer) {
            toast({ title: `تم عرض ${med.name} بنجاح!` });
            setSuggestions(prev => prev.filter(s => s.med.id !== med.id));
        }
    };


    if (suggestions.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> اقتراحات لتجنب الإكسباير</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                    <p>لا توجد اقتراحات حاليًا. مخزونك في حالة ممتازة!</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> اقتراحات لتجنب الإكسباير</CardTitle>
                <CardDescription>
                    يقترح النظام الأصناف المعرضة لخطر انتهاء الصلاحية بناءً على مبيعاتك. يمكنك عرضها للتبادل مباشرة من هنا.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72">
                    <div className="space-y-4">
                        {suggestions.map(({ med, reason, surplus }) => (
                            <div key={med.id} className="p-3 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div className="flex-1">
                                    <p className="font-semibold">{med.name}</p>
                                    <p className="text-xs text-muted-foreground">{reason}</p>
                                    <p className="text-sm font-medium text-destructive">
                                        الكمية المعرضة للخطر: <span className="font-mono">{surplus}</span>
                                    </p>
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor={`quantity-${med.id}`} className="text-xs">الكمية للعرض</Label>
                                        <Input
                                            id={`quantity-${med.id}`}
                                            type="number"
                                            placeholder="الكمية"
                                            defaultValue={surplus}
                                            onChange={e => handleOfferChange(med.id, 'quantity', e.target.value)}
                                            className="w-24 h-9"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`price-${med.id}`} className="text-xs">السعر</Label>
                                        <Input
                                            id={`price-${med.id}`}
                                            type="number"
                                            placeholder="السعر"
                                            defaultValue={med.purchase_price}
                                            onChange={e => handleOfferChange(med.id, 'price', e.target.value)}
                                            className="w-24 h-9"
                                        />
                                    </div>
                                    <Button size="sm" onClick={() => handlePostOffer(med, surplus)}>اعرض الآن</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

export default function Dashboard() {
  const { currentUser, scopedData, updateTask, updateStatusTask, addToOrderRequestCart } = useAuth();
  const [inventory] = scopedData.inventory;
  const [sales] = scopedData.sales;
  const [settings] = scopedData.settings;
  const [expenses] = scopedData.expenses;
  const [tasks, setTasks] = React.useState<Task[]>([]);

  const [isClient, setIsClient] = React.useState(false);
  const [dateFrom, setDateFrom] = React.useState<string>(startOfMonth(new Date()).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = React.useState<string>(endOfMonth(new Date()).toISOString().split('T')[0]);
  const [leastSoldDays, setLeastSoldDays] = React.useState(30);


  React.useEffect(() => {
    setIsClient(true);
    if (scopedData.tasks) {
      setTasks(scopedData.tasks[0]);
    }
  }, [scopedData.tasks]);
  
  const handleTaskStatusChange = async (taskId: string, completed: boolean) => {
    const success = await updateStatusTask(taskId, { completed });
    if(success) {
       setTasks(prevTasks => prevTasks.map(task => 
           task.id === taskId ? { ...task, completed } : task
       ));
    }
  };
  
  const userTasks = React.useMemo(() => {
    if (!currentUser || !tasks) return [];
    return tasks.filter(task => task.user_id === currentUser.id && !task.completed);
  }, [currentUser, tasks]);


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

  const lowStockItems = inventory.filter(
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
  
  const topPerformingMedications = React.useMemo(() => {
    const stats: { [medId: string]: { name: string; quantity: number, profit: number } } = {};

    sales.forEach(sale => {
        (sale.items || []).forEach(item => {
            if (item.is_return) return; 

            if (!stats[item.medication_id]) {
                const med = inventory.find(i => i.id === item.medication_id);
                stats[item.medication_id] = {
                    name: med?.name || item.name,
                    quantity: 0,
                    profit: 0,
                };
            }
            stats[item.medication_id].quantity += item.quantity;
            stats[item.medication_id].profit += (item.price - item.purchase_price) * item.quantity;
        });
    });

    const allMeds = Object.entries(stats).map(([medication_id, data]) => ({
      medication_id,
      name: data.name,
      quantity: data.quantity,
      profit: data.profit,
    }));
    
    const topByQuantity = [...allMeds].sort((a,b) => b.quantity - a.quantity).slice(0,10);
    const topByProfit = [...allMeds].sort((a,b) => b.profit - a.profit).slice(0,10);

    return { topByQuantity, topByProfit };
  }, [sales, inventory]);

  const leastSellingMedications = React.useMemo(() => {
    if (leastSoldDays <= 0) return [];
    
    const cutoffDate = subMonths(new Date(), leastSoldDays / 30);
    const recentSoldIds = new Set();
    
    sales.forEach(sale => {
        if(new Date(sale.date) > cutoffDate) {
            (sale.items || []).forEach(item => {
                if(!item.is_return) recentSoldIds.add(item.medication_id);
            });
        }
    });

    return inventory.filter(med => !recentSoldIds.has(med.id) && med.stock > 0).slice(0,10);

  }, [sales, inventory, leastSoldDays]);

  const dashboardStats = React.useMemo(() => {
    if (!isClient) return { totalRevenue: 0, totalProfit: 0, profitMargin: 0, invoiceCount: 0, totalExpenses: 0, dailyCustomers: 0, expiringRatio: 0, totalProducts: 0, totalInventoryValue: 0 };
    
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (to) to.setHours(23, 59, 59, 999);

    const interval = from && to ? { start: from, end: to } : null;

    const filteredSales = interval ? sales.filter(sale => isWithinInterval(parseISO(sale.date), interval)) : sales;
    const filteredExpenses = interval ? expenses.filter(expense => isWithinInterval(parseISO(expense.created_at), interval)) : expenses;

    const currentTotalRevenue = filteredSales.reduce((acc, sale) => {
      const total = typeof sale.total === 'number' ? sale.total : parseFloat(String(sale.total || 0));
      return acc + (isNaN(total) ? 0 : total);
    }, 0);
    
    const currentTotalProfit = filteredSales.reduce((acc, sale) => {
      const profit = typeof sale.profit === 'number' ? sale.profit : parseFloat(String(sale.profit || 0));
      const discount = typeof sale.discount === 'number' ? sale.discount : parseFloat(String(sale.discount || 0));
      return acc + ((isNaN(profit) ? 0 : profit) - (isNaN(discount) ? 0 : discount));
    }, 0);
    
    const totalExpensesAmount = filteredExpenses.reduce((acc, expense) => {
      const amount = typeof expense.amount === 'number' ? expense.amount : parseFloat(String(expense.amount || 0));
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0);

    const netProfit = currentTotalProfit - totalExpensesAmount;
    const currentProfitMargin = currentTotalRevenue > 0 ? (netProfit / currentTotalRevenue) * 100 : 0;
    const invoiceCount = filteredSales.length;

    const dailyCustomers = sales.filter(sale => isToday(parseISO(sale.date))).length;

    const totalInventoryValue = inventory.reduce((acc, item) => acc + (item.purchase_price * item.stock), 0);
    const expiringSoonValue = expiringSoonItems.reduce((acc, item) => acc + (item.purchase_price * item.stock), 0);
    const expiringRatio = totalInventoryValue > 0 ? (expiringSoonValue / totalInventoryValue) * 100 : 0;

    const totalProducts = inventory.length;

    return { totalRevenue: currentTotalRevenue, totalProfit: netProfit, profitMargin: currentProfitMargin, invoiceCount, totalExpenses: totalExpensesAmount, dailyCustomers, expiringRatio, totalProducts, totalInventoryValue };
  }, [sales, expenses, inventory, expiringSoonItems, dateFrom, dateTo, isClient]);


  if (!isClient) {
    return (
      <div className="flex flex-col gap-6">
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
                          {dashboardStats.totalRevenue.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">من {dashboardStats.invoiceCount} فاتورة</p>
                </div>
                <div className="flex flex-col gap-1.5 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">إجمالي الصرفيات</span>
                        <Coins className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="text-3xl font-bold text-destructive font-mono">
                        {dashboardStats.totalExpenses.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">مجموع النفقات المسجلة</p>
                </div>
                <div className="flex flex-col gap-1.5 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">صافي الربح</span>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-green-600 font-mono">
                        {dashboardStats.totalProfit.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">الربح بعد طرح الخصومات والصرفيات</p>
                </div>
            </CardContent>
             <CardContent className="grid gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1.5 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">هامش الربح</span>
                        <PieChart className="h-5 w-5" />
                    </div>
                    <div className="text-3xl font-bold font-mono">
                        {dashboardStats.profitMargin.toFixed(1)}%
                    </div>
                </div>
                <div className="flex flex-col gap-1.5 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">زبائن اليوم</span>
                        <Users className="h-5 w-5" />
                    </div>
                    <div className="text-3xl font-bold font-mono">
                        {dashboardStats.dailyCustomers}
                    </div>
                </div>
                <div className="flex flex-col gap-1.5 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">عدد الأصناف</span>
                        <Package className="h-5 w-5" />
                    </div>
                    <div className="text-3xl font-bold font-mono">
                        {dashboardStats.totalProducts.toLocaleString()}
                    </div>
                </div>
                 <div className="flex flex-col gap-1.5 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">قيمة المخزون الإجمالية</span>
                        <Warehouse className="h-5 w-5" />
                    </div>
                    <div className="text-3xl font-bold font-mono">
                        {dashboardStats.totalInventoryValue.toLocaleString()}
                    </div>
                </div>
                 <div className="flex flex-col gap-1.5 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">نسبة المخزون قريب الانتهاء</span>
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="text-3xl font-bold font-mono text-yellow-600">
                        {dashboardStats.expiringRatio.toFixed(1)}%
                    </div>
                </div>
            </CardContent>
        </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ExpirationSuggestions />
      </div>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-1">
              <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>تحتاج إعادة طلب</CardTitle>
                  <Link href="/inventory">
                      <Button variant="outline">عرض المخزون</Button>
                  </Link>
              </CardHeader>
              <CardContent className="text-right">
                   <ScrollArea className="h-72">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>الاسم</TableHead>
                                  <TableHead>المخزون</TableHead>
                                  <TableHead className="text-left">طلب</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {lowStockItems.length > 0 ? lowStockItems.map(item => (
                                  <TableRow key={item.id} className="text-right">
                                      <TableCell className="font-medium">{item.name}</TableCell>
                                      <TableCell>
                                        <Badge variant="destructive" className="font-mono">{item.stock}</Badge>
                                      </TableCell>
                                      <TableCell className="text-left">
                                        <Button variant="ghost" size="icon" onClick={() => addToOrderRequestCart(item)} className="hover:text-blue-600 group">
                                            <ShoppingBasket className="h-5 w-5 text-blue-600 group-hover:text-white"/>
                                        </Button>
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
          <Card className="lg:col-span-1">
              <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>قريب الانتهاء ومنتهي</CardTitle>
                  <Link href="/expiring-soon">
                      <Button variant="outline">عرض الكل</Button>
                  </Link>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-72">
                    <Table className="text-right">
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-1/2 text-right">الاسم</TableHead>
                              <TableHead className="w-1/2 text-right">الحالة</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {expiredItems.length > 0 && expiredItems.map(item => (
                              <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.name}</TableCell>
                                  <TableCell >
                                    <Badge variant="destructive">منتهي الصلاحية</Badge>
                                  </TableCell>
                              </TableRow>
                          ))}
                          {expiringSoonItems.length > 0 && expiringSoonItems.map(item => (
                              <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 font-mono text-sm">{differenceInDays(parseISO(item.expiration_date), new Date())} يوم</Badge>
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
            <Card className="lg:col-span-1">
                <Tabs defaultValue="top-selling">
                    <CardHeader>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="top-selling">الأكثر مبيعًا</TabsTrigger>
                            <TabsTrigger value="most-profitable">الأكثر ربحًا</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-72">
                            <TabsContent value="top-selling">
                                <Table>
                                    <TableBody>
                                        {topPerformingMedications.topByQuantity.length > 0 ? topPerformingMedications.topByQuantity.map((item) => (
                                            <TableRow key={item.medication_id}>
                                                <TableCell className="font-semibold">{item.name}</TableCell>
                                                <TableCell className="text-left">
                                                    <Button variant="ghost" size="icon" onClick={() => addToOrderRequestCart(item as unknown as Medication)} className="hover:text-blue-600 group">
                                                        <ShoppingBasket className="h-5 w-5 text-blue-600 group-hover:text-white"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (<TableRow><TableCell colSpan={2} className="text-center h-24 text-muted-foreground">لا توجد بيانات.</TableCell></TableRow>)}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                            <TabsContent value="most-profitable">
                                    <Table>
                                    <TableBody>
                                        {topPerformingMedications.topByProfit.length > 0 ? topPerformingMedications.topByProfit.map((item) => (
                                            <TableRow key={item.medication_id}>
                                                <TableCell className="font-semibold">{item.name}</TableCell>
                                                <TableCell className="text-left">
                                                    <Button variant="ghost" size="icon" onClick={() => addToOrderRequestCart(item as unknown as Medication)} className="hover:text-blue-600 group">
                                                        <ShoppingBasket className="h-5 w-5 text-blue-600 group-hover:text-white"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (<TableRow><TableCell colSpan={2} className="text-center h-24 text-muted-foreground">لا توجد بيانات.</TableCell></TableRow>)}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                        </ScrollArea>
                    </CardContent>
                </Tabs>
            </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>الأدوية الأقل مبيعًا (الراكدة)</CardTitle>
                <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                    <Label htmlFor="stagnant-days" className="shrink-0">عرض الأصناف التي لم يتم بيعها منذ</Label>
                    <Input id="stagnant-days" type="number" value={leastSoldDays} onChange={(e) => setLeastSoldDays(Number(e.target.value))} className="w-20 h-8" />
                    <span>يوم</span>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72">
                    {leastSellingMedications.length > 0 ? (
                        <div className="space-y-2">
                            {leastSellingMedications.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted">
                                    <div>
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.scientific_names?.join(', ')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-semibold">{item.stock}</span>
                                        <span className="text-muted-foreground">الرصيد</span>
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-24 text-muted-foreground">
                            <p>لا توجد أصناف راكدة لهذه الفترة.</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

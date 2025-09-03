
"use client";

import * as React from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AppSettings, Sale, User, PurchaseOrder } from '@/lib/types';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isWithinInterval, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type PharmacyPerformance = {
    pharmacy_id: string;
    pharmacy_name: string;
    province: string;
    total_sales: number;
    total_profit: number;
    employee_count: number;
}

type TopSellingMedication = {
    name: string;
    quantity: number;
}

type TopPurchasingPharmacy = {
    pharmacy_id: string;
    name: string;
    count: number;
};

type TopPurchasedItem = {
    name: string;
    quantity: number;
};

// Helper function to download data as CSV
const downloadAsCSV = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${filename}.csv`);
};

export default function SuperAdminReportsPage() {
    const { currentUser, getPharmacyData, getAllPharmacySettings, users } = useAuth();
    const router = useRouter();
    
    const [allPharmacySettings, setAllPharmacySettings] = React.useState<Record<string, AppSettings>>({});
    const [allPharmacySales, setAllPharmacySales] = React.useState<Record<string, Sale[]>>({});
    const [allPharmacyPurchases, setAllPharmacyPurchases] = React.useState<Record<string, PurchaseOrder[]>>({});
    const [loading, setLoading] = React.useState(true);

    // State for filters
    const [performanceDateFrom, setPerformanceDateFrom] = React.useState<string>("");
    const [performanceDateTo, setPerformanceDateTo] = React.useState<string>("");
    
    const [topSellingDateFrom, setTopSellingDateFrom] = React.useState<string>("");
    const [topSellingDateTo, setTopSellingDateTo] = React.useState<string>("");
    
    const [topPurchasePharmaDateFrom, setTopPurchasePharmaDateFrom] = React.useState<string>("");
    const [topPurchasePharmaDateTo, setTopPurchasePharmaDateTo] = React.useState<string>("");
    
    const [topPurchaseItemsDateFrom, setTopPurchaseItemsDateFrom] = React.useState<string>("");
    const [topPurchaseItemsDateTo, setTopPurchaseItemsDateTo] = React.useState<string>("");

    React.useEffect(() => {
        if (currentUser && currentUser.role !== 'SuperAdmin') {
            router.push('/');
        }
    }, [currentUser, router]);

    React.useEffect(() => {
        const fetchAllData = async () => {
            if (currentUser?.role !== 'SuperAdmin') return;
            setLoading(true);
            try {
                const settings = await getAllPharmacySettings();
                setAllPharmacySettings(settings || {});

                if(settings && Object.keys(settings).length > 0) {
                    const dataPromises = Object.keys(settings).map(id => 
                        getPharmacyData(id).then(data => ({ 
                            id, 
                            sales: data.sales || [], 
                            purchaseOrders: data.purchaseOrders || [] 
                        }))
                    );
                    const results = await Promise.all(dataPromises);

                    const salesMap: Record<string, Sale[]> = {};
                    const purchasesMap: Record<string, PurchaseOrder[]> = {};
                    results.forEach(result => {
                        salesMap[result.id] = result.sales;
                        purchasesMap[result.id] = result.purchaseOrders;
                    });
                    setAllPharmacySales(salesMap);
                    setAllPharmacyPurchases(purchasesMap);
                } else {
                    setAllPharmacySales({});
                    setAllPharmacyPurchases({});
                }
            } catch (error) {
                console.error("Failed to fetch all pharmacy data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [currentUser, getAllPharmacySettings, getPharmacyData]);
    
    const filterByDateRange = <T extends { date: string }>(items: T[], from: string, to: string): T[] => {
        if (!from && !to) return items || [];
        const dateInterval = {
            start: from ? parseISO(from) : new Date(0),
            end: to ? parseISO(to) : new Date(),
        };
        if (dateInterval.end) dateInterval.end.setHours(23,59,59,999);

        return (items || []).filter(item => {
            try {
                return isWithinInterval(parseISO(item.date), dateInterval);
            } catch {
                return false;
            }
        });
    };

    const performanceData = React.useMemo<PharmacyPerformance[]>(() => {
        return Object.keys(allPharmacySettings).map(pharmacyId => {
            const settings = allPharmacySettings[pharmacyId];
            const sales = filterByDateRange(allPharmacySales[pharmacyId] || [], performanceDateFrom, performanceDateTo);
            // const total_sales = sales.reduce((acc, sale) => acc + (sale.total || 0), 0);
            const total_sales= sales.reduce((acc, sale) => {
                const total = typeof sale.total === 'number' ? sale.total : parseFloat(String(sale.total || 0));
                return acc + (isNaN(total) ? 0 : total);
            }, 0);

            const total_profit = sales.reduce((acc, sale) => {
                const profit = typeof sale.profit === 'number' ? sale.profit : parseFloat(String(sale.profit || 0));
                const discount = typeof sale.discount === 'number' ? sale.discount : parseFloat(String(sale.discount || 0));
                const netProfit = profit - discount;
                return acc + (isNaN(netProfit) ? 0 : netProfit);
            }, 0);
            const pharmacyUsers = users.filter(u => String(u.pharmacy_id) === pharmacyId && u.role !== 'SuperAdmin');
            const pharmacyAdmin = pharmacyUsers.find(u => u.role === 'Admin');

            return {
                pharmacy_id: pharmacyId,
                pharmacy_name: settings.pharmacyName || `صيدلية #${pharmacyId}`,
                province: pharmacyAdmin?.province || 'غير محدد',
                total_sales,
                total_profit,
                employee_count: pharmacyUsers.length,
            };
        }).sort((a,b) => b.total_sales - a.total_sales);
    }, [allPharmacySettings, allPharmacySales, users, performanceDateFrom, performanceDateTo]);

    const topSellingMedications = React.useMemo<TopSellingMedication[]>(() => {
        const medicationCounts: { [key: string]: { name: string, quantity: number } } = {};
        Object.values(allPharmacySales).flat().forEach(sale => {
            const filteredSaleItems = filterByDateRange([sale], topSellingDateFrom, topSellingDateTo).length > 0;
            if (filteredSaleItems) {
                sale.items?.forEach(item => {
                    if (!item.is_return) {
                        medicationCounts[item.medication_id] = medicationCounts[item.medication_id] || { name: item.name, quantity: 0 };
                        medicationCounts[item.medication_id].quantity += item.quantity;
                    }
                });
            }
        });
        return Object.values(medicationCounts).sort((a, b) => b.quantity - a.quantity).slice(0, 30);
    }, [allPharmacySales, topSellingDateFrom, topSellingDateTo]);
    
    const topPurchasingPharmacies = React.useMemo<TopPurchasingPharmacy[]>(() => {
         const pharmacyPurchaseCounts: { [key: string]: number } = {};
         Object.keys(allPharmacyPurchases).forEach(pharmacyId => {
             const purchases = filterByDateRange(allPharmacyPurchases[pharmacyId] || [], topPurchasePharmaDateFrom, topPurchasePharmaDateTo);
             pharmacyPurchaseCounts[pharmacyId] = purchases.length;
         });
         return Object.entries(pharmacyPurchaseCounts)
            .map(([pharmacy_id, count]) => ({
                pharmacy_id,
                name: allPharmacySettings[pharmacy_id]?.pharmacyName || `صيدلية #${pharmacy_id}`,
                count
            }))
            .sort((a,b) => b.count - a.count);
    }, [allPharmacyPurchases, allPharmacySettings, topPurchasePharmaDateFrom, topPurchasePharmaDateTo]);

    const topPurchasedItems = React.useMemo<TopPurchasedItem[]>(() => {
        const topPurchasedItemsMap: Record<string, {name: string, quantity: number}> = {};
        Object.values(allPharmacyPurchases).flat().forEach(po => {
            const isInDateRange = filterByDateRange([po], topPurchaseItemsDateFrom, topPurchaseItemsDateTo).length > 0;
            if(isInDateRange) {
                po.items?.forEach(item => {
                    if(item.medication_id){
                        topPurchasedItemsMap[item.medication_id] = topPurchasedItemsMap[item.medication_id] || { name: item.name, quantity: 0 };
                        topPurchasedItemsMap[item.medication_id].quantity += item.quantity;
                    }
                });
            }
        });
        return Object.values(topPurchasedItemsMap).sort((a,b) => b.quantity - a.quantity).slice(0,30);
    }, [allPharmacyPurchases, topPurchaseItemsDateFrom, topPurchaseItemsDateTo]);


    if (loading) {
        return (
             <div className="flex flex-col gap-6 p-4">
                <Skeleton className="h-20 w-full" />
                <div className="grid gap-6 lg:grid-cols-3">
                    <Skeleton className="h-96 w-full lg:col-span-2" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        )
    }

    if (!currentUser || currentUser.role !== 'SuperAdmin') {
        return null;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>الفواتير الإجمالية للشركة</CardTitle>
                            <CardDescription>نظرة شاملة على أداء جميع الصيدليات.</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/superadmin"><ArrowLeft className="me-2"/> العودة للوحة التحكم</Link>
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="performance" dir="rtl">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="performance">أداء الصيدليات</TabsTrigger>
                    <TabsTrigger value="topSelling">الأكثر مبيعًا</TabsTrigger>
                    <TabsTrigger value="topPurchasingPharma">الصيدليات الأكثر شراءً</TabsTrigger>
                    <TabsTrigger value="topPurchasingItems">الأصناف الأكثر شراءً</TabsTrigger>
                </TabsList>

                <TabsContent value="performance">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>تحليل مقارن لأداء الصيدليات</CardTitle>
                                <Button onClick={() => downloadAsCSV(performanceData.map(p => ({'اسم الصيدلية': p.pharmacy_name, 'المحافظة': p.province, 'اجمالي المبيعات': p.total_sales, 'صافي الربح': p.total_profit, 'عدد الموظفين': p.employee_count})), 'pharmacy_performance')}>
                                    <Download className="me-2"/> تنزيل CSV
                                </Button>
                            </div>
                            <div className="pt-4 flex gap-4 items-end">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="perf-date-from">من تاريخ</Label>
                                    <Input id="perf-date-from" type="date" value={performanceDateFrom} onChange={e => setPerformanceDateFrom(e.target.value)} />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="perf-date-to">إلى تاريخ</Label>
                                    <Input id="perf-date-to" type="date" value={performanceDateTo} onChange={e => setPerformanceDateTo(e.target.value)} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>اسم الصيدلية</TableHead>
                                        <TableHead>المحافظة</TableHead>
                                        <TableHead>إجمالي المبيعات</TableHead>
                                        <TableHead>صافي الربح</TableHead>
                                        <TableHead>عدد الموظفين</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {performanceData.length > 0 ? performanceData.map(p => (
                                        <TableRow key={p.pharmacy_id}>
                                            <TableCell className="font-medium">{p.pharmacy_name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{p.province}</Badge>
                                            </TableCell>
                                            <TableCell className="font-mono">{p.total_sales.toLocaleString()}</TableCell>
                                            <TableCell className="font-mono text-green-600">{p.total_profit.toLocaleString()}</TableCell>
                                            <TableCell className="font-mono text-center">{p.employee_count}</TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={5} className="text-center h-24">لا توجد بيانات</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="topSelling">
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>الأدوية الأكثر مبيعًا (كل الفروع)</CardTitle>
                                 <Button onClick={() => downloadAsCSV(topSellingMedications, 'top_selling_medications')}>
                                    <Download className="me-2"/> تنزيل CSV
                                </Button>
                            </div>
                            <div className="pt-4 flex gap-4 items-end">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="top-selling-date-from">من تاريخ</Label>
                                    <Input id="top-selling-date-from" type="date" value={topSellingDateFrom} onChange={e => setTopSellingDateFrom(e.target.value)} />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="top-selling-date-to">إلى تاريخ</Label>
                                    <Input id="top-selling-date-to" type="date" value={topSellingDateTo} onChange={e => setTopSellingDateTo(e.target.value)} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>الدواء</TableHead>
                                        <TableHead>الكمية المباعة</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topSellingMedications.length > 0 ? topSellingMedications.map((med, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{med.name}</TableCell>
                                            <TableCell className="font-mono">{med.quantity.toLocaleString()}</TableCell>
                                        </TableRow>
                                    )) : <TableRow>
                                            <TableCell colSpan={2} className="text-center h-24">لا توجد بيانات</TableCell>
                                        </TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="topPurchasingPharma">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>الصيدليات الأكثر شراءً</CardTitle>
                                <Button onClick={() => downloadAsCSV(topPurchasingPharmacies.map(p => ({'اسم الصيدلية': p.name, 'عدد قوائم الشراء': p.count})), 'top_purchasing_pharmacies')}>
                                    <Download className="me-2"/> تنزيل CSV
                                </Button>
                            </div>
                            <div className="pt-4 flex gap-4 items-end">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="top-pharma-date-from">من تاريخ</Label>
                                    <Input id="top-pharma-date-from" type="date" value={topPurchasePharmaDateFrom} onChange={e => setTopPurchasePharmaDateFrom(e.target.value)} />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="top-pharma-date-to">إلى تاريخ</Label>
                                    <Input id="top-pharma-date-to" type="date" value={topPurchasePharmaDateTo} onChange={e => setTopPurchasePharmaDateTo(e.target.value)} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>اسم الصيدلية</TableHead>
                                        <TableHead>عدد قوائم الشراء</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                <TableBody>
                                    {topPurchasingPharmacies.length > 0 ? topPurchasingPharmacies.map(p => (
                                        <TableRow key={p.pharmacy_id}>
                                            <TableCell className="font-medium">{p.name}</TableCell>
                                            <TableCell className="font-mono ">{p.count}</TableCell>
                                        </TableRow>
                                    )) : <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24">لا توجد بيانات</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="topPurchasingItems">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>الأصناف الأكثر شراءً (كل الفروع)</CardTitle>
                                <Button onClick={() => downloadAsCSV(topPurchasedItems, 'top_purchased_items')}>
                                    <Download className="me-2"/> تنزيل CSV
                                </Button>
                            </div>
                            <div className="pt-4 flex gap-4 items-end">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="top-items-date-from">من تاريخ</Label>
                                    <Input id="top-items-date-from" type="date" value={topPurchaseItemsDateFrom} onChange={e => setTopPurchaseItemsDateFrom(e.target.value)} />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="top-items-date-to">إلى تاريخ</Label>
                                    <Input id="top-items-date-to" type="date" value={topPurchaseItemsDateTo} onChange={e => setTopPurchaseItemsDateTo(e.target.value)} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>الدواء</TableHead>
                                        <TableHead>الكمية المشتراة</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topPurchasedItems.length > 0 ? topPurchasedItems.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="font-mono">{item.quantity.toLocaleString()}</TableCell>
                                        </TableRow>
                                    )) : <TableRow>
                                            <TableCell colSpan={2} className="text-center h-24">لا توجد بيانات</TableCell>
                                        </TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

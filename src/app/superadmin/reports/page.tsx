
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AppSettings, Sale, User, PurchaseOrder, PurchaseOrderItem } from '@/lib/types';
import { ArrowLeft, Building, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isWithinInterval, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

type PharmacyPerformance = {
    pharmacy_id: string;
    pharmacy_name: string;
    province: string;
    total_sales: number;
    total_profit: number;
    employee_count: number;
    purchase_order_count: number;
}

export default function SuperAdminReportsPage() {
    const { currentUser, getPharmacyData, getAllPharmacySettings, users } = useAuth();
    const router = useRouter();
    
    const [allPharmacySettings, setAllPharmacySettings] = React.useState<Record<string, AppSettings>>({});
    const [allPharmacySales, setAllPharmacySales] = React.useState<Record<string, Sale[]>>({});
    const [allPharmacyPurchases, setAllPharmacyPurchases] = React.useState<Record<string, PurchaseOrder[]>>({});
    const [loading, setLoading] = React.useState(true);
    const [dateFrom, setDateFrom] = React.useState<string>("");
    const [dateTo, setDateTo] = React.useState<string>("");

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
                setAllPharmacySettings(settings);

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

            } catch (error) {
                console.error("Failed to fetch all pharmacy data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [currentUser, getAllPharmacySettings, getPharmacyData]);
    
    const { performanceData, topSellingMedications, topPurchasingPharmacies, topPurchasedItems } = React.useMemo(() => {
        const dateInterval = dateFrom && dateTo ? { start: parseISO(dateFrom), end: parseISO(dateTo) } : null;

        const filterByDate = <T extends { date: string }>(items: T[]): T[] => {
            if (!dateInterval) return items;
            return items.filter(item => isWithinInterval(parseISO(item.date), dateInterval));
        };
        
        const medicationCounts: { [key: string]: { name: string, quantity: number } } = {};
        const pharmacyPurchaseCounts: { [key: string]: number } = {};
        const topPurchasedItemsMap: Record<string, {name: string, quantity: number}> = {};

        const perfData = Object.keys(allPharmacySettings).map(pharmacyId => {
            const settings = allPharmacySettings[pharmacyId];
            const sales = filterByDate(allPharmacySales[pharmacyId] || []);
            const purchases = filterByDate(allPharmacyPurchases[pharmacyId] || []);
            
            const total_sales = sales.reduce((acc, sale) => acc + (sale.total || 0), 0);
            const total_profit = sales.reduce((acc, sale) => acc + ((sale.profit || 0) - (sale.discount || 0)), 0);
            
            const pharmacyUsers = users.filter(u => String(u.pharmacy_id) === pharmacyId && u.role !== 'SuperAdmin');
            const pharmacyAdmin = pharmacyUsers.find(u => u.role === 'Admin');
            
            // For top selling medications
            sales.forEach(sale => sale.items?.forEach(item => {
                if (!item.is_return) {
                    medicationCounts[item.medication_id] = medicationCounts[item.medication_id] || { name: item.name, quantity: 0 };
                    medicationCounts[item.medication_id].quantity += item.quantity;
                }
            }));

            // For top purchasing pharmacies & items
            pharmacyPurchaseCounts[pharmacyId] = purchases.length;
            purchases.forEach(po => po.items?.forEach(item => {
                topPurchasedItemsMap[item.medication_id] = topPurchasedItemsMap[item.medication_id] || { name: item.name, quantity: 0 };
                topPurchasedItemsMap[item.medication_id].quantity += item.quantity;
            }));

            return {
                pharmacy_id: pharmacyId,
                pharmacy_name: settings.pharmacyName || `صيدلية #${pharmacyId}`,
                province: pharmacyAdmin?.province || 'غير محدد',
                total_sales,
                total_profit,
                employee_count: pharmacyUsers.length,
                purchase_order_count: purchases.length,
            };
        }).sort((a,b) => b.total_sales - a.total_sales);

        const topSellers = Object.values(medicationCounts).sort((a, b) => b.quantity - a.quantity).slice(0, 30);
        const topBuyers = Object.entries(pharmacyPurchaseCounts)
            .map(([pharmacy_id, count]) => ({
                pharmacy_id,
                name: allPharmacySettings[pharmacy_id]?.pharmacyName || `صيدلية #${pharmacy_id}`,
                count
            }))
            .sort((a,b) => b.count - a.count);
            
        const topItems = Object.values(topPurchasedItemsMap).sort((a,b) => b.quantity - a.quantity).slice(0,30);

        return {
            performanceData: perfData,
            topSellingMedications: topSellers,
            topPurchasingPharmacies: topBuyers,
            topPurchasedItems: topItems,
        };

    }, [allPharmacySettings, allPharmacySales, allPharmacyPurchases, users, dateFrom, dateTo]);


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
                            <CardTitle>التقارير الإجمالية للشركة</CardTitle>
                            <CardDescription>نظرة شاملة على أداء جميع الصيدليات.</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/superadmin"><ArrowLeft className="me-2"/> العودة للوحة التحكم</Link>
                        </Button>
                    </div>
                    <div className="pt-4 flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                           <Label htmlFor="date-from">من تاريخ</Label>
                           <Input id="date-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                       </div>
                       <div className="flex-1 space-y-2">
                           <Label htmlFor="date-to">إلى تاريخ</Label>
                           <Input id="date-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                       </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>تحليل مقارن لأداء الصيدليات</CardTitle>
                        <CardDescription>مقارنة بين الصيدليات بناءً على المؤشرات المالية الرئيسية.</CardDescription>
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
                                {performanceData.map(p => (
                                    <TableRow key={p.pharmacy_id}>
                                        <TableCell className="font-medium">{p.pharmacy_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{p.province}</Badge>
                                        </TableCell>
                                        <TableCell className="font-mono">{p.total_sales.toLocaleString()}</TableCell>
                                        <TableCell className="font-mono text-green-600">{p.total_profit.toLocaleString()}</TableCell>
                                        <TableCell className="font-mono text-center">{p.employee_count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>الأدوية الأكثر مبيعًا (كل الفروع)</CardTitle>
                        <CardDescription>أفضل 30 دواء مبيعًا في الفترة المحددة.</CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الدواء</TableHead>
                                    <TableHead className="text-left">الكمية المباعة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topSellingMedications.map((med, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{med.name}</TableCell>
                                        <TableCell className="text-left font-mono">{med.quantity.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
             <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>الصيدليات الأكثر شراءً</CardTitle>
                        <CardDescription>ترتيب الصيدليات حسب عدد قوائم الشراء المستلمة.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>اسم الصيدلية</TableHead>
                                    <TableHead className="text-left">عدد قوائم الشراء</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topPurchasingPharmacies.map(p => (
                                    <TableRow key={p.pharmacy_id}>
                                        <TableCell className="font-medium">{p.name}</TableCell>
                                        <TableCell className="font-mono text-left">{p.count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>الأدوية الأكثر شراءً (كل الفروع)</CardTitle>
                        <CardDescription>أكثر الأصناف التي يتم استلامها من الموردين.</CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الدواء</TableHead>
                                    <TableHead className="text-left">الكمية المشتراة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topPurchasedItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-left font-mono">{item.quantity.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

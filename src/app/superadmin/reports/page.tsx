
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

type PharmacyPerformance = {
    pharmacy_id: string;
    pharmacy_name: string;
    province: string;
    total_sales: number;
    total_profit: number;
    employee_count: number;
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
                        sales: data.sales, 
                        purchaseOrders: data.purchaseOrders 
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
    
    const filteredSales = React.useMemo(() => {
        if (!dateFrom && !dateTo) {
            return allPharmacySales;
        }
        const newFilteredSales: Record<string, Sale[]> = {};
        const interval = {
            start: dateFrom ? parseISO(dateFrom) : new Date(0),
            end: dateTo ? parseISO(dateTo) : new Date(),
        };

        for (const pharmacyId in allPharmacySales) {
            newFilteredSales[pharmacyId] = allPharmacySales[pharmacyId].filter(sale => 
                isWithinInterval(parseISO(sale.date), interval)
            );
        }
        return newFilteredSales;
    }, [allPharmacySales, dateFrom, dateTo]);

    const performanceData = React.useMemo(() => {
        return Object.keys(allPharmacySettings).map(pharmacyId => {
            const settings = allPharmacySettings[pharmacyId];
            const sales = filteredSales[pharmacyId] || [];
            
            const total_sales = sales.reduce((acc, sale) => acc + (sale.total || 0), 0);
            const total_profit = sales.reduce((acc, sale) => acc + ((sale.profit || 0) - (sale.discount || 0)), 0);
            
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
        }).sort((a,b) => b.total_sales - a.total_sales); // Sort by highest sales
    }, [allPharmacySettings, filteredSales, users]);

    const topSellingMedications = React.useMemo(() => {
        const medicationCounts: { [key: string]: { name: string, quantity: number } } = {};
        const salesData = Object.values(filteredSales).flat();

        if(!salesData) return [];

        salesData.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    if (!item.is_return) {
                        if (medicationCounts[item.medication_id]) {
                            medicationCounts[item.medication_id].quantity += item.quantity;
                        } else {
                            medicationCounts[item.medication_id] = {
                                name: item.name,
                                quantity: item.quantity,
                            };
                        }
                    }
                });
            }
        });

        return Object.values(medicationCounts)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 30);
    }, [filteredSales]);
    
    const purchaseAnalytics = React.useMemo(() => {
        const pharmacyPurchaseCounts: Record<string, number> = {};
        const topPurchasedItems: Record<string, {name: string, quantity: number}> = {};

        Object.entries(allPharmacyPurchases).forEach(([pharmacyId, purchases]) => {
            pharmacyPurchaseCounts[pharmacyId] = (pharmacyPurchaseCounts[pharmacyId] || 0) + purchases.length;
            purchases.forEach(po => {
                po.items.forEach(item => {
                    if (topPurchasedItems[item.medication_id!]) {
                        topPurchasedItems[item.medication_id!].quantity += item.quantity;
                    } else {
                        topPurchasedItems[item.medication_id!] = { name: item.name, quantity: item.quantity };
                    }
                })
            });
        });

        const topPharmacyId = Object.keys(pharmacyPurchaseCounts).reduce((a, b) => pharmacyPurchaseCounts[a] > pharmacyPurchaseCounts[b] ? a : b, '');
        const topPharmacy = allPharmacySettings[topPharmacyId]?.pharmacyName || 'N/A';

        const topItem = Object.values(topPurchasedItems).reduce((a, b) => a.quantity > b.quantity ? a : b, {name: 'N/A', quantity: 0});


        return { topPharmacy, topItemName: topItem.name };

    }, [allPharmacyPurchases, allPharmacySettings]);


    if (loading) {
        return <div className="text-center py-10">جاري تحميل التقارير المجمعة...</div>
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
                </CardHeader>
                 <CardContent className="grid gap-4 md:grid-cols-2">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">الصيدلية الأكثر شراءً</CardTitle>
                            <Building className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{purchaseAnalytics.topPharmacy}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">الدواء الأكثر شراءً</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{purchaseAnalytics.topItemName}</div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>تحليل مقارن لأداء الصيدليات</CardTitle>
                        <CardDescription>مقارنة بين الصيدليات بناءً على المؤشرات المالية الرئيسية.</CardDescription>
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
                    <CardContent>
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
        </div>
    );
}

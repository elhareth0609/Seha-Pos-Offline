
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AppSettings, Medication, Sale, User } from '@/lib/types';
import { DollarSign, TrendingUp, PieChart, TrendingDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminReportsPage() {
    const { currentUser, users, scopedData: allData, getAllPharmacySettings } = useAuth();
    const router = useRouter();
    const [pharmacySettings, setPharmacySettings] = React.useState<Record<string, AppSettings>>({});

    const [selectedPharmacyId, setSelectedPharmacyId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (currentUser && currentUser.role !== 'SuperAdmin') {
            router.push('/');
        }
    }, [currentUser, router]);

    React.useEffect(() => {
        const fetchSettings = async () => {
            if (currentUser?.role === 'SuperAdmin') {
                const settings = await getAllPharmacySettings();
                setPharmacySettings(settings);
            }
        };
        fetchSettings();
    }, [currentUser, getAllPharmacySettings]);

    const pharmacyAdmins = users.filter(u => u.role === 'Admin');
    // const selectedPharmacyData = React.useMemo(() => {
    //     if (!selectedPharmacyId) return null;

    //     const sales: Sale[] = allData.sales[selectedPharmacyId] || [];
    //     const inventory: Medication[] = allData.inventory[selectedPharmacyId] || [];
    //     const pharmacyUsers: User[] = users.filter(u => u.pharmacyId === selectedPharmacyId && u.role === 'Employee');

    //     const totalRevenue = sales.reduce((acc, sale) => acc + (sale.total || 0), 0);
    //     const totalProfit = sales.reduce((acc, sale) => acc + (sale.profit || 0) - (sale.discount || 0), 0);
    //     const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        
    //     const lowStockItems = inventory.filter(item => item.stock < item.reorderPoint).slice(0, 5);
        
    //     const topSellingItems = sales
    //         .flatMap(s => s.items)
    //         .reduce((acc, item) => {
    //             if (!item.isReturn) {
    //                 acc[item.medicationId] = (acc[item.medicationId] || 0) + item.quantity;
    //             }
    //             return acc;
    //         }, {} as { [key: string]: number });
        
    //     const topSoldArray = Object.entries(topSellingItems)
    //         .sort((a, b) => b[1] - a[1])
    //         .slice(0, 5)
    //         .map(([medicationId, quantity]) => {
    //             const med = inventory.find(m => m.id === medicationId);
    //             return { name: med?.name || 'غير معروف', quantity };
    //         });

    //     return {
    //         totalRevenue,
    //         totalProfit,
    //         profitMargin,
    //         lowStockItems,
    //         topSoldArray,
    //         pharmacyUsers,
    //     };
    // }, [selectedPharmacyId, allData, users]);
    const selectedPharmacyData = React.useMemo(() => {
        if (!selectedPharmacyId) return null;

        // Type assertion to tell TypeScript that selectedPharmacyId is a valid key
        const pharmacyId = selectedPharmacyId as string;
        
        // Type assertion for sales access - assuming it's also a tuple
        const salesData = allData.sales as [Sale[], any];
        // Type assertion for inventory access - it's a tuple
        const inventoryData = allData.inventory as [Medication[], any];
        
        // Access the arrays from the tuples at index 0
        const sales: Sale[] = salesData[0] || [];
        const inventory: Medication[] = inventoryData[0] || [];
        const pharmacyUsers: User[] = users.filter(u => u.pharmacyId === pharmacyId && u.role === 'Employee');

        const totalRevenue = sales.reduce((acc, sale) => acc + (sale.total || 0), 0);
        const totalProfit = sales.reduce((acc, sale) => acc + (sale.profit || 0) - (sale.discount || 0), 0);
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        
        const lowStockItems = inventory.filter(item => item.stock < item.reorderPoint).slice(0, 5);
        
        const topSellingItems = sales
            .flatMap(s => s.items)
            .reduce((acc, item) => {
                if (!item.isReturn) {
                    acc[item.medicationId] = (acc[item.medicationId] || 0) + item.quantity;
                }
                return acc;
            }, {} as { [key: string]: number });
        
        const topSoldArray = Object.entries(topSellingItems)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([medicationId, quantity]) => {
                const med = inventory.find(m => m.id === medicationId);
                return { name: med?.name || 'غير معروف', quantity };
            });

        return {
            totalRevenue,
            totalProfit,
            profitMargin,
            lowStockItems,
            topSoldArray,
            pharmacyUsers,
        };
    }, [selectedPharmacyId, allData, users]);

    if (!currentUser || currentUser.role !== 'SuperAdmin') {
        return null;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>تقارير الصيدليات</CardTitle>
                            <CardDescription>اختر صيدلية لعرض تقاريرها المفصلة.</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/superadmin"><ArrowLeft className="me-2"/> العودة</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Select onValueChange={setSelectedPharmacyId}>
                        <SelectTrigger className="w-full md:w-1/3">
                            <SelectValue placeholder="اختر صيدلية..." />
                        </SelectTrigger>
                        {/* <SelectContent>
                            {pharmacyAdmins.map(admin => (
                                <SelectItem key={admin.pharmacyId} value={admin.pharmacyId!}>
                                    {allData.settings[admin.pharmacyId!]?.pharmacyName || admin.name}
                                </SelectItem>
                            ))}
                        </SelectContent> */}
                        <SelectContent>
                            {pharmacyAdmins.map(admin => {
                                const pharmacyId = admin.pharmacyId as string;
                                const settings = pharmacySettings[pharmacyId];
                                return (
                                    <SelectItem key={pharmacyId} value={pharmacyId}>
                                        {settings?.pharmacyName || admin.name}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>


                    </Select>
                </CardContent>
            </Card>

            {selectedPharmacyData && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-mono">{selectedPharmacyData.totalRevenue.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600 font-mono">{selectedPharmacyData.totalProfit.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">هامش الربح</CardTitle>
                                <PieChart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-mono">{selectedPharmacyData.profitMargin.toFixed(2)}%</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                         <Card>
                            <CardHeader><CardTitle>الأصناف الأكثر مبيعًا</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>الدواء</TableHead><TableHead>الكمية المباعة</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {selectedPharmacyData.topSoldArray.map(item => (
                                            <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell className="font-mono">{item.quantity}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>أصناف منخفضة المخزون</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>الدواء</TableHead><TableHead>المخزون</TableHead><TableHead>نقطة الطلب</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {selectedPharmacyData.lowStockItems.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell><Badge variant="destructive" className="font-mono">{item.stock}</Badge></TableCell>
                                                <TableCell className="font-mono">{item.reorderPoint}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>موظفو الصيدلية</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead>البريد الإلكتروني</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {selectedPharmacyData.pharmacyUsers.map(user => (
                                            <TableRow key={user.id}><TableCell>{user.name}</TableCell><TableCell>{user.email}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

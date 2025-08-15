
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
    const { currentUser, getPharmacyData, getAllPharmacySettings } = useAuth();
    const router = useRouter();
    
    const [selectedPharmacyId, setSelectedPharmacyId] = React.useState<string | null>(null);
    const [pharmacySettings, setPharmacySettings] = React.useState<Record<string, AppSettings>>({});
    const [pharmacyData, setPharmacyData] = React.useState<{users: User[], sales: Sale[], inventory: Medication[]} | null>(null);
    const [loading, setLoading] = React.useState(false);

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

    // 新增：当选择的药房ID改变时获取数据
    React.useEffect(() => {
        const fetchData = async () => {
            if (selectedPharmacyId && currentUser?.role === 'SuperAdmin') {
                setLoading(true);
                try {
                    const data = await getPharmacyData(selectedPharmacyId);
                    setPharmacyData(data);
                } catch (error) {
                    console.error('Error fetching pharmacy data:', error);
                    setPharmacyData(null);
                } finally {
                    setLoading(false);
                }
            } else {
                setPharmacyData(null);
            }
        };
        fetchData();
    }, [selectedPharmacyId, getPharmacyData, currentUser]);

    
    const selectedPharmacyData = React.useMemo(() => {
        if (!selectedPharmacyId || !pharmacyData) return null;
        
        const { users, sales, inventory } = pharmacyData;
        const pharmacyAdmins = users.filter(u => u.role === 'Admin');
        const pharmacyUsers: User[] = users.filter(u => String(u.pharmacy_id) === selectedPharmacyId && u.role === "Employee");

        const totalRevenue = sales.reduce((acc, sale) => {
            const total = typeof sale.total === 'number' ? sale.total : parseFloat(String(sale.total || 0));
            return acc + (isNaN(total) ? 0 : total);
        }, 0);
        const totalProfit = sales.reduce((acc, sale) => {
            const  total = (typeof sale.profit === 'number' ? sale.profit : parseFloat(String(sale.profit || 0))) -
            (typeof sale.discount === 'number' ? sale.discount : parseFloat(String(sale.discount || 0)));
            return acc + (isNaN(total) ? 0 : total);
        }, 0);
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        
        const lowStockItems = inventory.filter(item => item.stock < item.reorder_point).slice(0, 5);
        // console.log(sales)
        const topSellingItems = sales
            .flatMap(s => s.items)
            .reduce((acc, item) => {
                if (!item.is_return) {
                    acc[item.medication_id] = (acc[item.medication_id] || 0) + item.quantity;
                }
                return acc;
            }, {} as { [key: string]: number });
        
        const topSoldArray = Object.entries(topSellingItems)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([medication_id, quantity]) => {
                console.log(medication_id, quantity);
                const med = inventory.find(m => m.id == medication_id);
                console.log("med ", med);
                return { name: med?.name || 'غير معروف', quantity, medication_id };
            });

        return {
            totalRevenue,
            totalProfit,
            profitMargin,
            lowStockItems,
            topSoldArray,
            pharmacyUsers,
        };
    }, [selectedPharmacyId, pharmacyData]);

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
                        <SelectContent>
                            {Object.entries(pharmacySettings).map(([pharmacyId, pharmacy]: [string, AppSettings]) => {
                                return (
                                    <SelectItem key={pharmacyId} value={pharmacyId}>
                                        {pharmacy?.pharmacyName || 'صيدلية جديدة'}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                    {loading && (
                        <div className="mt-4 text-center text-muted-foreground">
                            جاري تحميل البيانات...
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedPharmacyData && (
                <div className="space-y-6 animate-in fade-in mx-2">
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
                                            <TableRow key={item.medication_id}><TableCell>{item.name}</TableCell><TableCell className="font-mono">{item.quantity}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>أصناف منخفضة المخزون</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>الدواء</TableHead>
                                            <TableHead>المخزون</TableHead>
                                            <TableHead>نقطة الطلب</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedPharmacyData.lowStockItems.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell><Badge variant="destructive" className="font-mono">{item.stock}</Badge></TableCell>
                                                <TableCell className="font-mono">{item.reorder_point}</TableCell>
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

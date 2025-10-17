
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { MonthlyArchive, ArchivedMonthData } from '@/lib/types';
import { ArrowLeft, DollarSign, TrendingUp, PieChart, FileArchive } from 'lucide-react';
import Link from 'next/link';

export default function ArchivesPage() {
    const { currentUser, getArchivedMonths, getArchivedMonthData } = useAuth();
    const router = useRouter();

    const [archives, setArchives] = React.useState<MonthlyArchive[]>([]);
    const [selectedArchiveId, setSelectedArchiveId] = React.useState<string | null>(null);
    const [archiveData, setArchiveData] = React.useState<ArchivedMonthData | null>(null);
    const [loadingArchives, setLoadingArchives] = React.useState(true);
    const [loadingData, setLoadingData] = React.useState(false);

    React.useEffect(() => {
        if (currentUser && currentUser.role !== 'SuperAdmin' && !currentUser.permissions?.manage_archives) {
            router.push('/');
        }
    }, [currentUser, router]);

    React.useEffect(() => {
        const fetchArchives = async () => {
            setLoadingArchives(true);
            const data = await getArchivedMonths();
            setArchives(data);
            setLoadingArchives(false);
        };
        fetchArchives();
    }, [getArchivedMonths]);

    React.useEffect(() => {
        const fetchData = async () => {
            if (selectedArchiveId) {
                setLoadingData(true);
                const data = await getArchivedMonthData(selectedArchiveId);
                setArchiveData(data);
                setLoadingData(false);
            } else {
                setArchiveData(null);
            }
        };
        fetchData();
    }, [selectedArchiveId, getArchivedMonthData]);


    if (!currentUser || (currentUser.role !== 'SuperAdmin' && !currentUser.permissions?.manage_archives)) {
        return <div className="flex items-center justify-center min-h-screen"><p>ليس لديك صلاحية الوصول لهذه الصفحة.</p></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>الأرشيف الشهري</CardTitle>
                            <CardDescription>اختر شهرًا لعرض تقريره المؤرشف.</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/"><ArrowLeft className="me-2"/> العودة للرئيسية</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loadingArchives ? (
                        <Skeleton className="h-10 w-full md:w-1/3" />
                    ) : (
                        <Select onValueChange={setSelectedArchiveId} disabled={archives.length === 0}>
                            <SelectTrigger className="w-full md:w-1/3">
                                <SelectValue placeholder="اختر شهرًا من الأرشيف..." />
                            </SelectTrigger>
                            <SelectContent>
                                {archives.map(archive => (
                                    <SelectItem key={archive.id} value={archive.id}>
                                        {archive.month_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </CardContent>
            </Card>

            {loadingData ? (
                 <div className="space-y-6 animate-in fade-in">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader> <CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                        <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                        <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                    </div>
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
                    </Card>
                </div>
            ) : archiveData ? (
                <div className="space-y-6 animate-in fade-in">
                    <Card>
                         <CardHeader>
                            <CardTitle>ملخص الأداء المالي لشهر: {archiveData.month_name}</CardTitle>
                         </CardHeader>
                         <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent><div className="text-2xl font-bold font-mono">{archiveData.summary.total_sales.toLocaleString()}</div></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                    </CardHeader>
                                    <CardContent><div className="text-2xl font-bold text-green-600 font-mono">{archiveData.summary.net_profit.toLocaleString()}</div></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
                                        <PieChart className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent><div className="text-2xl font-bold font-mono text-destructive">{archiveData.summary.total_expenses.toLocaleString()}</div></CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="grid gap-6 md:grid-cols-2">
                         <Card>
                            <CardHeader><CardTitle>الأدوية الأكثر مبيعًا</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>الدواء</TableHead><TableHead>الكمية المباعة</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {archiveData.top_selling_medications.map((item: any, index: number) => (
                                            <TableRow key={index}><TableCell>{item.name}</TableCell><TableCell className="font-mono">{item.total_quantity}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>قائمة المبيعات</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>رقم الفاتورة</TableHead>
                                            <TableHead>التاريخ</TableHead>
                                            <TableHead>الإجمالي</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {archiveData.sales.map((sale: any) => (
                                            <TableRow key={sale.id}>
                                                <TableCell className="font-mono">{sale.id}</TableCell>
                                                <TableCell>{new Date(sale.date).toLocaleDateString('en-US')}</TableCell>
                                                <TableCell className="font-mono">{sale.total.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : selectedArchiveId && (
                <div className="text-center py-10 text-muted-foreground">
                    <p>لا توجد بيانات لهذا الشهر.</p>
                </div>
            )}
        </div>
    );
}


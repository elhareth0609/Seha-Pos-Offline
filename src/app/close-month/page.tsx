
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { differenceInMinutes } from 'date-fns';
import { DollarSign, Coins, Wallet, Scale, FileArchive, ArrowLeft, TrendingUp, PieChart } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MonthlyArchive, ArchivedMonthData } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"


export default function CloseMonthPage() {
    const { users, scopedData, closeMonth, currentUser, getArchivedMonths, getArchivedMonthData } = useAuth();
    const router = useRouter();
    const { sales, expenses, timeLogs, suppliers, purchaseOrders, supplierReturns, payments } = scopedData;
    const [pin, setPin] = React.useState('');
    const [isClosing, setIsClosing] = React.useState(false);
    const [isLoadingData, setIsLoadingData] = React.useState(true);
    const { toast } = useToast();

    // --- Archive State ---
    const [archives, setArchives] = React.useState<MonthlyArchive[]>([]);
    const [selectedArchiveId, setSelectedArchiveId] = React.useState<string | null>(null);
    const [archiveData, setArchiveData] = React.useState<ArchivedMonthData | null>(null);
    const [loadingArchives, setLoadingArchives] = React.useState(true);
    const [loadingArchiveData, setLoadingArchiveData] = React.useState(false);

    const monthlyStats = React.useMemo(() => {
        if (!sales[0] || !expenses[0] || !users || !timeLogs[0] || !suppliers[0] || !purchaseOrders[0] || !supplierReturns[0] || !payments[0]) {
             setIsLoadingData(false);
             return { totalSales: 0, totalExpenses: 0, totalSalaries: 0, totalDebts: 0 };
        }

        const totalSales = sales[0].reduce((acc, sale) => {
            const total = typeof sale.total === 'number' ? sale.total : parseFloat(String(sale.total || 0));
            return acc + (isNaN(total) ? 0 : total);
        }, 0);

        const totalExpenses = expenses[0].reduce((acc, expense) => {
            const amount = typeof expense.amount === 'number' ? expense.amount : parseFloat(String(expense.amount || 0));
            return acc + (isNaN(amount) ? 0 : amount);
        }, 0);
        
        const totalSalaries = users.reduce((total, user) => {
            if (!user.hourly_rate) return total;
            const hourlyRate = typeof user.hourly_rate === 'number' ? user.hourly_rate : parseFloat(String(user.hourly_rate || 0));
            if (isNaN(hourlyRate)) return total;
            
            const userLogs = timeLogs[0].filter(log => log.user_id === user.id && log.clock_out);
            const totalMinutes = userLogs.reduce((acc, log) => {
                const clockOut = new Date(log.clock_out!);
                const clockIn = new Date(log.clock_in);
                return acc + (isNaN(clockOut.getTime()) || isNaN(clockIn.getTime()) ? 0 : differenceInMinutes(clockOut, clockIn));
            }, 0);
            
            return total + (totalMinutes / 60) * hourlyRate;
        }, 0);

        const totalDebts = suppliers[0].reduce((acc, supplier) => {
            const totalPurchases = purchaseOrders[0]
                .filter(p => p.supplier_id === supplier.id)
                .reduce((sum, p) => {
                    const amount = typeof p.total_amount === 'number' ? p.total_amount : parseFloat(String(p.total_amount || 0));
                    return sum + (isNaN(amount) ? 0 : amount);
                }, 0);
                
            const totalReturns = supplierReturns[0]
                .filter(r => r.supplier_id === supplier.id)
                .reduce((sum, r) => {
                    const amount = typeof r.total_amount === 'number' ? r.total_amount : parseFloat(String(r.total_amount || 0));
                    return sum + (isNaN(amount) ? 0 : amount);
                }, 0);
                
            const totalPayments = payments[0]
                .filter(p => p.supplier_id === supplier.id)
                .reduce((sum, p) => {
                    const amount = typeof p.amount === 'number' ? p.amount : parseFloat(String(p.amount || 0));
                    return sum + (isNaN(amount) ? 0 : amount);
                }, 0);
                
            return acc + (totalPurchases - totalReturns - totalPayments);
        }, 0);

        setIsLoadingData(false);
        return { totalSales, totalExpenses, totalSalaries, totalDebts };
    }, [sales, expenses, timeLogs, users, suppliers, purchaseOrders, supplierReturns, payments]);

    const handleConfirmClose = async () => {
        if (pin.length < 6) {
            toast({ variant: 'destructive', title: 'رمز PIN قصير جدًا' });
            return;
        }
        setIsClosing(true);
        const success = await closeMonth(pin);
        if (success) {
            router.push('/'); // Redirect to dashboard after successful closing
        }
        setIsClosing(false);
    }
    
    React.useEffect(() => {
        if (currentUser && currentUser.role !== 'Admin' && !currentUser.permissions?.manage_close_month) {
            router.push('/');
        }
    }, [currentUser, router]);

    // --- Archive Effects ---
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
                setLoadingArchiveData(true);
                const data = await getArchivedMonthData(selectedArchiveId);
                setArchiveData(data);
                setLoadingArchiveData(false);
            } else {
                setArchiveData(null);
            }
        };
        fetchData();
    }, [selectedArchiveId, getArchivedMonthData]);


    if (currentUser && currentUser.role !== 'Admin' && !currentUser.permissions?.manage_close_month) {
        return <div className="flex items-center justify-center min-h-screen"><p>ليس لديك صلاحية الوصول لهذه الصفحة.</p></div>;
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <Card className="max-w-3xl mx-auto">
                 <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <FileArchive />
                                إقفال الشهر الحالي
                            </CardTitle>
                            <CardDescription>
                                مراجعة الحسابات الشهرية وتنفيذ عملية الأرشفة والتصفير.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert variant="destructive">
                        <FileArchive className="h-4 w-4" />
                        <AlertTitle>إجراء نهائي</AlertTitle>
                        <AlertDescription>
                            هذا الإجراء سيقوم بأرشفة بيانات الشهر الحالي وتصفيرها. لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
                        </AlertDescription>
                    </Alert>

                    <div className="border rounded-lg p-4 space-y-3">
                         <h3 className="font-semibold text-lg mb-2">ملخص الحسابات الشهرية:</h3>
                         {isLoadingData ? (
                            <div className="space-y-3">
                                <Skeleton className="h-6 w-full"/>
                                <Skeleton className="h-6 w-full"/>
                                <Skeleton className="h-6 w-full"/>
                                <Skeleton className="h-6 w-full"/>
                            </div>
                         ) : (
                            <>
                                <div className="flex justify-between items-center text-md">
                                    <span className="text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4"/> إجمالي المبيعات:</span> 
                                    <span className="font-mono font-semibold">{monthlyStats.totalSales.toLocaleString()}</span>
                                </div>
                                 <div className="flex justify-between items-center text-md">
                                    <span className="text-muted-foreground flex items-center gap-2"><Coins className="h-4 w-4"/> إجمالي المصروفات:</span> 
                                    <span className="font-mono font-semibold text-red-600">{monthlyStats.totalExpenses.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-md">
                                    <span className="text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4"/> إجمالي الرواتب:</span> 
                                    <span className="font-mono font-semibold text-red-600">{monthlyStats.totalSalaries.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-md">
                                    <span className="text-muted-foreground flex items-center gap-2"><Scale className="h-4 w-4"/> إجمالي الديون للموردين:</span> 
                                    <span className="font-mono font-semibold text-red-600">{monthlyStats.totalDebts.toLocaleString()}</span>
                                </div>
                            </>
                         )}
                    </div>
                     <div className="space-y-2 pt-4">
                        <Label htmlFor="close-month-pin" className="text-base">رمز PIN للمدير للتأكيد</Label>
                        <Input 
                            id="close-month-pin" 
                            type="password" 
                            value={pin} 
                            onChange={e => setPin(e.target.value)} 
                            placeholder="أدخل رمزك السري لتأكيد الإقفال"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                     <Button 
                        variant="destructive" 
                        onClick={handleConfirmClose} 
                        disabled={isClosing || pin.length < 6}
                        className="w-full"
                        size="lg"
                    >
                        {isClosing ? "جاري الإقفال..." : "تأكيد وإقفال الشهر نهائيًا"}
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>الأرشيف الشهري</CardTitle>
                            <CardDescription>اختر شهرًا لعرض تقريره المؤرشف.</CardDescription>
                        </div>
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
            
            {loadingArchiveData ? (
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
                                                <TableCell>{new Date(sale.date).toLocaleDateString('ar-EG')}</TableCell>
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

    

"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { differenceInMinutes } from 'date-fns';
import { DollarSign, Coins, Wallet, Scale, FileArchive, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function CloseMonthPage() {
    const { users, scopedData, closeMonth, toast, currentUser } = useAuth();
    const router = useRouter();
    const { sales, expenses, timeLogs, suppliers, purchaseOrders, supplierReturns, payments } = scopedData;
    const [pin, setPin] = React.useState('');
    const [isClosing, setIsClosing] = React.useState(false);
    const [isLoadingData, setIsLoadingData] = React.useState(true);

    const monthlyStats = React.useMemo(() => {
        if (!sales[0] || !expenses[0] || !users || !timeLogs[0] || !suppliers[0] || !purchaseOrders[0] || !supplierReturns[0] || !payments[0]) {
             setIsLoadingData(false);
             return { totalSales: 0, totalExpenses: 0, totalSalaries: 0, totalDebts: 0 };
        }

        const totalSales = sales[0].reduce((acc, sale) => acc + sale.total, 0);
        const totalExpenses = expenses[0].reduce((acc, expense) => acc + expense.amount, 0);
        
        const totalSalaries = users.reduce((total, user) => {
            if (!user.hourly_rate) return total;
            const userLogs = timeLogs[0].filter(log => log.user_id === user.id && log.clock_out);
            const totalMinutes = userLogs.reduce((acc, log) => acc + differenceInMinutes(new Date(log.clock_out!), new Date(log.clock_in)), 0);
            return total + (totalMinutes / 60) * user.hourly_rate;
        }, 0);

        const totalDebts = suppliers[0].reduce((acc, supplier) => {
            const totalPurchases = purchaseOrders[0].filter(p => p.supplier_id === supplier.id).reduce((sum, p) => sum + p.total_amount, 0);
            const totalReturns = supplierReturns[0].filter(r => r.supplier_id === supplier.id).reduce((sum, r) => sum + r.total_amount, 0);
            const totalPayments = payments[0].filter(p => p.supplier_id === supplier.id).reduce((sum, p) => sum + p.amount, 0);
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
            router.push('/archives');
        }
        setIsClosing(false);
    }

     if (!currentUser || (currentUser.role !== 'SuperAdmin' && !currentUser.permissions?.manage_close_month)) {
        return <div className="flex items-center justify-center min-h-screen"><p>ليس لديك صلاحية الوصول لهذه الصفحة.</p></div>;
    }

    return (
        <div className="container mx-auto py-8">
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
                        <Button variant="outline" asChild>
                            <Link href="/reports"><ArrowLeft className="me-2"/> العودة</Link>
                        </Button>
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
        </div>
    );
}


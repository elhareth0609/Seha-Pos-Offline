
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User, TimeLog } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Clock, User as UserIcon, Calendar, UserCog } from 'lucide-react';
import Image from 'next/image';
import { differenceInMinutes, formatDistanceStrict, isWithinInterval, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function HRPage() {
    const { currentUser, users, scopedData, updateUserHourlyRate } = useAuth();
    const { timeLogs: [timeLogs] } = scopedData;
    const { toast } = useToast();

    const [isClient, setIsClient] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
    const [isTimeLogDialogOpen, setIsTimeLogDialogOpen] = React.useState(false);
    const [currentUserHourlyRate, setCurrentUserHourlyRate] = React.useState<string>("");
    const [dateFrom, setDateFrom] = React.useState<string>("");
    const [dateTo, setDateTo] = React.useState<string>("");
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
        setIsClient(true);
        if (users.length > 0) {
            setLoading(false);
        }
    }, [users]);

    const pharmacyUsers = React.useMemo(() => {
        return users
            .filter(u => u.pharmacy_id === currentUser?.pharmacy_id && u.role !== 'SuperAdmin')
            .map(user => {
                const userTimeLogs = timeLogs.filter(log => log.user_id === user.id);
                const totalMinutes = userTimeLogs.reduce((acc, log) => {
                    if (log.clock_out) {
                        return acc + differenceInMinutes(new Date(log.clock_out), new Date(log.clock_in));
                    }
                    return acc;
                }, 0);
                const totalHours = totalMinutes / 60;
                const totalSalary = totalHours * (user.hourly_rate || 0);

                return {
                    ...user,
                    totalHours,
                    totalSalary
                };
            });
    }, [users, timeLogs, currentUser]);

    const openTimeLogDialog = (user: User) => {
        setSelectedUser(user);
        setCurrentUserHourlyRate(String(user.hourly_rate || 0));
        setDateFrom("");
        setDateTo("");
        setIsTimeLogDialogOpen(true);
    };

    const handleSaveHourlyRate = async () => {
        if (!selectedUser) return;
        const rate = parseFloat(currentUserHourlyRate);
        if (isNaN(rate) || rate < 0) {
            toast({ variant: 'destructive', title: 'معدل غير صالح', description: 'الرجاء إدخال رقم موجب.' });
            return;
        }
        await updateUserHourlyRate(selectedUser.id, rate);
    };

    const filteredTimeLogs = React.useMemo(() => {
        if (!selectedUser) return [];
        let userLogs = timeLogs.filter(log => log.user_id === selectedUser.id);
        
        if (dateFrom && dateTo) {
            const from = new Date(dateFrom);
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            userLogs = userLogs.filter(log => isWithinInterval(parseISO(log.clock_in), { start: from, end: to }));
        } else if (dateFrom) {
            userLogs = userLogs.filter(log => new Date(log.clock_in) >= new Date(dateFrom));
        } else if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            userLogs = userLogs.filter(log => new Date(log.clock_in) <= to);
        }

        return userLogs.sort((a,b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime());
    }, [selectedUser, timeLogs, dateFrom, dateTo]);

    const dialogTotalMinutes = filteredTimeLogs.reduce((acc, log) => {
        if (log.clock_out) {
            return acc + differenceInMinutes(new Date(log.clock_out), new Date(log.clock_in));
        }
        return acc;
    }, 0);
    const dialogTotalHours = dialogTotalMinutes / 60;
    const dialogTotalSalary = dialogTotalHours * (selectedUser?.hourly_rate || 0);

    if (!isClient) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-8 w-64" /></CardHeader>
                <CardContent><Skeleton className="h-64 w-full" /></CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <UserCog className="h-10 w-10 text-primary" />
                        <div>
                            <CardTitle>شؤون الموظفين</CardTitle>
                            <CardDescription>عرض وإدارة سجلات الدوام والرواتب لموظفي الصيدلية.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الموظف</TableHead>
                                <TableHead>إجمالي ساعات العمل (الكلي)</TableHead>
                                <TableHead>إجمالي الراتب المستحق (الكلي)</TableHead>
                                <TableHead className="text-left">عرض السجل</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={`skel-hr-${i}`}>
                                        <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-5 w-24" /></div></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell className="text-left"><Skeleton className="h-9 w-24" /></TableCell>
                                    </TableRow>
                                ))
                            ) : pharmacyUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {user.image1DataUri ? (
                                                <Image src={user.image1DataUri} alt={user.name} width={32} height={32} className="rounded-full object-cover" />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                    <UserIcon className="h-4 w-4" />
                                                </div>
                                            )}
                                            {user.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4 text-muted-foreground"/>
                                            {user.totalHours.toFixed(2)} ساعة
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono font-semibold text-green-600">
                                        <div className="flex items-center gap-1">
                                            <Wallet className="h-4 w-4"/>
                                            {user.totalSalary.toLocaleString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-left">
                                        <Button variant="outline" size="sm" onClick={() => openTimeLogDialog(user)}>
                                            <Calendar className="me-2 h-4 w-4" />
                                            سجل الدوام
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isTimeLogDialogOpen} onOpenChange={setIsTimeLogDialogOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>سجل دوام الموظف: {selectedUser?.name}</DialogTitle>
                        <DialogDescription>
                            عرض سجلات الدخول والخروج وحساب الراتب المستحق لفترة محددة.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="hourly_rate">سعر الساعة:</Label>
                                <Input id="hourly_rate" type="number" value={currentUserHourlyRate} onChange={(e) => setCurrentUserHourlyRate(e.target.value)} className="w-24"/>
                                <Button onClick={handleSaveHourlyRate} size="sm">حفظ</Button>
                            </div>
                            <div className="flex gap-2 items-end">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="date-from">من تاريخ</Label>
                                    <Input id="date-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="date-to">إلى تاريخ</Label>
                                    <Input id="date-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                                </div>
                                <Button onClick={() => { setDateFrom(""); setDateTo(""); }} variant="outline">مسح</Button>
                            </div>

                            <div className="max-h-64 overflow-y-auto border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>تاريخ الدخول</TableHead>
                                            <TableHead>تاريخ الخروج</TableHead>
                                            <TableHead>المدة</TableHead>
                                            <TableHead>الأجر</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTimeLogs.map(log => {
                                            const duration = log.clock_out ? formatDistanceStrict(new Date(log.clock_out), new Date(log.clock_in), { locale: ar, unit: 'minute' }) : "جارٍ العمل";
                                            const minutes = log.clock_out ? differenceInMinutes(new Date(log.clock_out), new Date(log.clock_in)) : 0;
                                            const salary = (minutes / 60) * (selectedUser?.hourly_rate || 0);

                                            return (
                                                <TableRow key={log.id}>
                                                    <TableCell>{new Date(log.clock_in).toLocaleString('ar-EG')}</TableCell>
                                                    <TableCell>{log.clock_out ? new Date(log.clock_out).toLocaleString('ar-EG') : '-'}</TableCell>
                                                    <TableCell className="font-mono">{duration}</TableCell>
                                                    <TableCell className="font-mono">{salary.toLocaleString()}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        <div className="md:col-span-1 space-y-4 rounded-md bg-muted p-4">
                            <h3 className="font-semibold text-lg text-center">الملخص للفترة المحددة</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4"/> إجمالي الساعات:</span>
                                    <span className="font-bold font-mono">{dialogTotalHours.toFixed(2)} ساعة</span>
                                </div>
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-muted-foreground flex items-center gap-2"><Wallet className="h-5 w-5"/> إجمالي الراتب:</span>
                                    <span className="font-bold text-green-600 font-mono">{dialogTotalSalary.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTimeLogDialogOpen(false)}>إغلاق</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

    
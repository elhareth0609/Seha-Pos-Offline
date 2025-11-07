
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User, TimeLog, UserPermissions } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Clock, User as UserIcon, Calendar, UserCog, MoreVertical, PlusCircle, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { differenceInMinutes, formatDistanceStrict, isWithinInterval, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const addUserSchema = z.object({
    name: z.string().min(3, { message: "الرجاء إدخال اسم مكون من 3 أحرف على الأقل." }),
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح." }),
    pin: z.string().refine(val => val.length >= 8 && /[a-zA-Z]/.test(val), { message: "يجب أن يتكون رمز PIN من 8 أحرف على الأقل ويحتوي على حرف واحد على الأقل." }),
});
type AddUserFormValues = z.infer<typeof addUserSchema>;

const editUserSchema = z.object({
    name: z.string().min(3, { message: "الرجاء إدخال اسم مكون من 3 أحرف على الأقل." }),
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح." }),
    pin: z.string().optional().refine(val => !val || (val.length >= 8 && /[a-zA-Z]/.test(val)), { message: "يجب أن يتكون رمز PIN من 8 أحرف على الأقل ويحتوي على حرف واحد على الأقل." }),
    confirmPin: z.string().optional(),
}).refine(data => data.pin === data.confirmPin, {
    message: "رموز PIN غير متطابقة",
    path: ["confirmPin"],
});
type EditUserFormValues = z.infer<typeof editUserSchema>;


const permissionLabels: { key: keyof Omit<UserPermissions, 'guide'>; label: string }[] = [
    { key: 'manage_sales', label: 'الوصول إلى قسم المبيعات' },
    { key: 'manage_inventory', label: 'الوصول إلى المخزون' },
    { key: 'manage_purchases', label: 'الوصول إلى المشتريات' },
    { key: 'manage_suppliers', label: 'الوصول إلى الموردين' },
    { key: 'manage_reports', label: 'الوصول إلى التقارير' },
    { key: 'manage_expenses', label: 'الوصول إلى الصرفيات' },
    { key: 'manage_tasks', label: 'الوصول إلى المهام' },
    { key: 'manage_itemMovement', label: 'الوصول إلى حركة المادة' },
    { key: 'manage_patients', label: 'الوصول إلى أصدقاء الصيدلية' },
    { key: 'manage_expiringSoon', label: 'الوصول إلى قريب الانتهاء' },
    { key: 'manage_trash', label: 'الوصول إلى سلة المحذوفات' },
    { key: 'manage_settings', label: 'الوصول إلى الإعدادات' },
    { key: 'manage_salesPriceModification', label: 'تعديل أسعار البيع في الفاتورة' },
    { key: 'manage_previous_sales', label: 'تعديل وحذف المبيعات السابقة' },
    // { key: 'manage_guide', label: 'الوصول إلى الدليل' },
    // { key: 'manage_close_month', label: 'الوصول إلى إغلاق الشهر' },
    { key: 'manage_order_requests', label: 'الوصول إلى طلبات الطلب' },
    { key: 'manage_offers', label: 'الوصول إلى العروض' },
    { key: 'manage_hr', label: 'الوصول إلى شؤون الموظفين' },
    { key: 'manage_exchange', label: 'الوصول إلى Pharma Swap' },
    // { key: 'manage_representatives', label: 'الوصول إلى المندوبين' },
];


export default function HRPage() {
    const { currentUser, users, scopedData, updateUserHourlyRate, registerUser, deleteUser, updateUser, updateUserPermissions } = useAuth();
    const { timeLogs: [timeLogs] } = scopedData;
    const { toast } = useToast();

    const [isClient, setIsClient] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
    const [isTimeLogDialogOpen, setIsTimeLogDialogOpen] = React.useState(false);
    const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
    const [isEditUserDialogOpen, setIsEditUserDialogOpen] = React.useState(false);
    const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);
    const [currentUserPermissions, setCurrentUserPermissions] = React.useState<UserPermissions | null>(null);
    const [currentUserHourlyRate, setCurrentUserHourlyRate] = React.useState<string>("");
    const [dateFrom, setDateFrom] = React.useState<string>("");
    const [dateTo, setDateTo] = React.useState<string>("");
    const [loading, setLoading] = React.useState(true);
    
    const addUserForm = useForm<AddUserFormValues>({
        resolver: zodResolver(addUserSchema),
        defaultValues: { name: "", email: "", pin: "" }
    });
    
    const editUserForm = useForm<EditUserFormValues>({
        resolver: zodResolver(editUserSchema),
        defaultValues: { name: "", email: "", pin: "", confirmPin: "" }
    });
    
    React.useEffect(() => {
        setIsClient(true);
        if (users.length > 0) {
            setLoading(false);
        }
    }, [users]);
    
     React.useEffect(() => {
        if (editingUser) {
            editUserForm.reset({
                name: editingUser.name,
                email: editingUser.email,
                pin: '',
                confirmPin: '',
            });
        }
    }, [editingUser, editUserForm]);


    const onAddUserSubmit = async (data: AddUserFormValues) => {
        const success = await registerUser(data.name, data.email, data.pin);
        if (success) {
            addUserForm.reset();
            setIsAddUserOpen(false);
        }
    };
    
    const onEditUserSubmit = async (data: EditUserFormValues) => {
        if (!editingUser) return;
        const success = await updateUser(editingUser.id, {
            name: data.name,
            email: data.email!,
            pin: data.pin || undefined
        });
        if (success) {
            setIsEditUserDialogOpen(false);
        }
    }

    const handleDeleteUser = (userToDelete: User) => {
        if (userToDelete.role === 'Admin') {
            toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن حذف حساب المدير.' });
            return;
        }
        deleteUser(userToDelete.id);
    }

     const openEditDialog = (user: User) => {
        setEditingUser(user);
        setIsEditUserDialogOpen(true);
    }
    
    const openPermissionsDialog = (user: User) => {
        setEditingUser(user);
        const permissions: UserPermissions = user.permissions || {
            manage_sales: true, 
            manage_inventory: true, 
            manage_purchases: false, 
            manage_suppliers: false,
            manage_reports: false, 
            manage_itemMovement: true, 
            manage_patients: true, 
            manage_expiringSoon: true,
            // manage_guide: true, 
            manage_settings: false, 
            manage_trash: false, 
            manage_salesPriceModification: false,
            manage_users: false, 
            manage_previous_sales: false, 
            manage_expenses: false, 
            manage_tasks: false,
            // manage_close_month: false, 
            manage_archives: false, 
            manage_order_requests: false, 
            manage_offers: false,
            manage_hr: false, 
            manage_support: false, 
            // manage_representatives: false,
            manage_exchange: false
        };
        setCurrentUserPermissions(permissions);
        setIsPermissionsDialogOpen(true);
    };

    const handlePermissionChange = (key: keyof UserPermissions, checked: boolean) => {
        if (currentUserPermissions) {
            setCurrentUserPermissions({ ...currentUserPermissions, [key]: checked });
        }
    };

    const handleSavePermissions = async () => {
        if (editingUser && currentUserPermissions) {
            const success = await updateUserPermissions(editingUser.id, currentUserPermissions);
            if (success) {
                setIsPermissionsDialogOpen(false);
                setEditingUser(null);
                setCurrentUserPermissions(null);
            }
        }
    };


    const pharmacyUsers = React.useMemo(() => {
        return users.filter(u => u.pharmacy_id === currentUser?.pharmacy_id && u.role !== 'SuperAdmin').map(user => {
            const userTimeLogs = timeLogs.filter(log => log.user_id === user.id && log.clock_out);
            const totalMinutes = userTimeLogs.reduce((acc, log) => {
                return acc + differenceInMinutes(new Date(log.clock_out!), new Date(log.clock_in));
            }, 0);
            const totalHours = totalMinutes / 60;
            const calculatedSalary = totalHours * (user.hourly_rate || 0);
            return { ...user, calculatedSalary };
        });
    }, [users, currentUser, timeLogs]);

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
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <UserCog className="h-10 w-10 text-primary" />
                            <div>
                                <CardTitle>شؤون الموظفين</CardTitle>
                                <CardDescription>إدارة الموظفين، الصلاحيات، سجلات الدوام، والرواتب.</CardDescription>
                            </div>
                        </div>
                        <Button size="sm" onClick={() => setIsAddUserOpen(true)}><PlusCircle className="me-2 h-4 w-4" /> إضافة موظف</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الموظف</TableHead>
                                <TableHead>الدور</TableHead>
                                <TableHead>سعر الساعة</TableHead>
                                <TableHead>الراتب المستحق</TableHead>
                                <TableHead className="text-left">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={`skel-hr-${i}`}>
                                        <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-5 w-24" /></div></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell className="text-left"><Skeleton className="h-8 w-8" /></TableCell>
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
                                     <TableCell>
                                        <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                                            {user.role === 'Admin' ? 'مدير' : 'موظف'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono">
                                        {(user.hourly_rate || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-mono font-semibold text-green-600">
                                        {user.calculatedSalary.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </TableCell>
                                    <TableCell className="text-left">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                 <DropdownMenuItem onSelect={() => openTimeLogDialog(user)}>
                                                    <Calendar className="me-2 h-4 w-4" />
                                                    سجل الدوام والراتب
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator/>
                                                <DropdownMenuItem onSelect={() => openEditDialog(user)}>
                                                    <Pencil className="me-2 h-4 w-4" />
                                                    تعديل البيانات
                                                </DropdownMenuItem>
                                                {user.role !== 'Admin' && (
                                                    <>
                                                    <DropdownMenuItem onSelect={() => openPermissionsDialog(user)}>
                                                        <ShieldCheck className="me-2 h-4 w-4" />
                                                        إدارة الصلاحيات
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive">
                                                                <Trash2 className="me-2 h-4 w-4"/> حذف الموظف
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                                <AlertDialogDescription>سيتم حذف الموظف {user.name} نهائياً. لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter className='sm:space-x-reverse'>
                                                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteUser(user)} className="bg-destructive hover:bg-destructive/90">نعم، قم بالحذف</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                        <DialogDescription>عرض سجلات الدخول والخروج وحساب الراتب المستحق لفترة محددة.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="hourly_rate">سعر الساعة:</Label>
                                <Input id="hourly_rate" type="number" value={currentUserHourlyRate} onChange={(e) => setCurrentUserHourlyRate(e.target.value)} className="w-24"/>
                                <Button onClick={handleSaveHourlyRate} size="sm">حفظ</Button>
                            </div>
                            <div className="flex gap-2 items-end">
                                <div className="flex-1 space-y-2"><Label htmlFor="date-from">من تاريخ</Label><Input id="date-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
                                <div className="flex-1 space-y-2"><Label htmlFor="date-to">إلى تاريخ</Label><Input id="date-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
                                <Button onClick={() => { setDateFrom(""); setDateTo(""); }} variant="outline">مسح</Button>
                            </div>
                            <div className="max-h-64 overflow-y-auto border rounded-md">
                                <Table>
                                    <TableHeader><TableRow><TableHead>تاريخ الدخول</TableHead><TableHead>تاريخ الخروج</TableHead><TableHead>المدة</TableHead><TableHead>الأجر</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {filteredTimeLogs.map(log => {
                                            const duration = log.clock_out ? formatDistanceStrict(new Date(log.clock_out), new Date(log.clock_in), { locale: ar, unit: 'minute' }) : "جارٍ العمل";
                                            const minutes = log.clock_out ? differenceInMinutes(new Date(log.clock_out), new Date(log.clock_in)) : 0;
                                            const salary = (minutes / 60) * (selectedUser?.hourly_rate || 0);
                                            return (
                                                <TableRow key={log.id}>
                                                    <TableCell>{new Date(log.clock_in).toLocaleString('en-US')}</TableCell>
                                                    <TableCell>{log.clock_out ? new Date(log.clock_out).toLocaleString('en-US') : '-'}</TableCell>
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
                                <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4"/> إجمالي الساعات:</span><span className="font-bold font-mono">{dialogTotalHours.toFixed(2)} ساعة</span></div>
                                <div className="flex justify-between items-center text-lg"><span className="text-muted-foreground flex items-center gap-2"><Wallet className="h-5 w-5"/> إجمالي الراتب:</span><span className="font-bold text-green-600 font-mono">{dialogTotalSalary.toLocaleString()}</span></div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsTimeLogDialogOpen(false)}>إغلاق</Button></DialogFooter>
                </DialogContent>
            </Dialog>

             <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>إضافة موظف جديد</DialogTitle></DialogHeader>
                    <Form {...addUserForm}>
                        <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4 py-2">
                            <FormField control={addUserForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>اسم الموظف</FormLabel><FormControl><Input placeholder="اسم الموظف الكامل" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={addUserForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" placeholder="example@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={addUserForm.control} name="pin" render={({ field }) => (<FormItem><FormLabel>رمز PIN</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <DialogFooter className="pt-4"><Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>إلغاء</Button><Button type="submit" disabled={addUserForm.formState.isSubmitting} variant="success">إضافة الموظف</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>تعديل بيانات الموظف: {editingUser?.name}</DialogTitle><DialogDescription>تحديث اسم، بريد إلكتروني، أو رمز PIN للموظف.</DialogDescription></DialogHeader>
                    <Form {...editUserForm}>
                        <form onSubmit={editUserForm.handleSubmit(onEditUserSubmit)} className="space-y-4 py-2">
                            <FormField control={editUserForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>الاسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={editUserForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={editUserForm.control} name="pin" render={({ field }) => (<FormItem><FormLabel>رمز PIN الجديد (اختياري)</FormLabel><FormControl><Input type="password"  {...field} placeholder="اتركه فارغًا لعدم التغيير" /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={editUserForm.control} name="confirmPin" render={({ field }) => (<FormItem><FormLabel>تأكيد رمز PIN الجديد</FormLabel><FormControl><Input type="password"  {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <DialogFooter className="pt-4"><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose><Button type="submit" variant="success">حفظ التغييرات</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>صلاحيات الموظف: {editingUser?.name}</DialogTitle><DialogDescription>اختر الأقسام التي يمكن للموظف الوصول إليها.</DialogDescription></DialogHeader>
                    <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {currentUserPermissions && permissionLabels.map(p => (
                            <div key={p.key} className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox id={`perm-${p.key}`} checked={currentUserPermissions[p.key as keyof UserPermissions]} onCheckedChange={(checked) => handlePermissionChange(p.key as keyof UserPermissions, !!checked)} />
                                <Label htmlFor={`perm-${p.key}`} className="flex-1 cursor-pointer">{p.label}</Label>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" onClick={() => { setEditingUser(null); setCurrentUserPermissions(null); }}>إلغاء</Button></DialogClose>
                        <Button onClick={handleSavePermissions} variant="success">حفظ الصلاحيات</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

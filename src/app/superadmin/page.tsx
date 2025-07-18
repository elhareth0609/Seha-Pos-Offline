
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { User, Sale } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MoreVertical, PlusCircle, Trash2, ToggleLeft, ToggleRight, Settings, LogOut, Eye, EyeOff, FileText, Users, DollarSign, Building } from 'lucide-react';
import Link from 'next/link';

const addAdminSchema = z.object({
    name: z.string().min(3, { message: "الاسم مطلوب" }),
    email: z.string().email({ message: "بريد إلكتروني غير صالح" }),
    pin: z.string().regex(/^\d{4}$/, { message: "رمز PIN يجب أن يكون 4 أرقام" }),
});

type AddAdminFormValues = z.infer<typeof addAdminSchema>;

function AdminRow({ admin, onDelete, onToggleStatus, pharmacyData }: { admin: User, onDelete: (user: User) => void, onToggleStatus: (user: User) => void, pharmacyData: { employeeCount: number, totalSales: number } }) {
    const [showPin, setShowPin] = React.useState(false);

    return (
         <TableRow>
            <TableCell className="font-medium">{admin.name}</TableCell>
            <TableCell>{admin.email}</TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <span>{showPin ? admin.pin : '••••'}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPin(p => !p)}>
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </TableCell>
            <TableCell>{pharmacyData.employeeCount}</TableCell>
            <TableCell className="font-mono">{pharmacyData.totalSales.toLocaleString('ar-IQ')} د.ع</TableCell>
            <TableCell>
                <Badge variant={admin.status === 'active' ? 'secondary' : 'destructive'} className={admin.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                    {admin.status === 'active' ? 'فعال' : 'معلق'}
                </Badge>
            </TableCell>
            <TableCell className="text-left">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onToggleStatus(admin)}>
                            {admin.status === 'active' ? <ToggleLeft className="me-2"/> : <ToggleRight className="me-2" />}
                            {admin.status === 'active' ? 'تعليق الحساب' : 'إعادة تفعيل'}
                        </DropdownMenuItem>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive">
                                    <Trash2 className="me-2" /> حذف نهائي
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        هذا الإجراء لا يمكن التراجع عنه. سيتم حذف حساب المدير <span className="font-bold">{admin.name}</span> وكل بيانات صيدليته نهائيًا.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(admin)} className="bg-destructive hover:bg-destructive/90">
                                        نعم، قم بالحذف
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    )
}

export default function SuperAdminPage() {
    const { currentUser, users, createPharmacyAdmin, deleteUser, toggleUserStatus, logout, scopedData: allData } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isAddAdminOpen, setIsAddAdminOpen] = React.useState(false);
    
    const addAdminForm = useForm<AddAdminFormValues>({
        resolver: zodResolver(addAdminSchema),
        defaultValues: { name: "", email: "", pin: "" },
    });

    React.useEffect(() => {
        if (currentUser && currentUser.role !== 'SuperAdmin') {
            router.push('/');
        }
    }, [currentUser, router]);

    const handleAddAdmin = async (data: AddAdminFormValues) => {
        const success = await createPharmacyAdmin(data.name, data.email, data.pin);
        if (success) {
            toast({ title: "تم إنشاء حساب المدير بنجاح" });
            setIsAddAdminOpen(false);
            addAdminForm.reset();
        } else {
            toast({ variant: 'destructive', title: "خطأ", description: "البريد الإلكتروني مستخدم بالفعل." });
        }
    };
    
    const handleDeleteAdmin = (user: User) => {
        deleteUser(user.id, true).then(success => {
            if(success) toast({title: `تم حذف حساب ${user.name} نهائياً`});
            else toast({variant: 'destructive', title: "خطأ", description: "لم يتمكن من حذف الحساب."})
        });
    }

    const handleToggleStatus = (user: User) => {
        toggleUserStatus(user.id).then(success => {
             if(success) toast({title: `تم تغيير حالة حساب ${user.name}`});
        })
    }
    
    const pharmacyAdmins = users.filter(u => u.role === 'Admin');
    const totalEmployees = users.filter(u => u.role === 'Employee').length;
    const totalSales = Object.values(allData.sales).flat().reduce((sum, sale) => sum + (sale.total || 0), 0);

    const getPharmacyData = (pharmacyId: string) => {
        const employeeCount = users.filter(u => u.pharmacyId === pharmacyId && u.role === 'Employee').length;
        const totalSales = (allData.sales[pharmacyId] || []).reduce((sum, sale) => sum + (sale.total || 0), 0);
        return { employeeCount, totalSales };
    };

    if (!currentUser || currentUser.role !== 'SuperAdmin') {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم الشركة</h1>
                    <p className="text-muted-foreground">إدارة حسابات مديري الصيدليات المسجلة في النظام.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/superadmin/account">
                            <Settings className="me-2"/>
                            إعدادات الحساب
                        </Link>
                    </Button>
                    <Button variant="secondary" onClick={logout}>
                        <LogOut className="me-2"/>
                        تسجيل الخروج
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">عدد الصيدليات</CardTitle><Building className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{pharmacyAdmins.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">إجمالي الموظفين</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{totalEmployees}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{totalSales.toLocaleString('ar-IQ')} د.ع</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>مدراء الصيدليات</CardTitle>
                        <CardDescription>قائمة بجميع حسابات مدراء الصيدليات المسجلين.</CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                         <Button variant="outline" asChild>
                            <Link href="/superadmin/reports"><FileText className="me-2"/> عرض التقارير</Link>
                        </Button>
                        <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                            <DialogTrigger asChild>
                                <Button><PlusCircle className="me-2"/> إنشاء حساب مدير</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>إنشاء حساب مدير صيدلية</DialogTitle>
                                </DialogHeader>
                                <Form {...addAdminForm}>
                                    <form onSubmit={addAdminForm.handleSubmit(handleAddAdmin)} className="space-y-4 py-2">
                                         <FormField control={addAdminForm.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>اسم المدير</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                         <FormField control={addAdminForm.control} name="email" render={({ field }) => (
                                            <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={addAdminForm.control} name="pin" render={({ field }) => (
                                            <FormItem><FormLabel>رمز PIN (4 أرقام)</FormLabel><FormControl><Input type="password" inputMode="numeric" maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <DialogFooter className="pt-4">
                                            <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                                            <Button type="submit" variant="success">إنشاء الحساب</Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>اسم المدير</TableHead>
                                <TableHead>البريد الإلكتروني</TableHead>
                                <TableHead>رمز PIN</TableHead>
                                <TableHead>عدد الموظفين</TableHead>
                                <TableHead>إجمالي المبيعات</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead className="text-left">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pharmacyAdmins.map(admin => (
                                <AdminRow 
                                    key={admin.id} 
                                    admin={admin} 
                                    onDelete={handleDeleteAdmin} 
                                    onToggleStatus={handleToggleStatus}
                                    pharmacyData={getPharmacyData(admin.pharmacyId!)}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

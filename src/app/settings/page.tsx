
"use client"

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import type { AppSettings, User, UserPermissions, TrashItem, Sale, TimeLog } from '@/lib/types'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
    DialogDescription
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from '@/components/ui/skeleton'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAuth } from '@/hooks/use-auth'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trash2, PlusCircle, ShieldCheck, User as UserIcon, Clock, Wallet, MoreVertical, Pencil, Calendar as CalendarIcon } from 'lucide-react'
import { clearAllDBData } from '@/hooks/use-local-storage'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { differenceInMinutes, format, formatDistanceStrict, isWithinInterval, parseISO } from 'date-fns'
import { ar } from 'date-fns/locale'
import { appSettings as fallbackSettings } from '@/lib/data'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'


const settingsSchema = z.object({
  pharmacyName: z.string().min(2, { message: "يجب أن يكون اسم الصيدلية حرفين على الأقل." }),
  pharmacyAddress: z.string().optional(),
  pharmacyPhone: z.string().optional(),
  pharmacyEmail: z.string().email({ message: "بريد إلكتروني غير صالح." }).optional().or(z.literal('')),
  expirationThresholdDays: z.coerce.number().int().positive({ message: "يجب أن يكون عدد الأيام رقمًا صحيحًا موجبًا." }),
  invoiceFooterMessage: z.string().optional(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

const addUserSchema = z.object({
    name: z.string().min(3, { message: "الرجاء إدخال اسم مكون من 3 أحرف على الأقل." }),
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح."}),
    pin: z.string().regex(/^\d{4}$/, { message: "يجب أن يتكون رمز PIN من 4 أرقام." }),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

const editUserSchema = z.object({
    name: z.string().min(3, { message: "الرجاء إدخال اسم مكون من 3 أحرف على الأقل." }),
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح."}),
    pin: z.string().optional().refine(val => val === '' || /^\d{4}$/.test(val!), { message: "يجب أن يتكون رمز PIN من 4 أرقام." }),
    confirmPin: z.string().optional(),
}).refine(data => data.pin === data.confirmPin, {
    message: "رموز PIN غير متطابقة",
    path: ["confirmPin"],
});

type EditUserFormValues = z.infer<typeof editUserSchema>;


const permissionLabels: { key: keyof Omit<UserPermissions, 'guide'>; label: string }[] = [
    { key: 'sales', label: 'الوصول إلى قسم المبيعات' },
    { key: 'inventory', label: 'الوصول إلى المخزون' },
    { key: 'purchases', label: 'الوصول إلى المشتريات' },
    { key: 'suppliers', label: 'الوصول إلى الموردين' },
    { key: 'reports', label: 'الوصول إلى التقارير' },
    { key: 'itemMovement', label: 'الوصول إلى حركة المادة' },
    { key: 'patients', label: 'الوصول إلى أصدقاء الصيدلية' },
    { key: 'expiringSoon', label: 'الوصول إلى قريب الانتهاء' },
    { key: 'trash', label: 'الوصول إلى سلة المحذوفات' },
    { key: 'settings', label: 'الوصول إلى الإعدادات' },
];

function AddUserDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { registerUser } = useAuth();
    const { toast } = useToast();
    const addUserForm = useForm<AddUserFormValues>({
        resolver: zodResolver(addUserSchema),
        defaultValues: { name: "", email: "", pin: "" }
    });

    const resetDialog = () => {
        addUserForm.reset();
        onOpenChange(false);
    }

    const onAddUserSubmit = async (data: AddUserFormValues) => {
        const success = await registerUser(data.name, data.email, data.pin);
        if (success) {
            toast({ title: "تم إضافة الموظف بنجاح!" });
            resetDialog();
        } else {
            toast({ variant: 'destructive', title: "البريد الإلكتروني مستخدم", description: "هذا البريد الإلكتروني مسجل بالفعل." });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>إضافة موظف جديد</DialogTitle>
                </DialogHeader>
                <Form {...addUserForm}>
                    <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4 py-2">
                        <FormField control={addUserForm.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>اسم الموظف</FormLabel>
                                <FormControl><Input placeholder="اسم الموظف الكامل" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={addUserForm.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel>البريد الإلكتروني</FormLabel>
                                <FormControl><Input type="email" placeholder="example@email.com" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={addUserForm.control} name="pin" render={({ field }) => (
                            <FormItem>
                                <FormLabel>رمز PIN (4 أرقام)</FormLabel>
                                <FormControl><Input type="password" inputMode="numeric" maxLength={4} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={resetDialog}>إلغاء</Button>
                            <Button type="submit" disabled={addUserForm.formState.isSubmitting} variant="success">إضافة الموظف</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


export default function SettingsPage() {
    const { toast } = useToast()
    const { currentUser, users, deleteUser, updateUser, updateUserPermissions, updateUserHourlyRate, scopedData } = useAuth();
    
    const { settings: [settings, setSettings], trash: [, setTrash], sales: [sales], timeLogs: [timeLogs] } = scopedData;

    const [isClient, setIsClient] = React.useState(false);
    
    const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
    const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = React.useState(false);
    const [isTimeLogDialogOpen, setIsTimeLogDialogOpen] = React.useState(false);
    const [isEditUserDialogOpen, setIsEditUserDialogOpen] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);
    const [currentUserPermissions, setCurrentUserPermissions] = React.useState<UserPermissions | null>(null);
    const [currentUserHourlyRate, setCurrentUserHourlyRate] = React.useState<string>("");
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

    const settingsForm = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: { ...fallbackSettings },
    });
    
     const editUserForm = useForm<EditUserFormValues>({
        resolver: zodResolver(editUserSchema),
        defaultValues: { name: "", email: "", pin: "", confirmPin: "" }
    });

    React.useEffect(() => {
        setIsClient(true);
        if (settings) {
            settingsForm.reset({ ...fallbackSettings, ...settings });
        }
    }, [settings, settingsForm]);
    
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


    const onSettingsSubmit = (data: SettingsFormValues) => {
        setSettings(data);
        toast({
            title: "تم حفظ الإعدادات بنجاح!",
        })
    }
    
    const onEditUserSubmit = async (data: EditUserFormValues) => {
        if (!editingUser) return;
        const success = await updateUser(editingUser.id, data.name, data.email!, data.pin || undefined);
        if (success) {
            toast({ title: "تم تحديث بيانات الموظف بنجاح" });
            setIsEditUserDialogOpen(false);
        } else {
            toast({ variant: 'destructive', title: "خطأ", description: "البريد الإلكتروني قد يكون مستخدماً بالفعل." });
        }
    }

    const handleClearData = async () => {
        if (typeof window !== 'undefined') {
            try {
                await clearAllDBData();
                alert("تم مسح جميع البيانات بنجاح. سيتم إعادة تحميل الصفحة.");
                window.location.reload();
            } catch (error) {
                console.error("Failed to clear data:", error);
                alert("حدث خطأ أثناء محاولة مسح البيانات.");
            }
        }
    }

    const handleDeleteUser = (userToDelete: User) => {
        if (userToDelete.role === 'Admin') {
            toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن حذف حساب المدير.' });
            return;
        }

        const hasSales = sales.some(sale => sale.employeeId === userToDelete.id);
        if (hasSales) {
            toast({ variant: 'destructive', title: 'لا يمكن الحذف', description: 'هذا الموظف مرتبط بسجلات مبيعات ولا يمكن حذفه.' });
            return;
        }

        const newTrashItem: TrashItem = {
            id: `TRASH-${Date.now()}`,
            deletedAt: new Date().toISOString(),
            itemType: 'user',
            data: userToDelete,
        };
        setTrash(prev => [...prev, newTrashItem]);
        deleteUser(userToDelete.id);
        toast({ title: "تم نقل الموظف إلى سلة المحذوفات" });
    }
    
    const openPermissionsDialog = (user: User) => {
        setEditingUser(user);
        const permissions = user.permissions || {
            sales: true, inventory: true, purchases: false, suppliers: false, reports: false, itemMovement: true, patients: true, expiringSoon: true, guide: true, settings: false, trash: false
        };
        setCurrentUserPermissions(permissions);
        setIsPermissionsDialogOpen(true);
    };
    
    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setIsEditUserDialogOpen(true);
    }

    const handlePermissionChange = (key: keyof UserPermissions, checked: boolean) => {
        if (currentUserPermissions) {
            setCurrentUserPermissions({ ...currentUserPermissions, [key]: checked });
        }
    };

    const handleSavePermissions = async () => {
        if (editingUser && currentUserPermissions) {
            const success = await updateUserPermissions(editingUser.id, currentUserPermissions);
            if (success) {
                toast({ title: 'تم تحديث الصلاحيات بنجاح' });
                setIsPermissionsDialogOpen(false);
                setEditingUser(null);
                setCurrentUserPermissions(null);
            } else {
                toast({ variant: 'destructive', title: 'خطأ', description: 'لم نتمكن من تحديث الصلاحيات.' });
            }
        }
    };

    const openTimeLogDialog = (user: User) => {
        setEditingUser(user);
        setCurrentUserHourlyRate(String(user.hourlyRate || 0));
        setDateRange(undefined);
        setIsTimeLogDialogOpen(true);
    };
    
    const handleSaveHourlyRate = async () => {
        if (!editingUser) return;
        const rate = parseFloat(currentUserHourlyRate);
        if (isNaN(rate) || rate < 0) {
            toast({ variant: 'destructive', title: 'معدل غير صالح', description: 'الرجاء إدخال رقم موجب.' });
            return;
        }
        await updateUserHourlyRate(editingUser.id, rate);
        toast({ title: 'تم تحديث سعر الساعة' });
    };

    const pharmacyUsers = users.filter(u => u.pharmacyId === currentUser?.pharmacyId && u.role !== 'SuperAdmin');
    
    const filteredTimeLogs = React.useMemo(() => {
        if (!editingUser) return [];
        const userLogs = timeLogs.filter(log => log.userId === editingUser.id);
        if (!dateRange || !dateRange.from) {
            return userLogs;
        }
        const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
        toDate.setHours(23, 59, 59, 999); // Include the whole end day

        return userLogs.filter(log => isWithinInterval(parseISO(log.clockIn), { start: dateRange.from!, end: toDate }));
    }, [editingUser, timeLogs, dateRange]);


    const totalMinutes = filteredTimeLogs.reduce((acc, log) => {
        if (log.clockOut) {
            return acc + differenceInMinutes(new Date(log.clockOut), new Date(log.clockIn));
        }
        return acc;
    }, 0);
    const totalHours = totalMinutes / 60;
    const totalSalary = totalHours * (editingUser?.hourlyRate || 0);

    if (!isClient || !currentUser) {
        return (
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-5 w-72" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-20 w-full" /></div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                        </div>
                        <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-10 w-full" /></div>
                        <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-20 w-full" /></div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
            </div>
        )
    }

  return (
    <div className="grid gap-6">
        <Form {...settingsForm}>
            <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>الإعدادات العامة</CardTitle>
                    <CardDescription>
                      إدارة الإعدادات العامة للصيدلية. تؤثر هذه الإعدادات على الفواتير والتقارير والتنبيهات.
                    </CardDescription>
                  </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                          control={settingsForm.control}
                          name="pharmacyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم الصيدلية</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={settingsForm.control}
                          name="pharmacyAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>العنوان</FormLabel>
                              <FormControl><Textarea {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                              control={settingsForm.control}
                              name="pharmacyPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>رقم الهاتف</FormLabel>
                                  <FormControl><Input {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={settingsForm.control}
                              name="pharmacyEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>البريد الإلكتروني</FormLabel>
                                  <FormControl><Input type="email" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>
                         <FormField
                           control={settingsForm.control}
                           name="expirationThresholdDays"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel>تنبيه انتهاء الصلاحية (بالأيام)</FormLabel>
                               <FormControl><Input type="number" {...field} /></FormControl>
                               <FormDescription>
                                 سيتم إدراج الأدوية التي تنتهي صلاحيتها خلال هذه الفترة في صفحة "قريب الانتهاء".
                               </FormDescription>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                         <FormField
                          control={settingsForm.control}
                          name="invoiceFooterMessage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>رسالة تذييل الفاتورة</FormLabel>
                              <FormControl><Textarea {...field} placeholder="شكرًا لزيارتكم!" /></FormControl>
                              <FormDescription>
                                هذه الرسالة ستظهر في أسفل كل فاتورة مطبوعة.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" variant="success">حفظ التغييرات</Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
        
        {currentUser.role === 'Admin' && (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>إدارة الموظفين</CardTitle>
                        <CardDescription>
                            إضافة، عرض، وحذف حسابات الموظفين وصلاحياتهم.
                        </CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setIsAddUserOpen(true)}><PlusCircle className="me-2 h-4 w-4" /> إضافة موظف</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الاسم</TableHead>
                                <TableHead>الدور</TableHead>
                                <TableHead>سعر الساعة</TableHead>
                                <TableHead className="text-left">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pharmacyUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <button onClick={() => openTimeLogDialog(user)} className="flex items-center gap-2 text-right hover:text-primary">
                                            {user.image1DataUri ? (
                                                <Image src={user.image1DataUri} alt={user.name} width={32} height={32} className="rounded-full object-cover" />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                    <UserIcon className="h-4 w-4" />
                                                </div>
                                            )}
                                            {user.name}
                                        </button>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                                            {user.role === 'Admin' ? 'مدير' : 'موظف'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono">
                                        {(user.hourlyRate || 0).toLocaleString('ar-IQ')} د.ع
                                    </TableCell>
                                    <TableCell className="text-left">
                                        {user.role !== 'Admin' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => openEditDialog(user)}>
                                                        <Pencil className="me-2 h-4 w-4" />
                                                        تعديل البيانات
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => openPermissionsDialog(user)}>
                                                        <ShieldCheck className="me-2 h-4 w-4" />
                                                        إدارة الصلاحيات
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive">
                                                                <Trash2 className="me-2" />
                                                                حذف
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    سيتم نقل الموظف {user.name} إلى سلة المحذوفات.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteUser(user)} className="bg-destructive hover:bg-destructive/90">
                                                                    نعم، قم بالحذف
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}

        {currentUser.role === 'Admin' && (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle>منطقة الخطر</CardTitle>
                    <CardDescription>
                        إجراءات لا يمكن التراجع عنها. يرجى المتابعة بحذر.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">مسح جميع بيانات التطبيق</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                    هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف جميع البيانات بشكل دائم، بما في ذلك المخزون والمبيعات والمرضى والمستخدمين. لا يمكن استعادة هذه البيانات.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90">نعم، امسح كل شيء</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        )}
        
        <AddUserDialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen} />

         <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>صلاحيات الموظف: {editingUser?.name}</DialogTitle>
                    <DialogDescription>
                        اختر الأقسام التي يمكن للموظف الوصول إليها.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentUserPermissions && permissionLabels.map(p => (
                        <div key={p.key} className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                                id={`perm-${p.key}`}
                                checked={currentUserPermissions[p.key]}
                                onCheckedChange={(checked) => handlePermissionChange(p.key as keyof UserPermissions, !!checked)}
                            />
                            <Label htmlFor={`perm-${p.key}`} className="flex-1 cursor-pointer">{p.label}</Label>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" onClick={() => { setEditingUser(null); setCurrentUserPermissions(null); }}>إلغاء</Button>
                    </DialogClose>
                    <Button onClick={handleSavePermissions} variant="success">حفظ الصلاحيات</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تعديل بيانات الموظف: {editingUser?.name}</DialogTitle>
                    <DialogDescription>
                        تحديث اسم، بريد إلكتروني، أو رمز PIN للموظف.
                    </DialogDescription>
                </DialogHeader>
                <Form {...editUserForm}>
                    <form onSubmit={editUserForm.handleSubmit(onEditUserSubmit)} className="space-y-4 py-2">
                         <FormField control={editUserForm.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>الاسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={editUserForm.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={editUserForm.control} name="pin" render={({ field }) => (
                            <FormItem><FormLabel>رمز PIN الجديد (اختياري)</FormLabel><FormControl><Input type="password" inputMode="numeric" maxLength={4} {...field} placeholder="اتركه فارغًا لعدم التغيير" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={editUserForm.control} name="confirmPin" render={({ field }) => (
                            <FormItem><FormLabel>تأكيد رمز PIN الجديد</FormLabel><FormControl><Input type="password" inputMode="numeric" maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter className="pt-4">
                            <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                            <Button type="submit" variant="success">حفظ التغييرات</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isTimeLogDialogOpen} onOpenChange={setIsTimeLogDialogOpen}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>سجل دوام الموظف: {editingUser?.name}</DialogTitle>
                    <DialogDescription>
                        عرض سجلات الدخول والخروج وحساب الراتب المستحق.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="hourlyRate">سعر الساعة (د.ع):</Label>
                            <Input id="hourlyRate" type="number" value={currentUserHourlyRate} onChange={(e) => setCurrentUserHourlyRate(e.target.value)} className="w-24"/>
                            <Button onClick={handleSaveHourlyRate} size="sm">حفظ</Button>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
                                )
                                ) : (
                                <span>اختر نطاقًا زمنيًا</span>
                                )}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                            </PopoverContent>
                        </Popover>
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
                                    const duration = log.clockOut ? formatDistanceStrict(new Date(log.clockOut), new Date(log.clockIn), { locale: ar, unit: 'minute' }) : "جارٍ العمل";
                                    const minutes = log.clockOut ? differenceInMinutes(new Date(log.clockOut), new Date(log.clockIn)) : 0;
                                    const salary = (minutes / 60) * (editingUser?.hourlyRate || 0);

                                    return (
                                        <TableRow key={log.id}>
                                            <TableCell>{new Date(log.clockIn).toLocaleString('ar-EG')}</TableCell>
                                            <TableCell>{log.clockOut ? new Date(log.clockOut).toLocaleString('ar-EG') : '-'}</TableCell>
                                            <TableCell>{duration}</TableCell>
                                            <TableCell>{salary.toLocaleString('ar-IQ')} د.ع</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        </div>
                    </div>
                     <div className="md:col-span-1 space-y-4 rounded-md bg-muted p-4">
                        <h3 className="font-semibold text-lg text-center">الملخص</h3>
                        <div className="space-y-2">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4"/> إجمالي الساعات:</span>
                                <span className="font-bold">{totalHours.toFixed(2)} ساعة</span>
                            </div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-muted-foreground flex items-center gap-2"><Wallet className="h-5 w-5"/> إجمالي الراتب:</span>
                                <span className="font-bold text-green-600">{totalSalary.toLocaleString('ar-IQ')} د.ع</span>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTimeLogDialogOpen(false)}>إغلاق</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  )
}

    
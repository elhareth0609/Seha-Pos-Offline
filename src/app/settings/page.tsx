
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
import type { AppSettings, User, UserPermissions } from '@/lib/types'
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
import { Trash2, PlusCircle, ShieldCheck, User as UserIcon, MoreVertical, Pencil } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { appSettings as fallbackSettings } from '@/lib/data'


const settingsSchema = z.object({
  pharmacyName: z.string().min(2, { message: "يجب أن يكون اسم الصيدلية حرفين على الأقل." }),
  pharmacyAddress: z.string().default(""),
  pharmacyPhone: z.string().default(""),
  pharmacyEmail: z.string().email({ message: "بريد إلكتروني غير صالح." }).or(z.literal("")).default(""),
  expirationThresholdDays: z.coerce.number().int().positive({ message: "يجب أن يكون عدد الأيام رقمًا صحيحًا موجبًا." }),
  invoiceFooterMessage: z.string().default("شكرًا لزيارتكم!"),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

const addUserSchema = z.object({
    name: z.string().min(3, { message: "الرجاء إدخال اسم مكون من 3 أحرف على الأقل." }),
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح."}),
    pin: z.string().length(6, { message: "يجب أن يتكون رمز PIN من 6 أرقام." }),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

const editUserSchema = z.object({
    name: z.string().min(3, { message: "الرجاء إدخال اسم مكون من 3 أحرف على الأقل." }),
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح."}),
    pin: z.string().optional().refine(val => !val || val.length === 6, { message: "رمز PIN يجب أن يكون 6 أرقام." }),
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
    { key: 'manage_guide', label: 'الوصول إلى الدليل' },
    { key: 'manage_close_month', label: 'الوصول إلى إغلاق الشهر' },
    { key: 'manage_order_requests', label: 'الوصول إلى طلبات الطلب' },
    { key: 'manage_offers', label: 'الوصول إلى العروض' },
    { key: 'manage_hr', label: 'الوصول إلى شؤون الموظفين' },
];

function AddUserDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { registerUser } = useAuth();
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
            resetDialog();
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
                                <FormLabel>رمز PIN</FormLabel>
                                <FormControl><Input type="password"  maxLength={6} {...field} /></FormControl>
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
    const { currentUser, users, deleteUser, updateUser, updateUserPermissions, scopedData, clearPharmacyData } = useAuth();
    
    const { settings: [settings, setSettings] } = scopedData;

    const [isClient, setIsClient] = React.useState(false);
    
    const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
    const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = React.useState(false);
    const [isEditUserDialogOpen, setIsEditUserDialogOpen] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);
    const [currentUserPermissions, setCurrentUserPermissions] = React.useState<UserPermissions | null>(null);
    
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
        const settingsData: AppSettings = {
            pharmacyName: data.pharmacyName,
            pharmacyAddress: data.pharmacyAddress || "",
            pharmacyPhone: data.pharmacyPhone || "",
            pharmacyEmail: data.pharmacyEmail || "",
            expirationThresholdDays: data.expirationThresholdDays,
            invoiceFooterMessage: data.invoiceFooterMessage || "شكرًا لزيارتكم!",
        };
        
        setSettings(settingsData);
    }
    
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

    const handleClearData = async () => {
        if (!currentUser?.pharmacy_id) {
            toast({ variant: "destructive", title: "خطأ", description: "لم يتم العثور على معرف الصيدلية." });
            return;
        }
        await clearPharmacyData();
    }

    const handleDeleteUser = (userToDelete: User) => {
        if (userToDelete.role === 'Admin') {
            toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن حذف حساب المدير.' });
            return;
        }
        deleteUser(userToDelete.id);
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
            manage_guide: true,
            manage_settings: false,
            manage_trash: false,
            manage_salesPriceModification: false,
            manage_users: false,
            manage_previous_sales: false,
            manage_expenses: false,
            manage_tasks: false,
            manage_close_month: false,
            manage_archives: false,
            manage_order_requests: false,
            manage_offers: false,
            manage_hr: false,
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
                setIsPermissionsDialogOpen(false);
                setEditingUser(null);
                setCurrentUserPermissions(null);
            }
        }
    };

    const pharmacyUsers = users.filter(u => u.pharmacy_id === currentUser?.pharmacy_id && u.role !== 'SuperAdmin');
    

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
                                        <div className="flex items-center gap-2 text-right">
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
                                                                    سيتم حذف الموظف {user.name} نهائياً. لا يمكن التراجع عن هذا الإجراء.
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
                <CardContent className="flex flex-wrap gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">مسح جميع بيانات الصيدلية</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                    هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف جميع بيانات هذه الصيدلية بشكل دائم، بما في ذلك المخزون والمبيعات والموظفين. لا يمكن استعادة هذه البيانات. سيتم تسجيل خروجك بعد العملية.
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
                                checked={currentUserPermissions[p.key as keyof UserPermissions]}
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
                            <FormItem>
                                <FormLabel>رمز PIN الجديد (اختياري)</FormLabel>
                                <FormControl>
                                    <Input type="password"  maxLength={6} {...field} placeholder="اتركه فارغًا لعدم التغيير" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={editUserForm.control} name="confirmPin" render={({ field }) => (
                            <FormItem><FormLabel>تأكيد رمز PIN الجديد</FormLabel><FormControl><Input type="password"  maxLength={6} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter className="pt-4">
                            <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                            <Button type="submit" variant="success">حفظ التغييرات</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

    </div>
  )
}


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
import { useLocalStorage } from '@/hooks/use-local-storage'
import { appSettings as fallbackSettings, trash as fallbackTrash, sales as fallbackSales } from '@/lib/data'
import type { AppSettings, User, UserPermissions, TrashItem, Sale } from '@/lib/types'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAuth } from '@/hooks/use-auth'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trash2, PlusCircle, ShieldCheck, UploadCloud, X } from 'lucide-react'
import { clearAllDBData } from '@/hooks/use-local-storage'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Image from 'next/image'


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

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

function AddUserDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { registerUser } = useAuth();
    const { toast } = useToast();
    const addUserForm = useForm<AddUserFormValues>({
        resolver: zodResolver(addUserSchema),
        defaultValues: { name: "", email: "", pin: "" }
    });
    const [image1, setImage1] = React.useState<File | null>(null);
    const [image2, setImage2] = React.useState<File | null>(null);
    const [image1Preview, setImage1Preview] = React.useState<string | null>(null);
    const [image2Preview, setImage2Preview] = React.useState<string | null>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2) => {
        const file = e.target.files?.[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            if (imageNumber === 1) {
                setImage1(file);
                setImage1Preview(preview);
            } else {
                setImage2(file);
                setImage2Preview(preview);
            }
        }
    };
    
    const resetDialog = () => {
        addUserForm.reset();
        setImage1(null);
        setImage2(null);
        setImage1Preview(null);
        setImage2Preview(null);
        onOpenChange(false);
    }

    const onAddUserSubmit = async (data: AddUserFormValues) => {
        if (!image1 || !image2) {
            toast({ variant: 'destructive', title: 'صور ناقصة', description: 'الرجاء رفع الصورتين المطلوبتين للموظف.' });
            return;
        }

        try {
            const image1DataUri = await fileToDataUri(image1);
            const image2DataUri = await fileToDataUri(image2);
            const success = await registerUser(data.name, data.email, data.pin, image1DataUri, image2DataUri);
            if (success) {
                toast({ title: "تم إضافة الموظف بنجاح!" });
                resetDialog();
            } else {
                toast({ variant: 'destructive', title: "البريد الإلكتروني مستخدم", description: "هذا البريد الإلكتروني مسجل بالفعل." });
            }
        } catch (error) {
             toast({ variant: 'destructive', title: 'خطأ في رفع الصور', description: 'حدثت مشكلة أثناء معالجة الصور. الرجاء المحاولة مرة أخرى.' });
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
                        <div className="grid grid-cols-2 gap-4 pt-2">
                             {[1, 2].map(num => (
                                <div key={num} className="space-y-2">
                                    <Label htmlFor={`employee-image${num}`}>الصورة الشخصية {num}</Label>
                                    <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-2 text-center hover:border-primary transition-colors h-28 flex items-center justify-center">
                                        {(num === 1 ? image1Preview : image2Preview) ? (
                                            <>
                                                <Image src={num === 1 ? image1Preview! : image2Preview!} alt={`Preview ${num}`} width={100} height={100} className="rounded-md object-cover h-24 w-24" />
                                                <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 bg-destructive/80 text-destructive-foreground hover:bg-destructive" onClick={() => {
                                                    if (num === 1) { setImage1(null); setImage1Preview(null); }
                                                    else { setImage2(null); setImage2Preview(null); }
                                                }}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="space-y-1 text-center">
                                                <UploadCloud className="mx-auto h-6 w-6 text-muted-foreground" />
                                                <p className="text-xs text-muted-foreground">ارفع صورة</p>
                                            </div>
                                        )}
                                        <Input id={`employee-image${num}`} type="file" accept="image/*" onChange={(e) => handleImageChange(e, num as 1 | 2)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                                    </div>
                                </div>
                            ))}
                        </div>
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
    const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', fallbackSettings);
    const [trash, setTrash] = useLocalStorage<TrashItem[]>('trash', fallbackTrash);
    const [sales] = useLocalStorage<Sale[]>('sales', fallbackSales);
    const [isClient, setIsClient] = React.useState(false);
    const { currentUser, users, setUsers, registerUser, updateUserPermissions } = useAuth();
    
    const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
    const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);
    const [currentUserPermissions, setCurrentUserPermissions] = React.useState<UserPermissions | null>(null);

    const settingsForm = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: { ...fallbackSettings },
    });

    React.useEffect(() => {
        setIsClient(true);
        if (settings) {
            settingsForm.reset({ ...fallbackSettings, ...settings });
        }
    }, [settings, settingsForm]);

    const onSettingsSubmit = (data: SettingsFormValues) => {
        setSettings(data);
        toast({
            title: "تم حفظ الإعدادات بنجاح!",
        })
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

    const handleDeleteUser = (user: User) => {
        if (user.role === 'Admin') {
            toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن حذف حساب المدير.' });
            return;
        }

        const hasSales = sales.some(sale => sale.employeeId === user.id);
        if (hasSales) {
            toast({ variant: 'destructive', title: 'لا يمكن الحذف', description: 'هذا الموظف مرتبط بسجلات مبيعات ولا يمكن حذفه.' });
            return;
        }

        const newTrashItem: TrashItem = {
            id: `TRASH-${Date.now()}`,
            deletedAt: new Date().toISOString(),
            itemType: 'user',
            data: user,
        };
        setTrash(prev => [newTrashItem, ...prev]);
        setUsers(prev => prev.filter(u => u.id !== user.id));
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
                                <TableHead>البريد الإلكتروني</TableHead>
                                <TableHead>الدور</TableHead>
                                <TableHead className="text-left">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        {user.image1DataUri ? (
                                            <Image src={user.image1DataUri} alt={user.name} width={32} height={32} className="rounded-full object-cover" />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-muted" />
                                        )}
                                        {user.name}
                                    </TableCell>
                                    <TableCell>{user.email || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                                            {user.role === 'Admin' ? 'مدير' : 'موظف'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-left">
                                        {user.role !== 'Admin' && (
                                            <div className="flex items-center justify-start gap-0">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => openPermissionsDialog(user)}>
                                                                <ShieldCheck className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>إدارة الصلاحيات</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                         <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>حذف الموظف</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
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
                                            </div>
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

    </div>
  )
}

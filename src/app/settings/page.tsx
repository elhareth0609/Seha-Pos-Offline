
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
import { Skeleton } from '@/components/ui/skeleton'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAuth } from '@/hooks/use-auth'
import { Trash2, ShieldCheck, User as UserIcon, XIcon, PlusCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { appSettings as fallbackSettings } from '@/lib/data'
import { Switch } from '@/components/ui/switch'


const settingsSchema = z.object({
  pharmacyName: z.string().min(2, { message: "يجب أن يكون اسم الصيدلية حرفين على الأقل." }),
  pharmacyAddress: z.string().default(""),
  pharmacyPhone: z.string().default(""),
  pharmacyEmail: z.string().email({ message: "بريد إلكتروني غير صالح." }).or(z.literal("")).default(""),
  invoiceFooterMessage: z.string().default("شكرًا لزيارتكم!"),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

const addUserSchema = z.object({
    name: z.string().min(3, { message: "الرجاء إدخال اسم مكون من 3 أحرف على الأقل." }),
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح."}),
    pin: z.string().min(6, { message: "يجب أن يتكون رمز PIN من 6 أرقام عل الأقل." }),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

const editUserSchema = z.object({
    name: z.string().min(3, { message: "الرجاء إدخال اسم مكون من 3 أحرف على الأقل." }),
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح."}),
    pin: z.string().optional().refine(val => !val || val.length < 6, { message: "يجب أن يتكون رمز PIN من 6 أرقام عل الأقل." }),
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
    { key: 'manage_reports', label: 'الوصول إلى الفواتير' },
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
    { key: 'manage_close_month', label: 'الوصول إلى إغلاق الشهر' },
    { key: 'manage_order_requests', label: 'الوصول إلى طلبات الطلب' },
    { key: 'manage_offers', label: 'الوصول إلى العروض' },
    { key: 'manage_exchange', label: 'الوصول إلى Pharma Swap' },
    // { key: 'manage_representatives', label: 'الوصول إلى المندوبين' },
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
                                <FormControl><Input type="password" {...field} /></FormControl>
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
    const { currentUser, users, scopedData, clearPharmacyData, updateUserPinRequirement } = useAuth();
    const { settings: [settings, setSettings] } = scopedData;

    const [isClient, setIsClient] = React.useState(false);
    const [isSecurityDialogOpen, setIsSecurityDialogOpen] = React.useState(false);
    const [newSubstance, setNewSubstance] = React.useState('');

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
        const settingsData: AppSettings = {
            ...settings, // preserve existing settings
            pharmacyName: data.pharmacyName,
            pharmacyAddress: data.pharmacyAddress || "",
            pharmacyPhone: data.pharmacyPhone || "",
            pharmacyEmail: data.pharmacyEmail || "",
            invoiceFooterMessage: data.invoiceFooterMessage || "شكرًا لزيارتكم!",
        };
        setSettings(settingsData);
    }

    const handleClearData = async () => {
        if (!currentUser?.pharmacy_id) {
            toast({ variant: "destructive", title: "خطأ", description: "لم يتم العثور على معرف الصيدلية." });
            return;
        }
        await clearPharmacyData();
    }

    const handlePinRequirementChange = (userId: string, requirePin: boolean) => {
        updateUserPinRequirement(userId, requirePin);
    };

    const handleAddControlledSubstance = () => {
        if (!newSubstance.trim()) return;
        const currentList = settings.controlled_substances || [];
        if (currentList.map(s => s.toLowerCase()).includes(newSubstance.trim().toLowerCase())) {
            toast({ variant: 'destructive', title: 'مادة مكررة', description: 'هذه المادة العلمية موجودة بالفعل في القائمة.' });
            return;
        }
        const updatedList = [...currentList, newSubstance.trim()];
        setSettings({ ...settings, controlled_substances: updatedList });
        setNewSubstance('');
    }

    const handleRemoveControlledSubstance = (substanceToRemove: string) => {
        const updatedList = (settings.controlled_substances || []).filter(s => s !== substanceToRemove);
        setSettings({ ...settings, controlled_substances: updatedList });
    }

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
                      إدارة الإعدادات العامة للصيدلية. تؤثر هذه الإعدادات على الفواتير والفواتير والتنبيهات.
                    </CardDescription>
                  </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={settingsForm.control} name="pharmacyName" render={({ field }) => (
                            <FormItem><FormLabel>اسم الصيدلية</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={settingsForm.control} name="pharmacyAddress" render={({ field }) => (
                            <FormItem><FormLabel>العنوان</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={settingsForm.control} name="pharmacyPhone" render={({ field }) => (
                                <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={settingsForm.control} name="pharmacyEmail" render={({ field }) => (
                                <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                         <FormField control={settingsForm.control} name="invoiceFooterMessage" render={({ field }) => (
                            <FormItem><FormLabel>رسالة تذييل الفاتورة</FormLabel><FormControl><Textarea {...field} placeholder="شكرًا لزيارتكم!" /></FormControl>
                              <FormDescription>هذه الرسالة ستظهر في أسفل كل فاتورة مطبوعة.</FormDescription>
                              <FormMessage />
                            </FormItem>
                         )}/>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" variant="success">حفظ التغييرات</Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
        
        {currentUser.role === 'Admin' && (
             <Card>
                <CardHeader>
                    <CardTitle>إدارة الأدوية الخاضعة للرقابة</CardTitle>
                    <CardDescription>
                        أضف الأسماء العلمية للأدوية التي تتطلب إدخال رمز PIN عند بيعها. سيتم تطبيق هذه القاعدة على كل دواء تجاري يحتوي على هذه المادة الفعالة.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex gap-2">
                        <Input 
                            placeholder="مثال: Pregabalin"
                            value={newSubstance}
                            onChange={(e) => setNewSubstance(e.target.value)}
                        />
                        <Button onClick={handleAddControlledSubstance} variant="outline">
                             <PlusCircle className="me-2 h-4 w-4"/> إضافة
                        </Button>
                    </div>
                    {(settings.controlled_substances && settings.controlled_substances.length > 0) && (
                        <div className="space-y-2">
                            <Label>القائمة الحالية:</Label>
                            <div className="flex flex-wrap gap-2">
                                {settings.controlled_substances.map(substance => (
                                    <div key={substance} className="flex items-center gap-1 bg-muted rounded-full px-3 py-1 text-sm">
                                        <span>{substance}</span>
                                        <button onClick={() => handleRemoveControlledSubstance(substance)} className="text-muted-foreground hover:text-destructive">
                                            <XIcon className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        )}
        
        {/* {currentUser.role === 'Admin' && (
            <Card>
                <CardHeader>
                    <CardTitle>إعدادات الحذف الآمن</CardTitle>
                    <CardDescription>
                        قم بتفعيل خيار طلب رمز PIN قبل تنفيذ أي عملية حذف لحماية بياناتك من الحذف العرضي أو غير المصرح به.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {pharmacyUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-2 border rounded-md">
                            <Label htmlFor={`pin-switch-${user.id}`} className="cursor-pointer">
                                <div className="font-medium">{user.name}</div>
                                <div className="text-xs text-muted-foreground">{user.role === 'Admin' ? 'مدير' : 'موظف'}</div>
                            </Label>
                            <Switch
                                dir='ltr'
                                id={`pin-switch-${user.id}`}
                                checked={user.require_pin_for_delete}
                                onCheckedChange={(checked) => handlePinRequirementChange(user.id, checked)}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>
        )} */}

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
                            <AlertDialogFooter className='sm:space-x-reverse'>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90">نعم، امسح كل شيء</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        )}
    </div>
  )
}


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
import { Trash2, ShieldCheck, User as UserIcon } from 'lucide-react'
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

export default function SettingsPage() {
    const { toast } = useToast()
    const { currentUser, users, scopedData, clearPharmacyData, updateUserPinRequirement } = useAuth();
    const { settings: [settings, setSettings] } = scopedData;

    const [isClient, setIsClient] = React.useState(false);
    const [isSecurityDialogOpen, setIsSecurityDialogOpen] = React.useState(false);

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
                      إدارة الإعدادات العامة للصيدلية. تؤثر هذه الإعدادات على الفواتير والتقارير.
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
                                id={`pin-switch-${user.id}`}
                                checked={user.require_pin_for_delete}
                                onCheckedChange={(checked) => handlePinRequirementChange(user.id, checked)}
                            />
                        </div>
                    ))}
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
    </div>
  )
}

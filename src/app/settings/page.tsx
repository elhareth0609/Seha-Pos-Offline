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
import { appSettings as fallbackSettings } from '@/lib/data'
import type { AppSettings } from '@/lib/types'
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
} from "@/components/ui/dialog"
import { Skeleton } from '@/components/ui/skeleton'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAuth } from '@/hooks/use-auth'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trash2, PlusCircle } from 'lucide-react'
import { clearAllDBData } from '@/hooks/use-local-storage'

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
});

type AddUserFormValues = z.infer<typeof addUserSchema>;


export default function SettingsPage() {
    const { toast } = useToast()
    const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', fallbackSettings);
    const [isClient, setIsClient] = React.useState(false);
    const { currentUser, users, deleteUser, registerUser } = useAuth();
    const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);

    const settingsForm = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: { ...fallbackSettings },
    });
    
    const addUserForm = useForm<AddUserFormValues>({
        resolver: zodResolver(addUserSchema),
        defaultValues: { name: "" }
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

    const onAddUserSubmit = async (data: AddUserFormValues) => {
        const success = await registerUser(data.name);
        if (success) {
            toast({ title: "تم إضافة الموظف بنجاح!" });
            setIsAddUserOpen(false);
            addUserForm.reset();
        } else {
            // This case should not happen with the new simplified logic
            toast({ variant: 'destructive', title: "حدث خطأ" });
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

    const handleDeleteUser = async (userId: string, userName: string) => {
        const success = await deleteUser(userId);
        if (success) {
            toast({ title: "تم حذف الموظف", description: `تم حذف ${userName} بنجاح.` });
        } else {
            toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن حذف حساب المدير.' });
        }
    }


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
                        <Button type="submit">حفظ التغييرات</Button>
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
                            إضافة، عرض، وحذف أسماء الموظفين لإسناد المبيعات.
                        </CardDescription>
                    </div>
                    <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm"><PlusCircle className="me-2 h-4 w-4" /> إضافة موظف</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>إضافة موظف جديد</DialogTitle>
                            </DialogHeader>
                            <Form {...addUserForm}>
                                <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4 py-2">
                                    <FormField
                                        control={addUserForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>اسم الموظف</FormLabel>
                                                <FormControl><Input placeholder="اسم الموظف الكامل" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter className="pt-4">
                                        <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                                        <Button type="submit" disabled={addUserForm.formState.isSubmitting}>إضافة الموظف</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الاسم</TableHead>
                                <TableHead>الدور</TableHead>
                                <TableHead className="text-left">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                                            {user.role === 'Admin' ? 'مدير' : 'موظف'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-left">
                                        {user.role !== 'Admin' && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            سيتم حذف الموظف {user.name} بشكل نهائي.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id, user.name)} className="bg-destructive hover:bg-destructive/90">
                                                            نعم، قم بالحذف
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
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
    </div>
  )
}

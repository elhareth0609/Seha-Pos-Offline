
"use client"

import * as React from 'react'
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
import { Label } from "@/components/ui/label"
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

export default function SettingsPage() {
    const { toast } = useToast()
    const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', fallbackSettings);
    const [currentSettings, setCurrentSettings] = React.useState<AppSettings>(settings);

    React.useEffect(() => {
        setCurrentSettings(settings);
    }, [settings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        const target = e.target as HTMLInputElement;

        setCurrentSettings(prev => ({
            ...prev,
            [id]: target.type === 'number' ? (parseInt(value, 10) || 0) : value
        }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setSettings(currentSettings);
        toast({
            title: "تم حفظ الإعدادات بنجاح!",
        })
    }

    const handleClearData = () => {
        if (typeof window !== 'undefined') {
            localStorage.clear();
            alert("تم مسح جميع البيانات بنجاح. سيتم إعادة تحميل الصفحة.");
            window.location.reload();
        }
    }

  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>الإعدادات العامة</CardTitle>
            <CardDescription>
              إدارة الإعدادات العامة للصيدلية.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="pharmacyName">اسم الصيدلية</Label>
                    <Input id="pharmacyName" value={currentSettings.pharmacyName} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pharmacyAddress">العنوان</Label>
                    <Textarea id="pharmacyAddress" value={currentSettings.pharmacyAddress} onChange={handleInputChange} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="pharmacyPhone">رقم الهاتف</Label>
                        <Input id="pharmacyPhone" type="tel" value={currentSettings.pharmacyPhone} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pharmacyEmail">البريد الإلكتروني</Label>
                        <Input id="pharmacyEmail" type="email" value={currentSettings.pharmacyEmail} onChange={handleInputChange} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="expirationThresholdDays">تنبيه انتهاء الصلاحية (بالأيام)</Label>
                    <Input id="expirationThresholdDays" type="number" value={currentSettings.expirationThresholdDays} onChange={handleInputChange}/>
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit">حفظ التغييرات</Button>
            </CardFooter>
          </form>
        </Card>
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
    </div>
  )
}

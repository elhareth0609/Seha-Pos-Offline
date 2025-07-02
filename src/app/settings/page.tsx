
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
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsPage() {
    const { toast } = useToast()
    const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', fallbackSettings);
    const [currentSettings, setCurrentSettings] = React.useState<AppSettings | null>(null);

    React.useEffect(() => {
        // This ensures that we have the latest settings from localStorage
        // and safely merges them with defaults. This effect runs on the client after hydration.
        setCurrentSettings({ ...fallbackSettings, ...(settings || {}) });
    }, [settings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!currentSettings) return;
        const { id, value } = e.target;
        const target = e.target as HTMLInputElement;

        setCurrentSettings(prev => {
            if (!prev) return null; // Should not happen but for type safety
            return {
                ...prev,
                [id]: target.type === 'number' ? (parseInt(value, 10) || 0) : value
            }
        });
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentSettings) return;
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

    // Render a loading state until the settings are loaded on the client
    if (!currentSettings) {
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
                    <Input id="pharmacyName" value={currentSettings.pharmacyName || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pharmacyAddress">العنوان</Label>
                    <Textarea id="pharmacyAddress" value={currentSettings.pharmacyAddress || ''} onChange={handleInputChange} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="pharmacyPhone">رقم الهاتف</Label>
                        <Input id="pharmacyPhone" type="tel" value={currentSettings.pharmacyPhone || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pharmacyEmail">البريد الإلكتروني</Label>
                        <Input id="pharmacyEmail" type="email" value={currentSettings.pharmacyEmail || ''} onChange={handleInputChange} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="expirationThresholdDays">تنبيه انتهاء الصلاحية (بالأيام)</Label>
                    <Input id="expirationThresholdDays" type="number" value={currentSettings.expirationThresholdDays || 0} onChange={handleInputChange}/>
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

"use client"

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

export default function SettingsPage() {
    const { toast } = useToast()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        toast({
            title: "تم حفظ الإعدادات بنجاح!",
            description: "في تطبيق حقيقي، سيتم حفظ هذه البيانات في قاعدة البيانات.",
        })
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>الإعدادات</CardTitle>
        <CardDescription>
          إدارة الإعدادات العامة للصيدلية. ملاحظة: هذه الواجهة للعرض فقط ولن يتم حفظ التغييرات.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="pharmacy-name">اسم الصيدلية</Label>
                <Input id="pharmacy-name" defaultValue="صيدلية مدستوك" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="pharmacy-address">العنوان</Label>
                <Textarea id="pharmacy-address" defaultValue="123 شارع الصحة، المدينة الطبية" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="pharmacy-phone">رقم الهاتف</Label>
                    <Input id="pharmacy-phone" type="tel" defaultValue="964-7701234567" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pharmacy-email">البريد الإلكتروني</Label>
                    <Input id="pharmacy-email" type="email" defaultValue="contact@medstock.com" />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="expiration-threshold">تنبيه انتهاء الصلاحية (بالأيام)</Label>
                <Input id="expiration-threshold" type="number" defaultValue="90" />
            </div>
        </CardContent>
        <CardFooter>
            <Button type="submit">حفظ التغييرات</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
